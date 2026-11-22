import jutge from '@/lib/jutge'
import { decodeSubmissionCodeBase64 } from '@/lib/makePro2SourceCode'
import { saveFileWithDialog } from '@/lib/saveFileWithDialog'
import { parseProblemKey } from '@/lib/problems'
import type {
    AbstractProblem,
    AllTables,
    Compiler,
    Ranking,
    ReadyExam,
    RunningExam,
    Submission,
    SubmissionAnalysis,
} from '@/lib/jutge_api_client'
import { NotFoundError, UnauthorizedError } from '@/lib/jutge_api_client'

export type LiveTutorStatus = {
    status: string
    time_start: string | null
    time_end: string | null
}

export type LiveRosterEntry = {
    email: string
    name: string
    start_time: string | null
    end_time: string | null
    entered: number
    finished: number
    banned: number
    invited: number
    submission_ips: string[]
    login_ips: string[]
}

export type LiveLatestSubmission = {
    email: string
    problem: string
    verdict: string | null
    verdict_info: string | null
    time_in: string
    problem_id: string
    compiler_id: string
}

export function isLiveAuthFailure(error: unknown): boolean {
    return error instanceof UnauthorizedError || error instanceof NotFoundError
}

export function liveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message
    return fallback
}

export function filterReadyExams(exams: ReadyExam[], contest: boolean): ReadyExam[] {
    return exams.filter((exam) => exam.contest === contest)
}

export { fetchReadyExamsUnauthenticated as fetchReadyExams } from '@/lib/data/liveAuth'

export async function probeLiveRole(): Promise<
    { role: 'tutor'; status: LiveTutorStatus } | { role: 'student'; exam: RunningExam }
> {
    try {
        const status = await jutge.tutor.examctl.getStatus()
        return { role: 'tutor', status }
    } catch (error) {
        if (!isLiveAuthFailure(error)) throw error
    }
    const exam = await jutge.student.exam.get()
    return { role: 'student', exam }
}

export async function refreshStudentExam(): Promise<RunningExam> {
    return jutge.student.exam.get()
}

export async function refreshTutorStatus(): Promise<LiveTutorStatus> {
    return jutge.tutor.examctl.getStatus()
}

export function problemNmOfKey(key: string): string | null {
    const parsed = parseProblemKey(key)
    if (parsed.kind === 'problem_id' || parsed.kind === 'problem_nm') return parsed.problem_nm
    return null
}

export function problemBelongsToExam(exam: RunningExam, problemNm: string): boolean {
    return exam.problems.some((problem) => problem.problem_nm === problemNm)
}

export function pickProblemId(abstractProblem: AbstractProblem, key: string): string | null {
    const parsed = parseProblemKey(key)
    if (parsed.kind === 'problem_id' && abstractProblem.problems[parsed.problem_id]) {
        return parsed.problem_id
    }
    const variants = Object.values(abstractProblem.problems)
    const english = variants.find((variant) => variant.language_id === 'en')
    return (english ?? variants[0])?.problem_id ?? null
}

function problemCompilerIds(abstractProblem: AbstractProblem): string[] | null {
    if (!abstractProblem.compilers) return null
    const ids = abstractProblem.compilers
        .split(/[,\s]+/)
        .map((id) => id.trim())
        .filter(Boolean)
    return ids.length > 0 ? ids : null
}

export function compilersForExam(
    tables: AllTables,
    examCompilerIds: string[],
    abstractProblem: AbstractProblem | null,
): Compiler[] {
    const allowed = new Set(examCompilerIds)
    const problemIds = abstractProblem ? problemCompilerIds(abstractProblem) : null
    const problemAllowed = problemIds ? new Set(problemIds) : null
    return Object.values(tables.compilers)
        .filter((compiler) => allowed.has(compiler.compiler_id))
        .filter((compiler) => (problemAllowed ? problemAllowed.has(compiler.compiler_id) : true))
        .sort((a, b) => a.name.localeCompare(b.name))
}

export type LiveProblemView = {
    problemNm: string
    problemId: string
    title: string
    shortHtmlStatement: string
    templates: string[]
    compilers: Compiler[]
}

export async function fetchLiveProblemView(
    key: string,
    examCompilerIds: string[],
): Promise<LiveProblemView | null> {
    const problemNm = problemNmOfKey(key)
    if (!problemNm) return null
    const abstractProblem = await jutge.problems.getAbstractProblem(problemNm)
    const problemId = pickProblemId(abstractProblem, key)
    if (!problemId) return null
    const variant = abstractProblem.problems[problemId]
    const [shortHtmlStatement, templates, tables] = await Promise.all([
        jutge.problems.getShortHtmlStatement(problemId),
        jutge.problems.getTemplates(problemId),
        jutge.tables.get(),
    ])
    return {
        problemNm,
        problemId,
        title: variant?.title ?? problemNm,
        shortHtmlStatement,
        templates,
        compilers: compilersForExam(tables, examCompilerIds, abstractProblem),
    }
}

export async function fetchTutorProblemView(key: string): Promise<LiveProblemView | null> {
    const problemNm = problemNmOfKey(key)
    if (!problemNm) return null
    const abstractProblem = await jutge.problems.getAbstractProblem(problemNm)
    const problemId = pickProblemId(abstractProblem, key)
    if (!problemId) return null
    const variant = abstractProblem.problems[problemId]
    const [shortHtmlStatement, templates] = await Promise.all([
        jutge.problems.getShortHtmlStatement(problemId),
        jutge.problems.getTemplates(problemId),
    ])
    return {
        problemNm,
        problemId,
        title: variant?.title ?? problemNm,
        shortHtmlStatement,
        templates,
        compilers: [],
    }
}

export function submissionProblemNm(problemId: string): string | null {
    return problemNmOfKey(problemId)
}

export async function fetchStudentSubmissions(problemNms: string[]): Promise<Submission[]> {
    const allowed = new Set(problemNms)
    const submissions = await jutge.student.submissions.getAll()
    return submissions
        .filter((submission) => {
            const problemNm = submissionProblemNm(submission.problem_id)
            return problemNm !== null && allowed.has(problemNm)
        })
        .sort((a, b) => b.time_in.localeCompare(a.time_in))
}

export async function fetchProblemSubmissions(problemNm: string): Promise<Submission[]> {
    const submissions = await jutge.student.submissions.getForAbstractProblems(problemNm)
    return [...submissions].sort((a, b) => b.time_in.localeCompare(a.time_in))
}

export async function fetchVerdictTables(): Promise<AllTables> {
    return jutge.tables.get()
}

export function verdictLabel(tables: AllTables | null, verdictId: string | null): string {
    if (!verdictId) return 'Pending'
    return tables?.verdicts[verdictId]?.name ?? verdictId
}

export function compilerLabel(tables: AllTables | null, compilerId: string): string {
    return tables?.compilers[compilerId]?.name ?? compilerId
}

export async function submitLiveSolution(input: {
    problemId: string
    compilerId: string
    code: string
    annotation: string
}): Promise<string> {
    return jutge.student.submissions.submit({
        problem_id: input.problemId,
        compiler_id: input.compilerId,
        code: input.code,
        annotation: input.annotation,
    })
}

export type LiveSubmissionDetail = {
    submission: Submission
    code: string | null
    compilationErrors: string | null
    analysis: SubmissionAnalysis[]
    tables: AllTables
}

export async function fetchLiveSubmissionDetail(
    problemNm: string,
    submissionId: string,
): Promise<LiveSubmissionDetail | null> {
    const submissions = await jutge.student.submissions.getForAbstractProblems(problemNm)
    const submission = submissions.find((item) => item.submission_id === submissionId)
    if (!submission) return null
    const params = { problem_id: submission.problem_id, submission_id: submission.submission_id }
    const [code, compilation, analysis, tables] = await Promise.all([
        jutge.student.submissions.getCodeAsB64(params).catch(() => null),
        jutge.student.submissions.getCompilationErrors(params).catch(() => null),
        jutge.student.submissions.getAnalysis(params).catch(() => [] as SubmissionAnalysis[]),
        jutge.tables.get(),
    ])
    const compilationText = [
        compilation?.compilation1,
        compilation?.compilation2,
        compilation?.linkage,
        compilation?.interface,
    ]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join('\n\n')
    const extension = tables.compilers[submission.compiler_id]?.extension ?? 'txt'
    const decoded = code ? decodeSubmissionCodeBase64(code, submission.compiler_id, extension).code : null
    return {
        submission,
        code: decoded,
        compilationErrors: compilationText || null,
        analysis,
        tables,
    }
}

export async function downloadExamDocument(documentNm: string): Promise<void> {
    const file = await jutge.student.exam.getDocumentPdf(documentNm)
    const blob = new Blob([new Uint8Array(file.data)], { type: file.type || 'application/pdf' })
    await saveFileWithDialog({ blob, suggestedName: file.name || `${documentNm}.pdf` })
}

export async function finishLiveExam(): Promise<void> {
    await jutge.student.exam.finishExam()
}

export async function fetchStudentRanking(): Promise<Ranking> {
    return jutge.student.exam.getRanking()
}

export async function fetchTutorRanking(): Promise<Ranking> {
    return jutge.tutor.examctl.getRanking()
}

export async function fetchLiveRoster(): Promise<LiveRosterEntry[]> {
    return jutge.tutor.examctl.liveRoster()
}

export async function fetchLatestSubmissions(limit: number): Promise<LiveLatestSubmission[]> {
    return jutge.tutor.examctl.latestSubmissions({ limit })
}

export async function fetchMultipleIps() {
    return jutge.tutor.examctl.multipleIPs()
}

export async function fetchExamStatistics() {
    return jutge.tutor.examctl.getStatistics()
}

export function examHasStarted(exam: RunningExam | null): boolean {
    return exam?.time_start != null
}

export function formatClock(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const seconds = total % 60
    const pad = (value: number) => String(value).padStart(2, '0')
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`
    return `${pad(minutes)}:${pad(seconds)}`
}

export function formatInstant(value: string | null): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
}
