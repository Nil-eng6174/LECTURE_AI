import { observable } from "@trpc/server/observable";
import { TRPCLink } from "@trpc/client";
import { AppRouter } from "../../../server/routers";
import { demoLecture, searchLectures } from "./demoData";

// Keep a local list for updates
let localLectures = [demoLecture];
let isAuthed = false;

export const mockLink: TRPCLink<AppRouter> = () => {
  return ({ op }) => {
    return observable((observer) => {
      const { path, input } = op;
      
      setTimeout(() => {
        try {
          let data: any = null;
          const isAuthed = !!window.localStorage.getItem("fake-auth");

          if (path === "auth.me") {
            data = isAuthed ? { name: "Local User", email: "user@local.com", openId: "123", id: 1 } : null;
          } else if (path === "auth.logout") {
            window.localStorage.removeItem("fake-auth");
            data = { success: true };
          } else if (path === "auth.updateProfile") {
            data = { success: true };
          } else if (path === "lectures.list") {
            data = {
              lectures: localLectures,
              isDemoMode: !isAuthed,
              counts: {
                total: localLectures.length,
                assignments: localLectures.reduce((sum, item) => sum + item.analysis.assignments.length, 0),
              }
            };
          } else if (path === "lectures.get") {
            const req = input as { id: string };
            data = localLectures.find(l => l.id === req.id);
            if (!data) throw new Error("Not found");
          } else if (path === "lectures.search") {
            const req = input as { query: string };
            const normalized = req.query.trim().toLowerCase();
            data = localLectures.flatMap((lecture) => {
              const matches = lecture.transcript.filter((segment) => segment.text.toLowerCase().includes(normalized));
              return matches.slice(0, 4).map((segment) => ({
                lectureId: lecture.id,
                lectureTitle: lecture.title,
                timestamp: segment.startTime,
                context: segment.text,
              }));
            });
          } else if (path === "lectures.chat") {
            data = {
              answer: "This is a simulated frontend-only response. The AI backend is disabled.",
              source: 0,
              grounded: true
            };
          } else if (path === "lectures.studyMaterial") {
            data = {
              markdown: "# Simulated Study Material\n\nThis is a frontend-only demo. AI generation is disabled.",
              grounded: true
            };
          } else if (path === "lectures.upload") {
            const req = input as any;
            const newLecture = {
              ...demoLecture,
              id: `lecture-${Date.now()}`,
              title: req.title,
              isDemo: false,
            };
            localLectures = [newLecture, ...localLectures];
            data = { lecture: newLecture, storedUrl: "dummy-url" };
          } else if (path === "lectures.remove") {
            const req = input as { id: string };
            localLectures = localLectures.filter(l => l.id !== req.id);
            data = { success: true };
          } else {
            throw new Error(`Mock path not implemented: ${path}`);
          }

          observer.next({
            result: {
              type: "data",
              data,
            }
          });
          observer.complete();
        } catch (err) {
          observer.error(err as any);
        }
      }, 500); // add a slight delay to simulate network
    });
  };
};
