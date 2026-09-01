import { getPreferredLanguageId } from '@/lib/data/auth'
import {
    buildSubmissionCodeMetricsData,
    parseCodeMetricsResponse,
    shouldShowCodeMetrics,
    type SubmissionCodeMetricsData,
} from '@/lib/codeMetrics'
import { CIRCUITS_COMPILER_ID, parseCircuitTracesJson, parseCircuitTracesSvg, type CircuitTrace } from '@/lib/circuits'
import { decodeSubmissionCodeBase64, MAKE_PRO2_COMPILER_ID } from '@/lib/makePro2SourceCode'
import { isGraphicProblem, parseProblemKey } from '@/lib/problems'
import {
    buildLastSubmissionsByProblemNm,
    buildProblemSubmissionRow,
    buildSubmissionRow,
    formatSubmissionTime,
    submissionVerdict,
    type LastSubmissionInfo,
    type ProblemSubmissionRow,
    type SubmissionRow,
} from '@/lib/submissions'
import type { AwardRow } from '@/lib/awards'
import type {
    AllTables,
    CompilationErrors,
    DebugInformation,
    JutgeApiClient,
    Scoring,
    ScoringPart,
    Submission,
    SubmissionAnalysis,
    TestcaseAnalysis,
} from '@/lib/jutge_api_client'

import { abstractProblemsToIconUrlMap, abstractProblemsToTitleMap } from './problems'
// Awards temporarily unwired
// import { fetchSubmissionAwards } from './awards'
import { fetchAbstractProblem, resolveProblemId } from './problemDetail'

function submissionProblemNms(submissions: { problem_id: string }[]): string[] {
    const nms = new Set<string>()

    for (const submission of submissions) {
        const parsed = parseProblemKey(submission.problem_id)
        if (parsed.kind === 'problem_id' || parsed.kind === 'problem_nm') {
            nms.add(parsed.problem_nm)
        }
    }

    return [...nms].sort()
}

async function submissionsToRows(client: JutgeApiClient, submissions: Submission[]): Promise<SubmissionRow[]> {
    const [tables, preferredLanguageId] = await Promise.all([client.tables.get(), getPreferredLanguageId()])

    const problemNms = submissionProblemNms(submissions)
    let problemTitles = new Map<string, string>()
    let problemIconUrls = new Map<string, string | null>()

    if (problemNms.length > 0) {
        try {
            const abstractProblems = await client.problems.getAbstractProblems(problemNms.join(','))
            problemTitles = abstractProblemsToTitleMap(abstractProblems, preferredLanguageId)
            problemIconUrls = abstractProblemsToIconUrlMap(abstractProblems)
        } catch {
            // Titles fall back to the problem id in buildSubmissionRow.
        }
    }

    return submissions.map((submission) => buildSubmissionRow(submission, tables, problemTitles, problemIconUrls))
}

export async function fetchSubmissionsData(client: JutgeApiClient): Promise<SubmissionRow[]> {
    const submissions = await client.student.submissions.getAll()
    return submissionsToRows(client, submissions)
}

/** The format student.submissions.getRange expects for its bounds. */
function formatRangeBound(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0')
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    )
}

/**
 * Submissions between two instants, newest first.
 *
 * The API reads the bounds in the account's own timezone, so they are formatted as wall-clock
 * time rather than converted to UTC.
 */
export async function fetchSubmissionsInRange(
    client: JutgeApiClient,
    start: Date,
    end: Date,
): Promise<SubmissionRow[]> {
    const submissions = await client.student.submissions.getRange({
        start_time: formatRangeBound(start),
        end_time: formatRangeBound(end),
    })

    return submissionsToRows(client, submissions)
}

/** Submissions of a single calendar day, for a day key coming from the heatmap. */
export async function fetchSubmissionsForDay(client: JutgeApiClient, dayTs: number): Promise<SubmissionRow[]> {
    // Day keys label a calendar date as a UTC midnight, so read the date back in UTC and then
    // ask for that wall-clock day.
    const date = new Date(dayTs * 1000)
    const start = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0)
    const end = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59)

    return fetchSubmissionsInRange(client, start, end)
}

export async function fetchLastSubmissionsByProblemNm(
    client: JutgeApiClient,
): Promise<Map<string, LastSubmissionInfo>> {
    const submissions = await client.student.submissions.getAll()
    return buildLastSubmissionsByProblemNm(submissions)
}

export async function fetchProblemSubmissionsData(
    client: JutgeApiClient,
    problem_nm: string,
    languageTitles: Map<string, string>,
): Promise<ProblemSubmissionRow[]> {
    const [submissions, tables] = await Promise.all([
        client.student.submissions.getForAbstractProblems(problem_nm),
        client.tables.get(),
    ])

    return submissions.map((submission) => buildProblemSubmissionRow(submission, tables, languageTitles))
}

export type SubmissionAnalysisRow = SubmissionAnalysis & {
    verdictEmoji?: string
    verdictFullName: string
}

export type ScoringRow = ScoringPart & {
    verdictEmoji?: string
    verdictFullName: string
}

export type SubmissionDetailCore = {
    submission: Submission
    problemTitle: string
    verdict: string
    verdictFullName: string
    verdictEmoji?: string
    compilerFullName: string
    time_in: string
}

export type SubmissionDetailSections = {
    analysis: SubmissionAnalysisRow[]
    scoring: ScoringRow[] | null
    compilationErrors: CompilationErrors | null
    circuitModules: Record<string, string> | null
    circuitErrorReports: CircuitTrace[] | null
    circuitErrorTraces: string[] | null
}

export type SubmissionSourceContent = {
    code: string
    codeExtension: string | null
    codeFilename: string
}

export const EMPTY_SUBMISSION_SECTIONS: SubmissionDetailSections = {
    analysis: [],
    scoring: null,
    compilationErrors: null,
    circuitModules: null,
    circuitErrorReports: null,
    circuitErrorTraces: null,
}

export type SubmissionDetailData = SubmissionDetailCore &
    SubmissionDetailSections & {
        code: string | null
        codeExtension: string | null
        codeFilename: string | null
        codeMetrics: SubmissionCodeMetricsData | null
        awards: AwardRow[]
        debugInformation: DebugInformation | null
    }

export type FetchSubmissionDetailOptions = {
    isAdministrator?: boolean
    isExamOrContest?: boolean
}

export type SubmissionCodeData = {
    body: Buffer
    contentType: string
    filename: string
}

export type SubmissionTestcaseAnalysisData = {
    testcase: string
    execution: string
    verdict: string
    verdictEmoji?: string
    input: string
    output: string
    expected: string
    outputImageSrc?: string
    expectedImageSrc?: string
}

function decodeTestcaseAnalysis(analysis: TestcaseAnalysis, outputAsImage: boolean): SubmissionTestcaseAnalysisData {
    const decoded: SubmissionTestcaseAnalysisData = {
        testcase: analysis.testcase,
        execution: analysis.execution,
        verdict: analysis.verdict,
        input: Buffer.from(analysis.input_b64, 'base64').toString('utf-8'),
        output: '',
        expected: '',
    }

    if (outputAsImage) {
        decoded.outputImageSrc = `data:image/png;base64,${analysis.output_b64}`
        decoded.expectedImageSrc = `data:image/png;base64,${analysis.expected_b64}`
        return decoded
    }

    decoded.output = Buffer.from(analysis.output_b64, 'base64').toString('utf-8')
    decoded.expected = Buffer.from(analysis.expected_b64, 'base64').toString('utf-8')
    return decoded
}

function submissionProblemNm(submission: Submission): string | null {
    const parsed = parseProblemKey(submission.problem_id)
    if (parsed.kind === 'problem_id' || parsed.kind === 'problem_nm') {
        return parsed.problem_nm
    }
    return null
}

function submissionMatchesProblemKey(submission: Submission, key: string, resolvedProblemId: string): boolean {
    if (submission.problem_id === resolvedProblemId || submission.problem_id === key) {
        return true
    }

    const keyParsed = parseProblemKey(key)
    const keyProblemNm =
        keyParsed.kind === 'problem_id' || keyParsed.kind === 'problem_nm' ? keyParsed.problem_nm : null
    const submissionNm = submissionProblemNm(submission)

    return keyProblemNm !== null && submissionNm === keyProblemNm
}

async function resolveSubmission(
    client: JutgeApiClient,
    key: string,
    resolvedProblemId: string,
    submission_id: string,
): Promise<Submission | null> {
    try {
        return await client.student.submissions.get({ problem_id: resolvedProblemId, submission_id })
    } catch {
        const parsed = parseProblemKey(resolvedProblemId)
        if (parsed.kind !== 'problem_id' && parsed.kind !== 'problem_nm') {
            return null
        }

        const submissions = await client.student.submissions.getForAbstractProblems(parsed.problem_nm)
        return submissions.find((submission) => submission.submission_id === submission_id) ?? null
    }
}

export async function fetchSubmissionCode(
    client: JutgeApiClient,
    key: string,
    submission_id: string,
): Promise<SubmissionCodeData | null> {
    const resolvedProblemId = await resolveProblemId(key)
    if (!resolvedProblemId) {
        return null
    }

    const submission = await resolveSubmission(client, key, resolvedProblemId, submission_id)
    if (!submission || !submissionMatchesProblemKey(submission, key, resolvedProblemId)) {
        return null
    }

    if (submission.state !== 'done') {
        return null
    }

    const [tables, codeB64] = await Promise.all([
        client.tables.get(),
        client.student.submissions.getCodeAsB64({ problem_id: submission.problem_id, submission_id }).catch(() => null),
    ])

    if (!codeB64) {
        return null
    }

    const defaultExtension = tables.compilers[submission.compiler_id]?.extension ?? 'txt'

    return {
        body: Buffer.from(codeB64, 'base64'),
        contentType:
            submission.compiler_id === MAKE_PRO2_COMPILER_ID ? 'application/x-tar' : 'text/plain; charset=utf-8',
        filename: `${submission_id}.${defaultExtension}`,
    }
}

export function decorateAnalysis(analysis: SubmissionAnalysis[], tables: AllTables): SubmissionAnalysisRow[] {
    return analysis.map((row) => ({
        ...row,
        verdictEmoji: tables.verdicts[row.verdict]?.emoji,
        verdictFullName: tables.verdicts[row.verdict]?.name ?? row.verdict,
    }))
}

export function decorateScoring(scoring: Scoring | null, tables: AllTables): ScoringRow[] | null {
    if (!scoring) {
        return null
    }

    return scoring.map((row) => ({
        ...row,
        verdictEmoji: tables.verdicts[row.verdict]?.emoji,
        verdictFullName: tables.verdicts[row.verdict]?.name ?? row.verdict,
    }))
}

export function buildSubmissionDetailCore(
    submission: Submission,
    tables: AllTables,
    problemTitle: string,
): SubmissionDetailCore {
    const verdict = submissionVerdict(submission)
    const verdictMeta = tables.verdicts[verdict]
    const compilerMeta = tables.compilers[submission.compiler_id]

    return {
        submission,
        problemTitle,
        verdict,
        verdictFullName: verdictMeta?.name ?? verdict,
        verdictEmoji: verdictMeta?.emoji,
        compilerFullName: compilerMeta?.name ?? submission.compiler_id,
        time_in: formatSubmissionTime(submission.time_in),
    }
}

async function fetchSubmissionProblemTitle(client: JutgeApiClient, submission: Submission): Promise<string> {
    const parsed = parseProblemKey(submission.problem_id)
    const problem_nm = parsed.kind === 'problem_id' ? parsed.problem_nm : submission.problem_id

    try {
        const [abstractProblems, preferredLanguageId] = await Promise.all([
            client.problems.getAbstractProblems(problem_nm),
            getPreferredLanguageId(),
        ])
        const titles = abstractProblemsToTitleMap(abstractProblems, preferredLanguageId)
        return titles.get(submission.problem_id) ?? titles.get(problem_nm) ?? submission.problem_id
    } catch {
        return submission.problem_id
    }
}

async function fetchSubmissionCodeMetrics(
    client: JutgeApiClient,
    submission: Submission,
): Promise<SubmissionCodeMetricsData | null> {
    const raw = await client.student.submissions
        .getCodeMetrics({ problem_id: submission.problem_id, submission_id: submission.submission_id })
        .catch(() => null)

    const { metrics, solmetrics } = parseCodeMetricsResponse(raw)
    if (!metrics) {
        return null
    }

    return buildSubmissionCodeMetricsData(metrics, solmetrics)
}

export type SubmissionDetailResolved = {
    core: SubmissionDetailCore
    tables: AllTables
}

export async function fetchSubmissionDetailCore(
    client: JutgeApiClient,
    key: string,
    submission_id: string,
): Promise<SubmissionDetailResolved | null> {
    const resolvedProblemId = await resolveProblemId(key)
    if (!resolvedProblemId) {
        return null
    }

    const [submission, tables] = await Promise.all([
        resolveSubmission(client, key, resolvedProblemId, submission_id),
        client.tables.get(),
    ])
    if (!submission || !submissionMatchesProblemKey(submission, key, resolvedProblemId)) {
        return null
    }

    return {
        core: buildSubmissionDetailCore(submission, tables, submission.problem_id),
        tables,
    }
}

export async function fetchSubmissionSections(
    client: JutgeApiClient,
    submission: Submission,
    tables: AllTables,
): Promise<SubmissionDetailSections> {
    if (submission.state !== 'done') {
        return EMPTY_SUBMISSION_SECTIONS
    }

    const verdict = submissionVerdict(submission)
    const params = { problem_id: submission.problem_id, submission_id: submission.submission_id }
    const isCircuitsSubmission = submission.compiler_id === CIRCUITS_COMPILER_ID

    const [analysis, scoring, compilationErrors, circuitModules, circuitTracesJson, circuitTracesSvg] =
        await Promise.all([
            client.student.submissions.getAnalysis(params).catch(() => [] as SubmissionAnalysis[]),
            client.student.submissions.getScoring(params).catch(() => null as Scoring),
            verdict === 'CE'
                ? client.student.submissions.getCompilationErrors(params).catch(() => null)
                : Promise.resolve(null),
            isCircuitsSubmission
                ? client.student.submissions.getCircuitModules(params).catch(() => ({}) as Record<string, string>)
                : Promise.resolve(null as Record<string, string> | null),
            isCircuitsSubmission && verdict === 'WA'
                ? client.student.submissions.getCircuitTracesJson(params).catch(() => null)
                : Promise.resolve(null),
            isCircuitsSubmission && verdict === 'WA'
                ? client.student.submissions.getCircuitTracesSvg(params).catch(() => null)
                : Promise.resolve(null),
        ])

    const circuitErrorReports = circuitTracesJson ? parseCircuitTracesJson(circuitTracesJson) : []
    const circuitErrorTraces = circuitTracesSvg ? parseCircuitTracesSvg(circuitTracesSvg) : []

    return {
        analysis: decorateAnalysis(analysis, tables),
        scoring: decorateScoring(scoring, tables),
        compilationErrors,
        circuitModules: circuitModules && Object.keys(circuitModules).length > 0 ? circuitModules : null,
        circuitErrorReports: circuitErrorReports.length > 0 ? circuitErrorReports : null,
        circuitErrorTraces: circuitErrorTraces.length > 0 ? circuitErrorTraces : null,
    }
}

export async function fetchSubmissionSource(
    client: JutgeApiClient,
    submission: Submission,
    tables: AllTables,
): Promise<SubmissionSourceContent | null> {
    if (submission.state !== 'done') {
        return null
    }

    const codeB64 = await client.student.submissions
        .getCodeAsB64({ problem_id: submission.problem_id, submission_id: submission.submission_id })
        .catch(() => null)
    if (!codeB64) {
        return null
    }

    const defaultExtension = tables.compilers[submission.compiler_id]?.extension ?? 'txt'
    const decoded = decodeSubmissionCodeBase64(codeB64, submission.compiler_id, defaultExtension)

    return {
        code: decoded.code,
        codeExtension: decoded.extension,
        codeFilename: `${submission.submission_id}.${defaultExtension}`,
    }
}

export async function fetchSubmissionCodeMetricsForDetail(
    client: JutgeApiClient,
    submission: Submission,
    verdict: string,
    options: FetchSubmissionDetailOptions,
): Promise<SubmissionCodeMetricsData | null> {
    if (
        !shouldShowCodeMetrics({
            submission,
            verdict,
            isAdministrator: options.isAdministrator ?? false,
            isExamOrContest: options.isExamOrContest ?? false,
        })
    ) {
        return null
    }

    return fetchSubmissionCodeMetrics(client, submission)
}

export async function fetchSubmissionDetail(
    client: JutgeApiClient,
    key: string,
    submission_id: string,
    options?: FetchSubmissionDetailOptions,
): Promise<SubmissionDetailData | null> {
    const resolved = await fetchSubmissionDetailCore(client, key, submission_id)
    if (!resolved) {
        return null
    }

    const { tables } = resolved
    const { submission } = resolved.core

    const [problemTitle, sections, source, codeMetrics] = await Promise.all([
        fetchSubmissionProblemTitle(client, submission),
        fetchSubmissionSections(client, submission, tables),
        fetchSubmissionSource(client, submission, tables),
        fetchSubmissionCodeMetricsForDetail(client, submission, resolved.core.verdict, options ?? {}),
    ])

    return {
        ...resolved.core,
        problemTitle,
        ...sections,
        code: source?.code ?? null,
        codeExtension: source?.codeExtension ?? null,
        codeFilename: source?.codeFilename ?? null,
        codeMetrics,
        awards: [],
        debugInformation: null,
    }
}

export async function fetchSubmissionTestcaseAnalysis(
    client: JutgeApiClient,
    key: string,
    submission_id: string,
    testcase: string,
): Promise<SubmissionTestcaseAnalysisData | null> {
    const resolvedProblemId = await resolveProblemId(key)
    if (!resolvedProblemId) {
        return null
    }

    const submission = await resolveSubmission(client, key, resolvedProblemId, submission_id)
    if (!submission || !submissionMatchesProblemKey(submission, key, resolvedProblemId)) {
        return null
    }

    if (submission.state !== 'done') {
        return null
    }

    try {
        const parsed = parseProblemKey(submission.problem_id)
        const problem_nm = parsed.kind === 'problem_id' ? parsed.problem_nm : submission.problem_id

        const [analysis, tables, abstractProblem] = await Promise.all([
            client.student.submissions.getTestcaseAnalysis({
                problem_id: submission.problem_id,
                submission_id,
                testcase,
            }),
            client.tables.get(),
            fetchAbstractProblem(problem_nm),
        ])
        const decoded = decodeTestcaseAnalysis(analysis, isGraphicProblem(abstractProblem?.driver_id))
        return {
            ...decoded,
            verdictEmoji: tables.verdicts[decoded.verdict]?.emoji,
        }
    } catch {
        return null
    }
}
