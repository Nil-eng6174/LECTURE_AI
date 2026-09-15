# LectureAI API

All feature APIs are exposed through typed tRPC procedures under `/api/trpc`. The examples below describe the contracts implemented in `server/routers.ts`.

| Procedure | Access | Purpose |
| --- | --- | --- |
| `auth.me` | Public | Returns the current Manus OAuth user or `null`. |
| `auth.logout` | Public | Clears the session cookie. |
| `lectures.list` | Public/demo-aware | Returns the demo lecture plus the current user's working catalog. |
| `lectures.get` | Public/demo-aware | Returns one lecture with analysis, timeline, and transcript. |
| `lectures.search` | Public/demo-aware | Searches transcript text and returns source lecture and timestamps. |
| `lectures.chat` | Public/demo-aware | Sends a selected lecture's transcript context to the server-side LLM. |
| `lectures.studyMaterial` | Public/demo-aware | Generates lecture-grounded revision material via the server-side LLM. |
| `lectures.upload` | Protected | Validates, stores, transcribes, and registers an audio/video upload. |
| `lectures.remove` | Protected | Deletes an uploaded lecture reference; demo content cannot be deleted. |

## Error behavior

Procedures use tRPC error codes for `NOT_FOUND`, `BAD_REQUEST`, `PAYLOAD_TOO_LARGE`, `PRECONDITION_FAILED`, and `INTERNAL_SERVER_ERROR`. The UI renders toast errors, loading states, empty states, and explicit demo labels rather than pretending an integration succeeded.
