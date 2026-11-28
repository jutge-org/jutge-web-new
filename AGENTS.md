# Instructions

Do not open browsers or run tests unless explicitly instructed.

# Project rules

- Prefer `fs/promises` over `fs` for all I/O.
- Component names are PascalCase. Lucide icons use an `Icon` suffix. Icon buttons have a tooltip.
- Never edit `components/ui/**` or `lib/jutge_api_client.ts` (regenerate the client with `bun run update-jutge-client`).
- Do not use a mono font for ids. `problem_nm`, `problem_id`, and `submission_id` are URL-friendly: do not encode them.
- Meet standard accessibility on every page and component.
- Prefer client components. Show a spinner (`PageSpinner` from `ClientGates`) while page widgets load.
- Public links never include `/exam-site`. Use `usePublicPathname()` / `toPublicPathname()` when the router pathname may still carry that prefix.
- A page shared by the normal site and the live sites lives under `app/(normal)/` and is re-exported from `app/(exam)/exam-site/` (`export { default } from '…'`). Live-only pages live only under `app/(exam)/exam-site/`.

## Terminology

- Guest users are not authenticated. Auth users are authenticated by the API. Every auth user is a student.
- Instructors can create and manage problems, courses, lists, and exams. Some users are tutors of a course.
- During a live exam, the course owner and its tutors are controllers.
- Contests are exams with a public ranking. Live contests and exams run on different hosts.

# Architecture

Use this section to locate code. Check the feature lookup lists first, then the data-flow layers.

## Site modes

One deployment serves three sites. The hostname selects the mode in `lib/siteMode.ts`. `proxy.ts` applies it on each request.

- Normal — hosts `jutge.org`, `new.jutge.org`, `localhost`; API `https://api.jutge.org/api` (`NEXT_PUBLIC_JUTGE_API_URL`); routes `app/(normal)/`.
- Exam — hosts `exam.jutge.org`, `exam.jutge.net`, `exambach.jutge.net`; API `https://exam.api.jutge.org/api`; routes rewritten to `app/(exam)/exam-site/`.
- Contest — hosts `contest.jutge.org`, `contest.jutge.net`, `contestbach.jutge.net`; API `https://contest.api.jutge.org/api`; routes rewritten to `app/(exam)/exam-site/`.

Public exam and contest URLs stay `/`, `/problems`, and so on. `proxy.ts` rewrites them to `EXAM_SITE_PREFIX` (`/exam-site`), which never appears in the browser. A direct request for `/exam-site` on any host is rewritten to a missing path. Contest hosts also serve `/watch`; exam hosts do not.

`applyLiveApiClient()` in `lib/jutge.ts` points the browser client at the exam or contest API and drops `x-forwarded-host`. Normal mode leaves the client URL alone. Exam and contest APIs do not expose `student.settings.get` / `student.settings.set`; guard with `supportsStudentSettingsApi()` / `isStudentSettingsApiAvailable()`.

## Directory map

- `app/` — Next.js App Router: root layout, shared header helpers, route groups for the two sites.
- `app/(normal)/` — Full site: students, instructors, supervisors, administrators, docs, about.
- `app/(exam)/exam-site/` — Exam and contest UI. Shared routes re-export the normal page; live-only routes are real pages here.
- `app/layout.tsx` — Root server layout: theme, `SiteModeProvider`, `AuthProvider`, settings, appearance. Metadata brand comes from the request host.
- `app/MainBreadcrumbsInLayout.tsx` — Normal-site header breadcrumbs and audience nav. Wired from `AppShell`.
- `app/LiveBreadcrumbsInLayout.tsx` — Live-site header breadcrumbs. Wired from `LiveAppShell`.
- `proxy.ts` — Hostname to site mode and exam/contest rewrite.
- `components/` — React UI by domain (`problems/`, `submissions/`, `instructor/`, `live/`, …).
- `components/AppShell.tsx` — Normal chrome: breadcrumbs, command palette, recents, auth toolbar, footer. Wired from `app/(normal)/layout.tsx`.
- `components/live/LiveAppShell.tsx` — Live chrome: live breadcrumbs, clock, exam widget, live auth toolbar. Wired from `app/(exam)/exam-site/layout.tsx` (skipped for `/exam-floating-widget`).
- `components/ui/` — shadcn primitives. Do not edit.
- `lib/siteMode.ts` — Host lists, API URLs, public-path helpers, `applyLiveApiClient()`.
- `lib/data/` — Client read helpers and mutation wrappers: fetch from the Jutge API, decode/transform, return typed view data.
- `lib/instructor/client.ts` — Instructor API guard (`withInstructorClient`) and fetch/mutation helpers. Normal site only.
- `lib/administrator/client.ts` — Administrator API guard (`withAdminClient`) and fetch/mutation helpers. Normal site only.
- `lib/supervisor/client.ts` — Supervisor/tutor API guard (`withSupervisorClient`). Normal site only.
- `lib/session.ts` — `SessionUser`, `profileToSessionUser()`, role helpers (`canAccessSupervision`).
- `lib/{about,documentation,interpreters,utilities,instructor,administrator}.ts` — Nav and index link config for shells and breadcrumbs.
- `lib/liveNav.ts` — Live header nav (student, tutor, signed-out). Contest adds `/watch` and, once started, the student ranking.
- `actions/instructor/` — Remaining `'use server'` entry points for Node-only work (`makeExamPdf`, CSV/XLS parsing).
- `lib/` — Pure helpers, domain logic, Monaco/highlight config. `lib/jutge.ts` is the browser singleton client.
- `hooks/` — Client hooks (preferences, Monaco/hljs themes, mobile, `usePublicPathname`).
- `store/` — Zustand client state (e.g. `store/MainBreadcrumbs.ts`).
- `content/` — Documentation source: FAQ JSON and markdown, served via `app/api/content/**`.

## Data flow

```
proxy.ts  →  hostname selects normal | exam | contest
             live hosts rewrite public paths to /exam-site

app/layout.tsx (server)  →  SiteModeProvider, AuthProvider, settings, appearance
       ↓
app/(normal)/layout.tsx            →  AppShell
app/(exam)/exam-site/layout.tsx    →  LiveAppShell
       ↓
page  →  useEffect + jutge / lib/data/*   (most pages are 'use client')
       ↓
components/**  →  lib/data/* | lib/instructor/client | lib/administrator/client  →  jutge (singleton)
       ↓
Jutge API (HTTPS). Normal: api.jutge.org. Exam/contest: applyLiveApiClient() retargets the client.
Token in jutge.meta from localStorage.
```

- Most pages are client components. Data loads in `useEffect` via `lib/data/*` or direct `jutge` calls.
- Shared pages (problem detail, submissions, interpreters, utilities, about, documentation) are written once under `app/(normal)/` and re-exported from the matching `app/(exam)/exam-site/` path, including layouts.
- Live-only pages (home, problem list, documents, ranking, statistics, participants, IP control, finish, profile, passcodes, watch, floating widget) live under `app/(exam)/exam-site/` and use `components/live/`.
- Thin server pages wrap about/docs shells (`AboutPageShell`, `DocumentationPageShell`): about timeline pages, the docs index, and the unlisted certificates and markdown pages. Verdicts and compilers are thin server shells around client `*PageContent` components that fetch in `useEffect`.
- Auth (normal): `AuthProvider` uses `NormalAuthProvider`, stores token and expiration in `localStorage`, sets `jutge.meta`, exposes `useAuth()`.
- Auth (exam/contest): `AuthProvider` renders `LiveSessionProvider`. Sign-in is `auth.getReadyExams` then `auth.loginExam` (`lib/data/liveAuth.ts`). `useAuth()` still works; live UI also uses `useLiveSession()` (phase, role, running exam).
- Role gates in `components/ClientGates.tsx` (`AuthedGate`, `InstructorGate`, `AdministratorGate`, `SupervisorGate`) use `LoginGate` / `AccessDeniedGate`. These gates are for the normal site.
- Instructor writes: `lib/instructor/client.ts` via `withInstructorClient` (checks the instructor role with `jutge.student.profile.get()`).
- Administrator writes: `lib/administrator/client.ts` via `withAdminClient`.
- Supervisor reads and writes: `lib/data/supervision.ts`, `lib/data/supervisionActions.ts`, `lib/supervisor/client.ts` via `withSupervisorClient`.
- Problem asset downloads (PDF, zip, template, solution file) are client-side via `lib/downloadProblemAssets.ts`, with no per-problem `route.ts` handlers.
- Command palette (normal site only): `components/CommandPalette.tsx` loads data from `lib/data/commandPalette.ts`; sections come from `lib/commandPaletteSections.ts`.
- Server-only: `actions/instructor/makeExamPdf.ts` (pandoc/ghostscript), `actions/instructor/csv.ts` (CSV/XLS), `app/api/hljs-themes/**` (CSS from `node_modules`), `app/api/content/**` (markdown from `content/`).

## Problem URLs and identifiers

- The `[key]` segment is a problem name (`P68688`) or a problem id (`P68688_en`). Parse it with `parseProblemKey()` in `lib/problems.ts`.
- Resolve a concrete `problem_id` with `resolveProblemId()` in `lib/data/problemDetail.ts`.
- Problem sub-routes share a shell via `ProblemDetail` and `ProblemNav`. Tab config is in `lib/problemNav.ts`.
- Submission code, debug output, and testcase diffs use `…/view/` pages under the submission route, not separate API routes.

## Auth and API client

- `default jutge` in `lib/jutge.ts` — all client API calls. Live modes retarget `JUTGE_API_URL` at import.
- `useSiteMode()` in `components/SiteModeProvider.tsx` — current `kind` (`normal` | `exam` | `contest`) and API URL.
- `usePublicPathname()` in `hooks/usePublicPathname.ts` — router path with `/exam-site` stripped.
- `useAuth()` in `components/AuthProvider.tsx` — login state, profile, login/logout. On live hosts this is the live session.
- `useLiveSession()` in `components/live/LiveSessionProvider.tsx` — exam/contest phase, role (`student` | `tutor`), running exam.
- `AuthedGate`, `PageSpinner`, and related gates in `components/ClientGates.tsx` — role-gated page shells and loading placeholders.
- `SessionUser`, `profileToSessionUser()` in `lib/session.ts` — typed session user and role checks.
- In `lib/data/auth.ts`: `tryGetCurrentUser()` (optional user from `jutge.meta`), `isAuthenticated()` (`jutge.meta.token` is set), `getCurrentClient()` (authenticated `jutge` for mutations), `getProblemsApiClient()` (problem calls, works without auth).
- `withInstructorClient` in `lib/instructor/client.ts`, `withAdminClient` in `lib/administrator/client.ts`, `withSupervisorClient` in `lib/supervisor/client.ts` — role-guarded API calls.
- `resolveSiteMode()`, `applyLiveApiClient()` in `lib/siteMode.ts` — host to mode, and pointing the client at the live API.

API types and client methods are in `lib/jutge_api_client.ts` (generated; do not edit; run `bun run update-jutge-client`).

## Naming patterns (for search)

- `fetch*` in `lib/data/` — client read helper (`fetchProblemDetail`, `fetchSubmissionDetail`).
- `*Actions.ts` in `lib/data/` — validated client mutation (`submissionsActions.ts`, `coursesActions.ts`).
- `*Mutations.ts` in `lib/data/` — thin client write helper (`usersMutations.ts`, `coursesMutations.ts`).
- `with*Client` in `lib/*/client.ts` — role-guarded API wrapper (`withInstructorClient`, `withAdminClient`).
- `lib/instructor/client.ts` — instructor API surface (`fetchInstructorCourse`, …).
- `*Row`, `*Data` in `lib/` — view-model types and builders (`SubmissionRow`, `ProblemDetailData`).
- `*View` in `components/` — page or section UI (`SubmissionDetailView`, `ProblemsSearchView`).
- `*PageContent` in `components/` — client section inside a thin server page (`VerdictsPageContent`, `CompilersPageContent`).
- `Live*` in `components/live/` — exam/contest UI (`LiveHome`, `LiveRankingPage`).
- `use*` in `store/` — Zustand selectors and actions (`useMainBreadcrumbs`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
