# Project rules

- Prefer `fs/promises` over `fs` for all I/O operations.
- Components names should be PascalCase.
- Always use "Icon" suffix for Lucide icons.
- Never modify files in the `components/ui` directory.
- Never modify the `lib/jutge_api_client.ts` file.
- Do not use mono font for ids.
- problem ids and submission ids are URL friendly, do not encode them.
- All icon buttons should have a tooltip.
- Ensure standard accessibility of all pages and components.
- Use clients components instead of server components when possible.
- Try to display the widgets of the page with an spinner while loading the data.

## Architecture

Use this section to locate code quickly. Prefer the **feature lookup table** first, then follow the **data-flow** layers.

### Directory map

| Path                                                    | Role                                                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                                                  | Next.js App Router: mostly **client** pages (`'use client'`), thin server pages for about/docs shells, layouts, and API route handlers (`app/api/**/route.ts`). |
| `app/MainBreadcrumbsInLayout.tsx`                       | Client header breadcrumbs and audience nav menus. Wired from `AppShell`.                                                                                        |
| `components/`                                           | React UI grouped by domain (`problems/`, `submissions/`, `instructor/`, …). Shared shell in `components/general/`, `components/layout/`.                        |
| `components/AppShell.tsx`                               | Root app chrome: `AuthProvider`, `RecentsProvider`, header (breadcrumbs, command palette, auth toolbar), footer. Wired from `app/layout.tsx`.                   |
| `components/ui/`                                        | shadcn primitives — **do not edit**.                                                                                                                            |
| `lib/data/`                                             | Client-side read helpers and mutation wrappers: fetch from Jutge API, decode/transform, return typed view data.                                                 |
| `lib/instructor/client.ts`                              | Instructor API guard (`withInstructorClient`) and fetch/mutation helpers.                                                                                       |
| `lib/administrator/client.ts`                           | Administrator API guard (`withAdminClient`) and fetch/mutation helpers.                                                                                         |
| `lib/supervisor/client.ts`                              | Supervisor/tutor API guard (`withSupervisorClient`).                                                                                                            |
| `lib/session.ts`                                        | `SessionUser` type, `profileToSessionUser()`, role helpers (`canAccessSupervision`).                                                                            |
| `lib/{about,documentation,instructor,administrator}.ts` | Nav/index link config for shells and breadcrumbs.                                                                                                               |
| `actions/instructor/`                                   | Remaining `'use server'` entry points for Node-only work (`makeExamPdf`, CSV/XLS parsing).                                                                      |
| `lib/`                                                  | Pure helpers, domain logic, Monaco/highlight config. `lib/jutge.ts` is the browser singleton client.                                                            |
| `hooks/`                                                | Client-side React hooks (preferences, Monaco/hljs themes, mobile).                                                                                              |
| `store/`                                                | Zustand client state (e.g. `store/MainBreadcrumbs.ts`).                                                                                                         |
| `content/`                                              | Markdown source for documentation pages (served via `app/api/content/**`).                                                                                      |

### Data flow

```
app/layout.tsx (server)  →  AppShell (client: AuthProvider, header, footer)
       ↓
app/**/page.tsx  →  useEffect + jutge / lib/data/*   (most pages are 'use client')
       ↓
components/**  →  lib/data/* | lib/instructor/client | lib/administrator/client  →  jutge (singleton)
       ↓
Jutge API (HTTPS, token in jutge.meta from localStorage)
```

- **Most pages are client components.** Data loads in `useEffect` via `lib/data/*` or direct `jutge` calls. Use `PageSpinner` from `ClientGates` while loading.
- **Thin server pages** wrap about/docs shells (`AboutPageShell`, `DocumentationPageShell`): about timeline pages, docs index, and markdown pages that render `<MarkdownDoc />`. Some docs routes (verdicts, compilers) are thin server shells around client `*PageContent` components that fetch in `useEffect`.
- **Auth:** `components/AuthProvider.tsx` stores token/expiration in `localStorage`, sets `jutge.meta`, exposes `useAuth()`.
- **Role gates:** `components/ClientGates.tsx` (`AuthedGate`, `InstructorGate`, `AdministratorGate`, `SupervisorGate`) use `LoginGate` / `AccessDeniedGate`.
- **Instructor writes:** `lib/instructor/client.ts` via `withInstructorClient` (checks instructor role via `jutge.student.profile.get()`).
- **Administrator writes:** `lib/administrator/client.ts` via `withAdminClient`.
- **Supervisor reads/writes:** `lib/data/supervision.ts`, `lib/data/supervisionActions.ts`, `lib/supervisor/client.ts` via `withSupervisorClient`.
- **Problem asset downloads** (PDF, zip, template, solution file): client-side via `lib/downloadProblemAssets.ts` — no per-problem `route.ts` handlers.
- **Command palette:** `components/CommandPalette.tsx` loads data from `lib/data/commandPalette.ts`; sections from `lib/commandPaletteSections.ts`.
- **Server-only:** `actions/instructor/makeExamPdf.ts` (pandoc/ghostscript), `actions/instructor/csv.ts` (CSV/XLS), `app/api/hljs-themes/**` (reads CSS from `node_modules`), `app/api/content/**` (reads markdown from `content/`).

### Routes by audience

| Audience          | Route prefix                                                                          | Components                                                               | Data layer                                                                    |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Students (public) | `/problems/public`, `/courses/public`                                                 | `components/problems/`, `components/courses/`                            | `lib/data/problems.ts`, `lib/data/courses.ts`                                 |
| Students (authed) | `/problems`, `/submissions`, `/exams`, `/courses`, `/awards`, `/activity`, `/profile` | `components/problems/`, `submissions/`, `exams/`, `courses/`, `profile/` | `lib/data/submissions.ts`, `lib/data/exams.ts`, `lib/data/statistics.ts`, …   |
| Supervisors       | `/supervision/**`                                                                     | `components/supervision/`                                                | `lib/data/supervision.ts`, `lib/supervisor/client.ts`                         |
| Instructors       | `/instructor/**`                                                                      | `components/instructor/**`                                               | `lib/instructor/client.ts`, `lib/instructor/*`, `lib/data/lists.ts`           |
| Administrators    | `/administrator/**`                                                                   | `components/administrator/**`                                            | `lib/administrator/client.ts`                                                 |
| Docs / about      | `/documentation/**`, `/about/**`                                                      | `components/documentation/`, `components/about/`                         | `lib/documentation.ts`, `lib/about.ts`, `lib/data/tables.ts`                  |

Instructor layout (`app/instructor/layout.tsx`) gates with `InstructorGate`. Administrator pages use `AdministratorGate`. Authed student pages use `AuthedGate`. Supervision pages use `SupervisorGate`.

### Feature lookup

| Feature                           | Routes (`app/`)                                                                            | Components                                                                     | lib/data / client modules                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Home                              | `/`                                                                                        | `HomePageGuest`, `HomePageUser`                                                | `lib/data/misc.ts`                                                                                                       |
| Command palette                   | —                                                                                          | `CommandPalette`                                                               | `lib/data/commandPalette.ts`, `lib/commandPaletteSections.ts`                                                            |
| Problem list & search             | `problems/(list)/`, `problems/search/`, `problems/public/`                                 | `ProblemsList`, `ProblemsSearchView`                                           | `lib/data/problems.ts`, `lib/data/problemsActions.ts`                                                                    |
| Problem detail (statement)        | `problems/[key]/(detail)/`                                                                 | `ProblemDetail`, `ProblemStatement`, `ProblemHeaderCard`, `ProblemNav`         | `lib/data/problemDetail.ts`, `lib/downloadProblemAssets.ts`                                                              |
| Problem testcases                 | `problems/[key]/testcases/`                                                                | `ProblemTestcases`                                                             | `lib/data/problemTestcases.ts`                                                                                           |
| Problem solutions                 | `problems/[key]/solutions/`                                                                | `ProblemSolutionAccordionItem`                                                 | `lib/data/problemSolutions.ts`, `lib/data/problemSolutionsActions.ts`                                                    |
| Submissions list                  | `submissions/`, `problems/[key]/submissions/`                                              | `SubmissionsList`, `SubmissionsListToolbar`                                    | `lib/data/submissions.ts`, `lib/data/submissionsActions.ts`                                                              |
| Submission detail & views         | `problems/[key]/submissions/[submission_id]/`, `…/code/view/`, `…/debug/view/`, `…/diffs/` | `SubmissionDetailView`, `SubmissionCodeEditor`                                 | `lib/data/submissions.ts`                                                                                                |
| Activity / statistics             | `/activity`                                                                                | `StatisticsDashboard`                                                          | `lib/data/statistics.ts`                                                                                                 |
| Courses (student)                 | `courses/`, `courses/[course_key]/`, `courses/public/**`                                   | `components/courses/`                                                          | `lib/data/courses.ts`, `lib/data/coursesActions.ts`                                                                      |
| Exams (student)                   | `exams/`, `exams/[key]/`                                                                   | `components/exams/`                                                            | `lib/data/exams.ts`                                                                                                      |
| Awards                            | `awards/`, `awards/[id]/`                                                                  | `components/awards/`                                                           | `lib/data/awards.ts`                                                                                                     |
| Profile & registration            | `profile/**`, `registration/`, `password-reset/`                                           | `components/profile/`, `registration/`, `password-reset/`                      | `lib/data/users.ts`, `lib/data/profileActions.ts`, `lib/data/registrationActions.ts`, `lib/data/passwordResetActions.ts` |
| Supervision                       | `supervision/`, `supervision/[course_key]/[email]/`                                        | `SupervisionForm`, `SupervisionStudentView`                                    | `lib/data/supervision.ts`, `lib/data/supervisionActions.ts`                                                              |
| Courses (instructor)              | `instructor/courses/**`                                                                    | `components/instructor/courses/`                                               | `lib/instructor/client.ts`, `lib/instructor/*`                                                                           |
| Lists (instructor)                | `instructor/lists/**`                                                                      | `components/instructor/lists/`                                                 | `lib/instructor/client.ts`, `lib/data/lists.ts`                                                                          |
| Documents (instructor)            | `instructor/documents/**`                                                                  | `components/instructor/documents/`                                             | `lib/instructor/client.ts`, `lib/instructor/documents.ts`                                                                |
| Exams (instructor)                | `instructor/exams/**`                                                                      | `components/instructor/exams/`                                                 | `lib/instructor/client.ts`, `actions/instructor/makeExamPdf.ts`                                                          |
| Problems (instructor)             | `instructor/problems/**`, `instructor/search/`                                             | `components/instructor/problems/`                                              | `lib/instructor/client.ts`, `lib/instructor/problems.ts`                                                                 |
| JutgeAI (instructor)              | `instructor/jutgeai/**`                                                                    | `components/instructor/jutgeai/`                                               | direct `jutge` calls in views                                                                                            |
| Admin dashboard                   | `administrator/**`                                                                         | `components/administrator/`                                                    | `lib/administrator/client.ts`                                                                                            |
| Auth & session                    | —                                                                                          | `AuthProvider`, `SignInDialog`, `AuthToolbar`, `LoginGate`, `AccessDeniedGate` | `lib/jutge.ts`, `lib/session.ts`, `lib/data/auth.ts`                                                                     |
| About                             | `/about/**`                                                                                | `AboutPageShell`, `AboutTimeline`, `components/about/`                         | `lib/about.ts`                                                                                                           |
| Docs markdown                     | `documentation/faq`, `documentation/pylibs`, `documentation/code-metrics`                  | `MarkdownDoc`, `DocumentationPageShell`                                        | `app/api/content/[section]/[filename]/route.ts`                                                                          |
| Docs tables (verdicts, compilers) | `documentation/verdicts/**`, `documentation/compilers/**`                                  | `VerdictsPageContent`, `CompilersPageContent`, …                               | `lib/data/tables.ts`                                                                                                     |

### Problem URLs and identifiers

- URL segment `[key]` is either a **problem name** (`P68688`) or **problem id** (`P68688_en`). Parse with `parseProblemKey()` in `lib/problems.ts`.
- Resolve a concrete `problem_id` from a key with `resolveProblemId()` in `lib/data/problemDetail.ts`.
- Problem sub-routes share a shell via `ProblemDetail` + `ProblemNav`. Tab config lives in `lib/problemNav.ts`.
- Submission code, debug output, and testcase diffs use dedicated `…/view/` pages under the submission route — not separate API routes.
- `problem_nm`, `problem_id`, `submission_id` are URL-friendly — **do not encode** them.

### Auth and API client

| Export / function                       | File                          | Use when                                     |
| --------------------------------------- | ----------------------------- | -------------------------------------------- |
| `default jutge`                         | `lib/jutge.ts`                | All client API calls                         |
| `useAuth()`                             | `components/AuthProvider.tsx` | Login state, profile, login/logout           |
| `AuthedGate`, `PageSpinner`, etc.       | `components/ClientGates.tsx`  | Role-gated page shells, loading placeholders |
| `SessionUser`, `profileToSessionUser()` | `lib/session.ts`              | Typed session user and role checks           |
| `tryGetCurrentUser()`                   | `lib/data/auth.ts`            | Optional user from current `jutge.meta`      |
| `isAuthenticated()`                     | `lib/data/auth.ts`            | Check if `jutge.meta.token` is set           |
| `getCurrentClient()`                    | `lib/data/auth.ts`            | Authenticated `jutge` for mutations          |
| `getProblemsApiClient()`                | `lib/data/auth.ts`            | Problem API calls (works without auth)       |
| `withInstructorClient`                  | `lib/instructor/client.ts`    | Instructor-guarded API calls                 |
| `withAdminClient`                       | `lib/administrator/client.ts` | Administrator-guarded API calls              |
| `withSupervisorClient`                  | `lib/supervisor/client.ts`    | Supervisor/tutor-guarded API calls           |

API types and client methods: `lib/jutge_api_client.ts` (generated — **do not edit**; run `bun run update-jutge-client`).

### Naming patterns (for search)

| Pattern                            | Meaning                                  | Example                                       |
| ---------------------------------- | ---------------------------------------- | --------------------------------------------- |
| `fetch*` in `lib/data/`            | Client read helper                       | `fetchProblemDetail`, `fetchSubmissionDetail` |
| `*Actions.ts` in `lib/data/`       | Validated client mutation                | `submissionsActions.ts`, `coursesActions.ts`  |
| `*Mutations.ts` in `lib/data/`     | Thin client write helper                 | `usersMutations.ts`, `coursesMutations.ts`    |
| `with*Client` in `lib/*/client.ts` | Role-guarded API wrapper                 | `withInstructorClient`, `withAdminClient`     |
| `lib/instructor/client.ts`         | Instructor API surface                   | `fetchInstructorCourse`, …                    |
| `*Row`, `*Data` in `lib/`          | View-model types and builders            | `SubmissionRow`, `ProblemDetailData`          |
| `*View` in `components/`           | Page-level or section UI                 | `SubmissionDetailView`, `ProblemsSearchView`  |
| `*PageContent` in `components/`    | Client section inside a thin server page | `VerdictsPageContent`, `CompilersPageContent` |
| `use*` in `store/`                 | Zustand selectors/actions                | `useMainBreadcrumbs`                          |

### Protected and generated files

- **Never edit:** `components/ui/**`, `lib/jutge_api_client.ts`
- **Regenerate API client:** `bun run update-jutge-client`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
