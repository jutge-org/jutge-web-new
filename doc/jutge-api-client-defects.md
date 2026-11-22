# Jutge API client defects

The generated client in `lib/jutge_api_client.ts` is not edited by hand. This file records comments that disagree with the API, and operations the live exam and contest UI still needs. Regenerate the client with `bun run update-jutge-client` once the API metadata is corrected, then delete the entries that are fixed.

## Treated as solved

These operations are marked `Domains: jutge` only. They are available on the exam and contest API hosts as well. Live mode calls them.

- `tables.get`
- `tables.getLanguages`
- `tables.getCountries`
- `tables.getCompilers`
- `tables.getDrivers`
- `tables.getVerdicts`
- `tables.getProglangs`
- `tables.getTimezones`

Submission lists use `tables.get` for verdict and compiler labels.

## Suspected

Descriptions say these serve exams, contests, or frontend coloring, but the domain comment is `jutge` only. Live mode does not call them until the API confirms the domain list.

- `misc.getExamIcons` — "Exam icon are used in exams and contests to identify problems."
- `misc.getAvatarPacks` — "Avatars are used in exams and contests to identify students or participants."
- `misc.getColors` — color mappings for frontends.
- `misc.getHexColors` — color mappings for frontends.
- `misc.getDemosForCompiler` — compiler demos, marked jutge only.

## Missing operations

These are absent from the client. They are not wrong comments.

- Unauthenticated contest ranking for anonymous spectators. `student.exam.getRanking` requires an exam token, and `tutor.examctl.getRanking` requires an examctl token. The contest watch page calls `fetchPublicContestRanking` and shows an unavailable state until a public operation exists.
- Unauthenticated list of watchable contests. The contest home asks for an exam key (`username:exam_nm`) instead of listing contests.
- Tutor read of another student's source during a live exam. `tutor.submissions.*` is jutge-only and course-scoped. `tutor.examctl.latestSubmissions` returns email, problem, verdict, time, and compiler, not source.
