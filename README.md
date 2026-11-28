# Jutge Open Web

The open-source web client for [Jutge.org](https://jutge.org) — the virtual learning environment for computer programming at UPC.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

Students solve programming problems, submit code, take exams, and follow courses. Instructors manage rosters, problem lists, and rankings. Supervisors follow a student's work in a course. Administrators monitor platform health. The same build also serves the live exam and contest sites. This repository is the modern Next.js frontend; the backend is the [Jutge API](https://api.jutge.org/documentation).

## Features

| Area               | What it covers                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| **Students**       | Problems, submissions, diffs, exams, courses, activity, awards, profile                                 |
| **Instructors**    | Courses, lists, exams, documents, problem authoring, semantic search, JutgeAI                           |
| **Supervisors**    | A student's problems, submissions, and solutions inside a course                                        |
| **Administrators** | Users, statistics, heatmaps, queue, rankings                                                            |
| **Live sites**     | Exam and contest hosts: sign-in, problems, submissions, ranking, documents, contest watch               |
| **Platform**       | Auth, command palette, interpreters, utilities, accessibility, theming, Monaco editor, xterm            |

Interpreters run Python (Pyodide and PyWeb) and C++ (JSCPP) in the browser. Utilities include a translator, code editor, whiteboard, clock, and black screen.

## Site modes

One deployment serves three sites. The hostname selects the mode (`lib/siteMode.ts`); `proxy.ts` applies it on each request.

| Mode        | Typical hosts                                              | API                                              |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------ |
| **Normal**  | `jutge.org`, `new.jutge.org`, `localhost`                  | `https://api.jutge.org/api`                      |
| **Exam**    | `exam.jutge.org`, `exam.jutge.net`, `exambach.jutge.net`   | `https://exam.api.jutge.org/api`                 |
| **Contest** | `contest.jutge.org`, `contest.jutge.net`, `contestbach.jutge.net` | `https://contest.api.jutge.org/api`       |

Normal mode is the full app under `app/(normal)/`. Exam and contest hosts keep public URLs such as `/` and `/problems`, and the proxy rewrites them internally to `app/(exam)/exam-site/`. That prefix never appears in the browser. Contest hosts also expose `/watch`; exam hosts do not.

Unknown hosts stay in normal mode. Extra hostnames can be mapped with `NEXT_PUBLIC_SITE_MODE_HOSTS` (see [Configure environment](#2-configure-environment)).

## Tech stack

- **Runtime:** [Bun](https://bun.sh)
- **Framework:** Next.js 16 (App Router), React 19
- **Styling:** Tailwind CSS 4, shadcn-style UI
- **Notable libraries:** Monaco, xterm, ag-grid, recharts, Zustand
- **API:** Generated TypeScript client via `@jutge.org/cli` (do not hand-edit `lib/jutge_api_client.ts`)

Most pages are client components. They load data in the browser through `lib/data/` and the `jutge` singleton. The token lives in `localStorage`.

## Project layout

```
app/(normal)/          → full site (students, instructors, supervisors, administrators)
app/(exam)/exam-site/  → exam and contest UI (rewritten; not part of public URLs)
components/            → UI by domain (problems, instructor, live, exams, …)
lib/data/              → client reads and mutations against the API
lib/                   → shared helpers, site mode, generated API client
actions/               → server-only work (exam PDFs, spreadsheet parsing)
content/               → markdown and FAQ source
proxy.ts               → hostname → site mode, and the exam/contest rewrite
```

See [AGENTS.md](AGENTS.md) for coding conventions and the feature lookup table.

## Quick start

### Prerequisites

You need [Bun](https://bun.sh) installed.

### 1. Install dependencies

```bash
bun install
```

Install the Jutge API client CLI when you need to regenerate `lib/jutge_api_client.ts`:

```bash
bun add -g @jutge.org/cli
bun run update-jutge-client
```

The generated client is already in the repository, so this step is only required after the API changes.

### 2. Configure environment

Copy [.env.sample](.env.sample) to `.env` in the project root. Every variable there is optional for local development against the public API. Restart the dev server after changing them; `NEXT_PUBLIC_*` values are picked up at build time in production.

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_JUTGE_API_URL` | Normal-mode API (default `https://api.jutge.org/api`). |
| `NEXT_PUBLIC_JUTGE_EXAM_API_URL` | Exam API (default `https://exam.api.jutge.org/api`). |
| `NEXT_PUBLIC_JUTGE_CONTEST_API_URL` | Contest API (default `https://contest.api.jutge.org/api`). |
| `JUTGE_DOMAIN` | Optional `x-forwarded-host` on normal-mode API requests. Exam and contest clients do not send it. |
| `NEXT_PUBLIC_SITE_MODE_HOSTS` | JSON map of hostname to `"normal"`, `"exam"`, or `"contest"`. Unknown hosts stay normal. |
| `JUTGE_DEV_HOST` | Set to `exam` or `contest` so `http://localhost:3000` uses that live site. Restart the dev server after changing it. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key for registration, password reset, email change, and unregistration. Those flows skip the check when it is unset. |
| `ALLOWED_DEV_ORIGINS` | Comma-separated extra dev origins for Next.js. |

`JUTGE_API_URL` is the server-side default inside the generated client. The browser uses the `NEXT_PUBLIC_*` URLs above, and live modes override the client URL at runtime.

To work on the exam or contest UI locally:

```bash
# .env
JUTGE_DEV_HOST=exam
```

Then open [http://localhost:3000](http://localhost:3000). Use `contest` instead of `exam` for the contest site, including `/watch`.

### 3. Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The page auto-updates as you edit files.

## Development

### Format the code

```bash
bun run format
```

### Lint

```bash
bun run lint
```

### Find unused dependencies

```bash
bun run knip
```

### Before opening a pull request

```bash
bun run format && bun run lint && bun run build
```

## Production

Build and start the production server:

```bash
bun run build
bun run start
```

A container image is defined in [Dockerfile](Dockerfile). It builds a Next.js standalone output and listens on port `8015`. Pass the reCAPTCHA site key at build time when registration should be protected:

```bash
bun run docker-build
bun run docker-run
```

## Contributing

We welcome contributions. You can:

- Pick a [good first issue](https://github.com/jutge-org/jutge-open-web/issues?q=is%3Aissue+is%3Aopen+label%3A%22good%20first%20issue%22)
- Fix bugs and polish the UI
- Improve accessibility
- Improve docs and onboarding
- Report issues with clear reproduction steps

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Open an issue before large refactors; small, focused pull requests are easier to review.

## Related projects

- [Jutge API](https://api.jutge.org/documentation) — backend API and documentation
- [jutge-vscode](https://github.com/jutge-org/jutge-vscode) — VS Code extension
- [jutge-toolkit](https://github.com/jutge-org/jutge-toolkit) — official Jutge toolkit
- [jutge-org on GitHub](https://github.com/jutge-org/) — all Jutge.org repositories
- [Publications about Jutge.org](https://jutge.org/about/publications) — research and papers

## Documentation

- [AGENTS.md](AGENTS.md) — project rules for contributors and coding agents
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to contribute
- [Jutge API documentation](https://api.jutge.org/documentation)
- In-app docs at `/documentation` when running locally

## Contributors

Jutge.org has been built and maintained over many years by a large team. See [Credits on Jutge.org](https://jutge.org/about/credits) for the full list.

Current maintenance:

- [Jordi Petit](https://github.com/jordi-petit)
- [Pau Fernández](https://github.com/pauek)

## License

Copyright © Universitat Politècnica de Catalunya — BarcelonaTech, 2026.

Licensed under the [Apache License, Version 2.0](LICENSE).
