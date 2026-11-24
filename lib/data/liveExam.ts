import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'

import jutge from '@/lib/jutge'
import { saveFileWithDialog } from '@/lib/saveFileWithDialog'
import { fetchSubmissionsInRange } from '@/lib/data/submissions'
import type { SubmissionRow } from '@/lib/submissions'
import { isDocumentZip } from '@/lib/instructor/documents'
import { getExamStatus } from '@/lib/exams'
import type {
    Download,
    Exam,
    JutgeApiClient,
    Ranking,
    ReadyExam,
    RunningExam,
    RunningExamDocument,
    StudentExamCourse,
} from '@/lib/jutge_api_client'
import { NotFoundError, UnauthorizedError } from '@/lib/jutge_api_client'

dayjs.extend(duration)
dayjs.extend(relativeTime)

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

export async function fetchLiveExamSubmissions(client: JutgeApiClient, exam: RunningExam): Promise<SubmissionRow[]> {
    const start = exam.time_start ? new Date(exam.time_start) : new Date(exam.exp_time_start)
    const end = new Date()
    const problemNms = new Set(exam.problems.map((problem) => problem.problem_nm))
    const rows = await fetchSubmissionsInRange(client, start, end)
    return rows.filter((row) => problemNms.has(row.problem_nm)).sort((a, b) => b.time_inMs - a.time_inMs)
}

export async function refreshTutorStatus(): Promise<LiveTutorStatus> {
    return jutge.tutor.examctl.getStatus()
}

async function downloadExamDocumentFile(
    documentNm: string,
    fetchFile: (document_nm: string) => Promise<Download>,
    fallbackExt: string,
    fallbackType: string,
): Promise<void> {
    const file = await fetchFile(documentNm)
    const blob = new Blob([new Uint8Array(file.data)], { type: file.type || fallbackType })
    await saveFileWithDialog({ blob, suggestedName: file.name || `${documentNm}${fallbackExt}` })
}

export async function downloadExamDocument(document: Pick<RunningExamDocument, 'document_nm' | 'type'>): Promise<void> {
    if (isDocumentZip(document)) {
        return downloadExamDocumentZip(document.document_nm)
    }
    return downloadExamDocumentPdf(document.document_nm)
}

export async function downloadExamDocumentPdf(documentNm: string): Promise<void> {
    return downloadExamDocumentFile(
        documentNm,
        (document_nm) => jutge.student.exam.getDocumentPdf(document_nm),
        '.pdf',
        'application/pdf',
    )
}

export async function downloadExamDocumentZip(documentNm: string): Promise<void> {
    return downloadExamDocumentFile(
        documentNm,
        (document_nm) => jutge.student.exam.getDocumentZip(document_nm),
        '.zip',
        'application/zip',
    )
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

export async function fetchMultipleIps() {
    return jutge.tutor.examctl.multipleIPs()
}

export async function fetchExamStatistics() {
    return jutge.tutor.examctl.getStatistics()
}

export type LiveExamStatus = 'waiting' | 'running' | 'finished'

export function finishTimeMs(exam: RunningExam, meta: Exam | null): number {
    if (meta?.time_end) {
        return new Date(meta.time_end).getTime()
    }
    const startMs = exam.time_start ? new Date(exam.time_start).getTime() : new Date(exam.exp_time_start).getTime()
    return startMs + (exam.running_time + exam.extra_minutes) * 60_000
}

export function examStatus(
    exam: RunningExam | null,
    now: number = Date.now(),
    meta: Exam | null = null,
): LiveExamStatus {
    if (!exam) return 'waiting'
    if (meta && getExamStatus(meta).tone === 'finished') return 'finished'
    if (exam.time_start == null) return 'waiting'
    if (finishTimeMs(exam, meta) <= now) return 'finished'
    return 'running'
}

export function examStartedAtMs(exam: RunningExam): number {
    return exam.time_start ? new Date(exam.time_start).getTime() : new Date(exam.exp_time_start).getTime()
}

/** Elapsed fraction from official start to finish (0–1). */
export function examElapsedProgress(exam: RunningExam, finishMs: number, now: number): number {
    const startedAtMs = examStartedAtMs(exam)
    const totalMs = Math.max(finishMs - startedAtMs, 1)
    const spentMs = Math.max(0, Math.min(totalMs, now - startedAtMs))
    return spentMs / totalMs
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

export function formatLiveDateTime(value: string | number): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    const d = dayjs(date)
    const time = d.format('HH:mm:ss')
    if (d.isSame(dayjs(), 'day')) return time
    return `${d.format('YYYY-MM-DD')} ${time}`
}

export function formatLiveDateTimeWithRelative(value: string | number, nowMs: number): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return `${formatLiveDateTime(value)} (${dayjs(date).from(dayjs(nowMs))})`
}

export function formatLiveTime24(value: string | number): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return dayjs(date).format('HH:mm:ss')
}

export function formatRunningTimeHuman(minutes: number): string {
    const rounded = Math.max(0, Math.round(minutes))
    return dayjs.duration(rounded, 'minutes').humanize()
}

export function formatRemainingHuman(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    return dayjs.duration(totalSeconds, 'seconds').humanize()
}

type RunningExamWithCourse = RunningExam & { course?: StudentExamCourse }

export function runningExamCourseTitle(exam: RunningExam): string | null {
    const title = (exam as RunningExamWithCourse).course?.title?.trim()
    return title || null
}

export async function resolveLiveExamCourseTitle(
    exam: RunningExam,
    examKey: string | null | undefined,
): Promise<string | null> {
    const inline = runningExamCourseTitle(exam)
    if (inline) return inline
    const key = examKey?.trim()
    if (!key) return null
    try {
        const detail = await jutge.student.exams.get(key)
        const title = detail.course?.title?.trim()
        return title || null
    } catch {
        return null
    }
}
