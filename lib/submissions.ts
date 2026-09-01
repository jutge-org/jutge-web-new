import { parseProblemKey } from '@/lib/problems'
import type { AllTables, Submission } from '@/lib/jutge_api_client'
import { includesForSearch } from '@/lib/utils'

export type SubmissionsDefaultColumnField =
    'problem_id' | 'submission_id' | 'verdict' | 'compiler_id' | 'time_inMs' | 'annotation'

export type SubmissionsProblemColumnField =
    'language_id' | 'submission_id' | 'verdict' | 'compiler_id' | 'time_inMs' | 'annotation'

export type SubmissionsColumnField = SubmissionsDefaultColumnField | SubmissionsProblemColumnField

export type SubmissionsColumnVisibility = Record<SubmissionsColumnField, boolean>

export const DEFAULT_SUBMISSIONS_COLUMN_VISIBILITY: SubmissionsColumnVisibility = {
    problem_id: true,
    language_id: true,
    submission_id: true,
    verdict: true,
    compiler_id: true,
    time_inMs: true,
    annotation: true,
}

export const SUBMISSIONS_COLUMN_LABELS: Record<SubmissionsColumnField, string> = {
    problem_id: 'Problem',
    language_id: 'Language',
    submission_id: 'Submission',
    verdict: 'Verdict',
    compiler_id: 'Compiler',
    time_inMs: 'Time',
    annotation: 'Annotation',
}

export type SubmissionsVerdictFilter = 'all' | 'accepted' | 'pending' | 'rejected'

function buildSubmissionSearchHaystack(row: SubmissionRow): string {
    return [
        row.problem_id,
        row.problemTitle,
        row.submission_id,
        row.verdict,
        row.verdictFullName,
        row.verdict_info ?? '',
        row.compiler_id,
        row.compilerFullName,
        row.annotation ?? '',
    ].join(' ')
}

export function buildProblemSubmissionSearchHaystack(row: ProblemSubmissionRow): string {
    return [buildSubmissionSearchHaystack(row), row.language_id, row.languageTitle].join(' ')
}

function matchesSubmissionVerdictFilter(verdict: string, filter: SubmissionsVerdictFilter): boolean {
    switch (filter) {
        case 'all':
            return true
        case 'accepted':
            return verdict === 'AC'
        case 'pending':
            return verdict === 'Pending'
        case 'rejected':
            return verdict !== 'AC' && verdict !== 'Pending'
    }
}

export function filterSubmissions<T extends SubmissionRow>(
    rows: T[],
    searchQuery: string,
    verdictFilter: SubmissionsVerdictFilter,
    buildHaystack: (row: T) => string = buildSubmissionSearchHaystack,
): T[] {
    const query = searchQuery.trim()

    return rows.filter(
        (row) =>
            matchesSubmissionVerdictFilter(row.verdict, verdictFilter) && includesForSearch(buildHaystack(row), query),
    )
}

export type SubmissionOkKoCounts = {
    ok: number
    ko: number
}

export function tallySubmissionOkKo(rows: Pick<SubmissionRow, 'verdict'>[]): SubmissionOkKoCounts {
    let ok = 0
    let ko = 0

    for (const row of rows) {
        if (row.verdict === 'AC') {
            ok += 1
        } else if (row.verdict !== 'Pending') {
            ko += 1
        }
    }

    return { ok, ko }
}

export function parseSubmissionTime(time_in: Submission['time_in']): Date {
    if (typeof time_in === 'number') return new Date(time_in)
    return new Date(time_in)
}

export function formatSubmissionTime(time_in: Submission['time_in']): string {
    return parseSubmissionTime(time_in).toLocaleString()
}

export const PENDING_SUBMISSION_REFRESH_INTERVAL_MS = 5000
export const PENDING_SUBMISSION_REFRESH_MAX_COUNT = 10

export function submissionVerdict(submission: Submission): string {
    return submission.veredict ?? (submission.state === 'done' ? '—' : 'Pending')
}

export function buildSubmissionHref(problem_id: string, submission_id: string): string {
    return `/problems/${problem_id}/submissions/${submission_id}`
}

export type LastSubmissionInfo = {
    submission_id: string
    submissionHref: string
}

export function buildLastSubmissionsByProblemNm(submissions: Submission[]): Map<string, LastSubmissionInfo> {
    const latest = new Map<string, { submission: Submission; timeMs: number }>()

    for (const submission of submissions) {
        const parsed = parseProblemKey(submission.problem_id)
        if (parsed.kind !== 'problem_id' && parsed.kind !== 'problem_nm') {
            continue
        }

        const timeMs = parseSubmissionTime(submission.time_in).getTime()
        const current = latest.get(parsed.problem_nm)
        if (!current || timeMs > current.timeMs) {
            latest.set(parsed.problem_nm, { submission, timeMs })
        }
    }

    const result = new Map<string, LastSubmissionInfo>()
    for (const [problem_nm, { submission }] of latest) {
        result.set(problem_nm, {
            submission_id: submission.submission_id,
            submissionHref: buildSubmissionHref(submission.problem_id, submission.submission_id),
        })
    }

    return result
}

export const PRIVATE_TESTCASE_NAME = '[privates]'

export function isLinkableTestcase(testcase: string): boolean {
    return testcase !== PRIVATE_TESTCASE_NAME
}

export function buildSubmissionTestcaseHref(
    problemKey: string,
    submission_id: string,
    testcase: string,
): string | null {
    if (!isLinkableTestcase(testcase)) {
        return null
    }

    return `${buildSubmissionHref(problemKey, submission_id)}/diffs/${testcase}`
}

export type SubmissionNavLinks = {
    previousHref: string | null
    listHref: string
    nextHref: string | null
    lastHref: string | null
}

const SUBMISSION_CODE_EDITOR_PATH = /^\/problems\/[^/]+\/submissions\/[^/]+\/code(\/view)?$/
const SUBMISSION_TESTCASE_DIFF_EDITOR_PATH = /^\/problems\/[^/]+\/submissions\/[^/]+\/diffs\/[^/]+\/diff(\/view)?$/
const SUBMISSION_DEBUG_EDITOR_PATH = /^\/problems\/[^/]+\/submissions\/[^/]+\/debug\/view$/
const SUPERVISION_SUBMISSION_CODE_EDITOR_PATH =
    /^\/supervision\/[^/]+\/[^/]+\/problems\/[^/]+\/submissions\/[^/]+\/code$/
const SUPERVISION_SUBMISSION_TESTCASE_DIFF_EDITOR_PATH =
    /^\/supervision\/[^/]+\/[^/]+\/problems\/[^/]+\/submissions\/[^/]+\/diffs\/[^/]+\/diff$/

export function isFullscreenSubmissionEditorPath(pathname: string): boolean {
    return (
        SUBMISSION_CODE_EDITOR_PATH.test(pathname) ||
        SUBMISSION_TESTCASE_DIFF_EDITOR_PATH.test(pathname) ||
        SUBMISSION_DEBUG_EDITOR_PATH.test(pathname) ||
        SUPERVISION_SUBMISSION_CODE_EDITOR_PATH.test(pathname) ||
        SUPERVISION_SUBMISSION_TESTCASE_DIFF_EDITOR_PATH.test(pathname)
    )
}

export function buildSubmissionNavLinks(
    submissions: Submission[],
    currentSubmissionId: string,
    pageKey: string,
    subpath = '',
): SubmissionNavLinks | null {
    const sorted = [...submissions].sort(
        (a, b) => parseSubmissionTime(b.time_in).getTime() - parseSubmissionTime(a.time_in).getTime(),
    )
    const index = sorted.findIndex((submission) => submission.submission_id === currentSubmissionId)
    if (index === -1) {
        return null
    }

    const href = (submissionId: string) => `/problems/${pageKey}/submissions/${submissionId}${subpath}`

    return {
        previousHref: index < sorted.length - 1 ? href(sorted[index + 1].submission_id) : null,
        listHref: `/problems/${pageKey}/submissions`,
        nextHref: index > 0 ? href(sorted[index - 1].submission_id) : null,
        lastHref: index > 0 ? href(sorted[0].submission_id) : null,
    }
}

export type SubmissionRow = {
    submission_id: string
    /**
     * Unique across submissions. submission_id restarts at S001 for every problem, so it
     * repeats in any list that spans problems and cannot be used alone as a React key.
     */
    rowKey: string
    submissionHref: string
    problem_id: string
    problem_nm: string
    problemTitle: string
    problemHref: string
    iconUrl: string | null
    verdict: string
    verdictFullName: string
    verdict_info: string | null
    verdictEmoji?: string
    compiler_id: string
    compilerFullName: string
    time_in: string
    time_inMs: number
    annotation: string | null
}

export type ProblemSubmissionRow = SubmissionRow & {
    language_id: string
    languageTitle: string
    languageHref: string
}

export function buildSubmissionRow(
    submission: Submission,
    tables: AllTables,
    problemTitles: Map<string, string>,
    problemIconUrls: Map<string, string | null> = new Map(),
): SubmissionRow {
    const parsed = parseProblemKey(submission.problem_id)
    const problem_nm = parsed.kind === 'problem_id' ? parsed.problem_nm : submission.problem_id
    const problemTitle =
        problemTitles.get(submission.problem_id) ?? problemTitles.get(problem_nm) ?? submission.problem_id
    const problemHref =
        parsed.kind === 'problem_id' ? `/problems/${parsed.problem_nm}` : `/problems/${submission.problem_id}`
    const iconUrl = problemIconUrls.get(submission.problem_id) ?? problemIconUrls.get(problem_nm) ?? null

    const verdict = submissionVerdict(submission)
    const verdictMeta = tables.verdicts[verdict]
    const compilerMeta = tables.compilers[submission.compiler_id]

    return {
        submission_id: submission.submission_id,
        rowKey: `${submission.problem_id}:${submission.submission_id}`,
        submissionHref: buildSubmissionHref(submission.problem_id, submission.submission_id),
        problem_id: submission.problem_id,
        problem_nm,
        problemTitle,
        problemHref,
        iconUrl,
        verdict,
        verdictFullName: verdictMeta?.name ?? verdict,
        verdict_info: submission.veredict_info,
        verdictEmoji: verdictMeta?.emoji,
        compiler_id: submission.compiler_id,
        compilerFullName: compilerMeta?.name ?? submission.compiler_id,
        time_in: formatSubmissionTime(submission.time_in),
        time_inMs: parseSubmissionTime(submission.time_in).getTime(),
        annotation: submission.annotation,
    }
}

export function buildProblemSubmissionRow(
    submission: Submission,
    tables: AllTables,
    languageTitles: Map<string, string>,
): ProblemSubmissionRow {
    const row = buildSubmissionRow(submission, tables, languageTitles)
    const parsed = parseProblemKey(submission.problem_id)
    const language_id = parsed.kind === 'problem_id' ? parsed.language_id : submission.problem_id

    return {
        ...row,
        language_id,
        languageTitle: languageTitles.get(submission.problem_id) ?? language_id,
        languageHref: `/problems/${submission.problem_id}`,
    }
}
