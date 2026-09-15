import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { addLecture, demoLecture, formatTimestamp, getLecture, listLectures, searchLectures, type LectureRecord } from "./lectureData";
import { upsertUser } from "./db";

const lectureInput = z.object({
  title: z.string().min(2).max(160),
  subject: z.string().max(160).optional(),
  professor: z.string().max(160).optional(),
  lectureDate: z.string().optional(),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  fileData: z.string().min(1),
});

function extractText(response: any) {
  const content = response?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

function contextForLecture(lecture: LectureRecord) {
  return lecture.transcript.map((segment) => `[${formatTimestamp(segment.startTime)}] ${segment.text}`).join("\n");
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure.input(z.object({ name: z.string().min(1).max(120), email: z.string().email() })).mutation(async ({ input, ctx }) => {
      await upsertUser({ openId: ctx.user.openId, name: input.name, email: input.email });
      return { success: true } as const;
    }),
  }),
  lectures: router({
    list: publicProcedure.query(({ ctx }) => {
      const records = listLectures(ctx.user?.id);
      return { lectures: records, isDemoMode: !ctx.user, counts: { total: records.length, assignments: records.reduce((sum, item) => sum + item.analysis.assignments.length, 0) } };
    }),
    get: publicProcedure.input(z.object({ id: z.string() })).query(({ input, ctx }) => {
      const lecture = getLecture(input.id, ctx.user?.id);
      if (!lecture) throw new TRPCError({ code: "NOT_FOUND", message: "Lecture not found" });
      return lecture;
    }),
    search: publicProcedure.input(z.object({ query: z.string().min(1) })).query(({ input, ctx }) => searchLectures(input.query, ctx.user?.id)),
    chat: publicProcedure.input(z.object({ lectureId: z.string(), question: z.string().min(2).max(1000) })).mutation(async ({ input, ctx }) => {
      const lecture = getLecture(input.lectureId, ctx.user?.id);
      if (!lecture) throw new TRPCError({ code: "NOT_FOUND", message: "Lecture not found" });
      const context = contextForLecture(lecture);
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are LectureAI, a grounded lecture assistant. Answer ONLY from the supplied lecture context. If the answer is not present, say exactly: I couldn't find that information in this lecture. Cite timestamps in [MM:SS] format when available. Keep the answer concise and useful." },
            { role: "user", content: `LECTURE: ${lecture.title}\nCONTEXT:\n${context}\n\nQUESTION: ${input.question}` },
          ],
        });
        const answer = extractText(response);
        if (!answer) throw new Error("The AI provider returned an empty response");
        return { answer, source: lecture.transcript.find((segment) => segment.text.toLowerCase().includes(input.question.toLowerCase().split(" ")[0]))?.startTime ?? null, grounded: true };
      } catch (error) {
        console.error("[LectureAI] chat failed", error);
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI couldn't process your question. Configure the built-in AI integration or try again." });
      }
    }),
    studyMaterial: publicProcedure.input(z.object({ lectureId: z.string() })).mutation(async ({ input, ctx }) => {
      const lecture = getLecture(input.lectureId, ctx.user?.id);
      if (!lecture) throw new TRPCError({ code: "NOT_FOUND", message: "Lecture not found" });
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Create study material using ONLY this lecture context. Return markdown with sections: Revision notes, 5 important questions, 5 MCQs with answers, Key definitions, Viva questions. If a detail is not in the lecture, do not invent it." },
            { role: "user", content: contextForLecture(lecture) },
          ],
        });
        return { markdown: extractText(response), grounded: true };
      } catch (error) {
        console.error("[LectureAI] study material failed", error);
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Study material could not be generated. Please configure the AI integration and try again." });
      }
    }),
    upload: protectedProcedure.input(lectureInput).mutation(async ({ input, ctx }) => {
      const raw = Buffer.from(input.fileData, "base64");
      if (raw.byteLength > 16 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Files must be 16MB or smaller for the prototype transcription pipeline." });
      const allowed = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/webm", "audio/ogg", "video/mp4"];
      if (!allowed.includes(input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Use MP3, WAV, M4A, WEBM, OGG, or MP4 files." });
      const key = `${ctx.user.id}-lectures/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      try {
        const stored = await storagePut(key, raw, input.mimeType);
        const transcription = await transcribeAudio({ audioUrl: stored.url, language: "en", prompt: "Transcribe an academic lecture with timestamps." });
        if (!("segments" in transcription)) throw new Error("Transcription provider returned an error");
        const transcript = (transcription.segments ?? []).map((segment: any, index: number) => ({ id: `upload-${index}`, startTime: Math.round(segment.start ?? 0), endTime: Math.round(segment.end ?? segment.start ?? 0), speaker: "Speaker", text: segment.text ?? "" }));
        const base: LectureRecord = { id: `lecture-${Date.now()}`, userId: ctx.user.id, title: input.title, subject: input.subject ?? "General", professor: input.professor ?? "Not specified", lectureDate: input.lectureDate ?? new Date().toISOString().slice(0, 10), duration: Math.round(transcription.duration ?? 0) / 60, status: "completed", createdAt: new Date().toISOString(), topics: [], transcript, timeline: [], analysis: { summary: "Analysis is available after the transcript is generated.", topics: [], keyConcepts: [], importantPoints: [], assignments: [], announcements: [], questions: [], importantDates: [] } };
        addLecture(base);
        return { lecture: base, storedUrl: stored.url };
      } catch (error) {
        console.error("[LectureAI] upload pipeline failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We couldn't process this lecture. Check storage/transcription configuration and try again." });
      }
    }),
    remove: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ input, ctx }) => {
      const lecture = getLecture(input.id, ctx.user.id);
      if (!lecture || lecture.isDemo) throw new TRPCError({ code: "NOT_FOUND", message: "Only your uploaded lectures can be deleted." });
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
