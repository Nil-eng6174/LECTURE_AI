# LectureAI architecture

LectureAI is a single full-stack React and Express application with typed tRPC contracts. The client renders the product surface and calls server procedures; secrets never enter the browser.

## Request flow

```text
Browser
  -> tRPC /api/trpc
    -> auth context (Manus OAuth)
    -> lecture procedure
      -> storagePut (upload)
      -> transcribeAudio (Whisper)
      -> invokeLLM (analysis/chat/study mode)
      -> Drizzle/MySQL persistence boundary
```

## Product boundaries

The `client/src/App.tsx` file provides the experience shell and page-level feature composition. `server/routers.ts` contains the typed procedure boundary. `server/lectureData.ts` isolates the demo catalog and the prototype upload catalog so sample data is explicit and cannot be mistaken for a real user upload. `drizzle/schema.ts` describes the production persistence model.

The runtime uses public procedures for the demo lecture and search so the product can be explored without an account. Upload, deletion, and other personal data operations use protected procedures and the current authenticated user ID. User-level database foreign keys are present in the schema to make cross-account leakage harder to introduce.

## Grounded chat

The selected lecture is resolved server-side. Its timestamped transcript is formatted into a bounded context string and passed to `invokeLLM` with a strict system prompt. The assistant is instructed to refuse questions that cannot be answered from the lecture and to include timestamps when available. A future production version should replace the basic transcript scan with chunk embeddings and a vector database.
