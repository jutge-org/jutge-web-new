# Jutge API client defects

The generated client in `lib/jutge_api_client.ts` is not edited by hand. This file records comments that disagree with the API, and operations the live exam and contest UI still needs. Regenerate the client with `bun run update-jutge-client` once the API metadata is corrected, then delete the entries that are fixed.

## Missing operations

These are absent from the client. They are not wrong comments.

- Tutor read of another student's source during a live exam. `tutor.submissions.*` is jutge-only and course-scoped. `tutor.examctl.latestSubmissions` returns email, problem, verdict, time, and compiler, not source.