# LectureAI

LectureAI is an AI-powered academic memory system. Students upload a lecture recording and receive a searchable transcript, timeline, summary, topics, assignments, announcements, study material, and a lecture-grounded AI assistant.

> **Prototype note:** the app includes one clearly marked **Demo Lecture** so the product can be explored before a user signs in or configures external storage/transcription credentials. Demo data is never presented as a user upload.

## Implemented features

- Polished responsive landing page with product story, how-it-works flow, feature grid, and demo preview.
- Manus OAuth session flow with protected upload and user-scoped data procedures.
- Demo-aware dashboard with real empty, loading, error, and processing states.
- Lecture library with search, status filtering, metadata, and detail cards.
- Upload form for title, subject, professor, date, and audio/video file validation.
- Server-side storage upload through `storagePut`.
- Server-side Whisper transcription hook with timestamped segments.
- Lecture detail tabs: overview, summary, topics, timeline, transcript, assignments, announcements, and AI chat.
- Transcript search and clickable timeline items that jump to source segments.
- Global search returning lecture, context, and timestamp results.
- Assignment aggregation across available lectures.
- Grounded chatbot pipeline that retrieves the selected lecture transcript and asks the server-side LLM to answer only from that context.
- Study mode generation for revision notes, questions, MCQs, definitions, and viva questions.
- Settings page with profile, account, demo mode, and logout controls.
- Drizzle schema and SQL migrations for users, lectures, transcript chunks, lecture analysis, chat sessions, and chat messages.
- GitHub-ready environment hygiene and deployment documentation.

## Architecture

```text
React + Vite + Tailwind
        |
        v
Express + tRPC procedures
        |
        +--> Manus OAuth / user session
        +--> S3-compatible file storage
        +--> Whisper transcription
        +--> Server-side LLM analysis and grounded chat
        +--> Drizzle ORM + MySQL/TiDB
```

The prototype keeps the demo lecture in an isolated in-memory catalog for reliable product exploration. Signed-in uploads go through the real server-side storage and transcription helpers; after transcription the record is added to the working lecture catalog. The database schema is ready for persisting the full pipeline and chat history as the next hardening step.

## Technology stack

- React 19, TypeScript, Vite, Wouter
- Tailwind CSS 4, Lucide icons, Streamdown markdown rendering
- Express 4, tRPC 11, Zod
- Drizzle ORM, MySQL/TiDB-compatible database
- Manus OAuth session and built-in storage, Whisper, and LLM integrations
- Vitest for tests

## Prerequisites

- Node.js 20 or newer
- pnpm 10 or newer
- A configured LectureAI WebDev environment or equivalent Manus environment variables
- A MySQL/TiDB database for production persistence
- Storage, transcription, and LLM access for processing real uploads

## Local installation

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd lectureai
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

Open the local URL printed by the dev server. In the Manus WebDev environment, OAuth, database, storage, transcription, and LLM credentials are injected automatically.

## Environment variables

The scaffold provides the following variables. Never commit `.env`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/TiDB connection string used by Drizzle. |
| `JWT_SECRET` | Session signing secret. |
| `VITE_APP_ID` | Manus OAuth application ID. |
| `OAUTH_SERVER_URL` | Manus OAuth server base URL. |
| `VITE_OAUTH_PORTAL_URL` | Browser-facing login portal URL. |
| `OWNER_OPEN_ID` / `OWNER_NAME` | Project owner metadata. |
| `BUILT_IN_FORGE_API_URL` | Server-side Manus built-in API gateway for LLM, storage, and transcription. |
| `BUILT_IN_FORGE_API_KEY` | Server-side bearer token. Never expose to the frontend. |
| `VITE_FRONTEND_FORGE_API_URL` / `VITE_FRONTEND_FORGE_API_KEY` | Optional frontend-safe built-in API values supplied by the scaffold. |

## AI pipeline

1. The authenticated user selects a supported audio/video file.
2. The backend validates MIME type and keeps the prototype transcription payload below 16MB.
3. `storagePut` stores the bytes server-side and returns a managed storage URL.
4. `transcribeAudio` calls the built-in Whisper integration and returns timestamped segments.
5. Transcript segments are normalized into chunks and associated with the uploaded lecture.
6. The production schema supports structured analysis fields for summary, topics, concepts, important points, assignments, announcements, questions, and dates.
7. The chatbot retrieves only the selected lecture transcript, formats it with timestamps, and sends that context to the server-side LLM. The system prompt explicitly refuses to invent content not present in the lecture.

The demo lecture uses the same frontend contracts and chatbot procedure, but its sample content is explicitly labelled and isolated from real user data.

## Database setup

The project contains Drizzle schema files in `drizzle/schema.ts` and generated migrations in `drizzle/`. Run:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

The core tables are `users`, `lectures`, `transcript_chunks`, `lecture_analysis`, `chat_sessions`, and `chat_messages`. Foreign keys enforce ownership relationships at the database layer. In a production hardening pass, persist the in-memory upload catalog to these tables and add a background job for long-running analysis.

## Production build

```bash
pnpm check
pnpm test
pnpm build
pnpm start
```

## GitHub deployment

```bash
git init
git add .
git commit -m "Initial LectureAI prototype"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Recommended deployment split:

1. Deploy the full-stack Node app to Render, Railway, Cloud Run, or the Manus WebDev runtime.
2. Configure the same environment variables on the backend, including `DATABASE_URL`, OAuth values, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`.
3. Configure a MySQL/TiDB or compatible managed database and run the Drizzle migrations.
4. Keep storage, Whisper, and LLM calls server-side. Do not put private keys in Vite variables.
5. Configure the OAuth callback as `/api/oauth/callback` for the deployed origin.
6. Set CORS and cookie settings to allow the deployed frontend origin if frontend and backend are hosted separately.
7. Run a production smoke test: login, upload a small audio file, wait for transcription, open the lecture, search its transcript, and ask a grounded chat question.

Do not copy a fake repository or service URL into deployment configuration. Replace each `YOUR_*` placeholder with the real URL for your deployment.

## Troubleshooting

- **OAuth does not return to the app:** use the exact deployed origin in the Manus OAuth configuration, and make sure browser cookies are enabled.
- **Upload is rejected:** check the MIME type and keep the prototype file under 16MB; longer recordings should use an asynchronous worker and provider-specific limits.
- **Transcription fails:** confirm the storage URL is reachable by the transcription provider and that the built-in voice integration is available.
- **Chat fails:** inspect server logs for the LLM provider response and verify `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`.
- **No personal lectures appear:** sign in first. The public catalog intentionally contains only the isolated demo lecture.
- **Database migration fails:** verify the database user can create tables and run `pnpm drizzle-kit generate` before `pnpm drizzle-kit migrate`.

## Intentionally deferred

This MVP does not implement live Google Meet capture, real-time lecture assistance, advanced vector embeddings, calendar/deadline sync, teacher portals, collaborative study, payments, or a native mobile application. These are roadmap items rather than fake buttons.

## Phase 2 roadmap

- Live Google Meet integration
- Live lecture assistant and real-time questions
- Advanced vector search and embeddings
- Calendar and deadline integration
- Teacher portal and collaborative study
- Native mobile application
