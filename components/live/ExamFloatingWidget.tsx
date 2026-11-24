'use client'

import dayjs from 'dayjs'

import AnimatedTabs from '@/components/smoothui/animated-tabs'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemIdLabel } from '@/components/problems/ProblemIdLabel'
import { ProblemStatusIcon } from '@/components/problems/ProblemStatusIcon'
import { CompactClock } from '@/components/utilities/CompactClock'
import { ExamTimerCard } from '@/components/live/ExamTimerCard'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { examTimerFinished, finishTimeMs, useExamFloatingWidgetSession } from '@/hooks/useExamFloatingWidgetSession'
import { downloadExamDocument, examHasStarted, formatInstant, liveErrorMessage } from '@/lib/data/liveExam'
import { documentTypeLabel, getDocumentFileIcon } from '@/lib/instructor/documents'
import { requestExamFloatingWidgetNavigation } from '@/lib/examFloatingWidget'
import type { SubmissionRow } from '@/lib/submissions'
import { cn } from '@/lib/utils'
import {
    ClockIcon,
    DownloadIcon,
    FileBracesCornerIcon,
    FileTextIcon,
    InfoIcon,
    Loader2Icon,
    SendIcon,
    TimerIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AbstractStatus, RunningExamDocument, RunningExamProblem } from '@/lib/jutge_api_client'

export const EXAM_FLOATING_WIDGET_SIZE_PX = 300

type TabId = 'info' | 'clock' | 'timer' | 'problems' | 'documents' | 'submissions'

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
    { id: 'info', label: 'Info', icon: <InfoIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'problems', label: 'Problems', icon: <FileBracesCornerIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'submissions', label: 'Submissions', icon: <SendIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'documents', label: 'Documents', icon: <FileTextIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'clock', label: 'Clock', icon: <ClockIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'timer', label: 'Timer', icon: <TimerIcon className="size-4 shrink-0" aria-hidden /> },
]

function formatSubmissionShortTime(timeInMs: number): string {
    return dayjs(timeInMs).format('HH:mm')
}

function ExamFloatingWidgetProblemIcon({
    examIcon,
    iconUrl,
}: {
    examIcon: string | null | undefined
    iconUrl: string | null
}) {
    if (examIcon) {
        return (
            // eslint-disable-next-line @next/next/no-img-element -- exam icons are external SVGs
            <img
                src={`https://jutge.org/img/examicons/${examIcon}.svg`}
                alt=""
                className="size-3.5 shrink-0 object-contain"
                width={14}
                height={14}
            />
        )
    }
    if (iconUrl) {
        return <ProblemIconImage iconUrl={iconUrl} size="2xs" className="shrink-0" />
    }
    return <span className="inline-block size-3.5 shrink-0" aria-hidden />
}

function ExamFloatingWidgetSubmissions({
    submissions,
    examProblems,
}: {
    submissions: SubmissionRow[]
    examProblems: RunningExamProblem[]
}) {
    const examIconByProblemNm = useMemo(() => {
        const map = new Map<string, string | null>()
        for (const problem of examProblems) {
            map.set(problem.problem_nm, problem.icon)
        }
        return map
    }, [examProblems])

    if (submissions.length === 0) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
                No submissions
            </div>
        )
    }

    return (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-0.5">
            <table className="w-full border-collapse text-[10px] leading-tight">
                <caption className="sr-only">Exam submissions</caption>
                <tbody>
                    {submissions.map((row) => {
                        const examIcon = examIconByProblemNm.get(row.problem_nm)
                        return (
                            <tr key={row.rowKey} className="border-b border-border last:border-b-0">
                                <td className="w-5 py-1 pl-0.5 pr-0 align-middle">
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-center rounded-sm hover:bg-muted/60"
                                        onClick={() => requestExamFloatingWidgetNavigation(row.submissionHref)}
                                    >
                                        {row.verdictEmoji ? (
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'text-xs leading-none',
                                                    row.verdict === 'Pending' ? 'animate-pulse' : undefined,
                                                )}
                                            >
                                                {row.verdictEmoji}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                        <span className="sr-only">{row.verdictFullName}</span>
                                    </button>
                                </td>
                                <td className="w-5 py-1 pr-0 align-middle">
                                    <ExamFloatingWidgetProblemIcon examIcon={examIcon} iconUrl={row.iconUrl} />
                                </td>
                                <td className="max-w-[4.5rem] truncate py-1 pr-1 align-middle font-medium tabular-nums">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className="block max-w-full truncate text-left hover:underline"
                                                onClick={() => requestExamFloatingWidgetNavigation(row.problemHref)}
                                            >
                                                <ProblemIdLabel problemId={row.problem_id} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">{row.problemTitle}</TooltipContent>
                                    </Tooltip>
                                </td>
                                <td className="w-8 truncate py-1 pr-1 align-middle tabular-nums text-muted-foreground">
                                    <button
                                        type="button"
                                        className="hover:text-foreground hover:underline"
                                        onClick={() => requestExamFloatingWidgetNavigation(row.submissionHref)}
                                    >
                                        {row.submission_id}
                                    </button>
                                </td>
                                <td className="max-w-[3.25rem] truncate py-1 pr-1 align-middle">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="block truncate">{row.verdict}</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">{row.verdictFullName}</TooltipContent>
                                    </Tooltip>
                                </td>
                                <td className="w-9 shrink-0 py-1 pr-0.5 text-right align-middle tabular-nums text-muted-foreground">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>{formatSubmissionShortTime(row.time_inMs)}</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">{row.time_in}</TooltipContent>
                                    </Tooltip>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

function formatProblemStatusLabel(status: AbstractStatus | undefined): string {
    if (!status?.status) return '—'
    const value = status.status.trim()
    if (!value) return '—'
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function ExamFloatingWidgetProblemStatus({ status }: { status?: AbstractStatus }) {
    if (!status) {
        return <span className="text-xs text-muted-foreground">—</span>
    }

    const icon =
        status.status === 'accepted' || status.status === 'rejected' || status.status === 'scored' ? (
            <ProblemStatusIcon status={status} className="size-4" />
        ) : null

    if (icon) return icon

    return <span className="text-xs font-medium text-muted-foreground">{formatProblemStatusLabel(status)}</span>
}

function ExamFloatingWidgetDocuments({ documents }: { documents: RunningExamDocument[] }) {
    const [downloadingNm, setDownloadingNm] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const sorted = useMemo(() => [...documents].sort((a, b) => a.title.localeCompare(b.title)), [documents])

    async function runDownload(document: RunningExamDocument) {
        if (downloadingNm) return
        setDownloadingNm(document.document_nm)
        setError(null)
        try {
            await downloadExamDocument(document)
        } catch (err: unknown) {
            setError(liveErrorMessage(err, 'Could not download the document.'))
        } finally {
            setDownloadingNm(null)
        }
    }

    if (sorted.length === 0) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
                No documents
            </div>
        )
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {error ? (
                <p className="shrink-0 border-b border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] leading-tight text-destructive">
                    {error}
                </p>
            ) : null}
            <ul className="min-h-0 flex-1 list-none overflow-y-auto overscroll-contain p-1" aria-label="Exam documents">
                {sorted.map((document) => {
                    const FileIcon = getDocumentFileIcon(document.type)
                    const typeLabel = documentTypeLabel(document)
                    const downloading = downloadingNm === document.document_nm
                    return (
                        <li key={document.document_nm} className="border-b border-border last:border-b-0">
                            <div className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5">
                                <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                                <span className="min-w-0 flex-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="block truncate text-sm font-medium text-foreground">
                                                {document.title}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">{document.title}</TooltipContent>
                                    </Tooltip>
                                </span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
                                            disabled={downloading || downloadingNm !== null}
                                            aria-label={
                                                downloading
                                                    ? `Downloading ${document.title}`
                                                    : `Download ${document.title} (${typeLabel})`
                                            }
                                            onClick={() => void runDownload(document)}
                                        >
                                            {downloading ? (
                                                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                                            ) : (
                                                <DownloadIcon className="size-3.5" aria-hidden />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {downloading ? 'Downloading…' : `Download ${typeLabel}`}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

function ExamFloatingWidgetProblems({
    problems,
    statuses,
}: {
    problems: RunningExamProblem[]
    statuses: Record<string, AbstractStatus>
}) {
    if (problems.length === 0) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
                No problems
            </div>
        )
    }

    return (
        <ul className="min-h-0 flex-1 list-none overflow-y-auto overscroll-contain p-1">
            {problems.map((problem) => {
                const status = statuses[problem.problem_nm]
                const label = problem.caption?.trim() || problem.problem_nm
                const problemPath = `/problems/${problem.problem_nm}`
                return (
                    <li key={problem.problem_nm} className="border-b border-border last:border-b-0">
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60"
                            onClick={() => requestExamFloatingWidgetNavigation(problemPath)}
                        >
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">{label}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">
                                    {problem.problem_nm}
                                </span>
                            </span>
                            <span className="flex w-14 shrink-0 items-center justify-end">
                                <ExamFloatingWidgetProblemStatus status={status} />
                            </span>
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}

function useNow(enabled: boolean): number {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!enabled) return
        const id = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(id)
    }, [enabled])
    return now
}

function WidgetSpinner() {
    return (
        <div className="flex min-h-0 flex-1 items-center justify-center" role="status" aria-label="Loading">
            <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        </div>
    )
}

function ExamFloatingWidgetInfo({
    title,
    courseTitle,
    instructorName,
}: {
    title: string
    courseTitle: string | null
    instructorName: string | null
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 px-4 py-3">
            <div>
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground">Exam</p>
                <h1 className="text-base font-semibold leading-snug tracking-tight text-foreground">{title}</h1>
            </div>
            {courseTitle ? (
                <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground">Course</p>
                    <p className="text-sm font-medium text-foreground">{courseTitle}</p>
                </div>
            ) : null}
            {instructorName ? (
                <div>
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground">Instructor</p>
                    <p className="text-sm font-medium text-foreground">{instructorName}</p>
                </div>
            ) : null}
        </div>
    )
}

export function ExamFloatingWidget() {
    const [tab, setTab] = useState<TabId>('timer')
    const session = useExamFloatingWidgetSession()
    const now = useNow(!session.loading)
    const started = session.exam ? examHasStarted(session.exam) : false
    const finishMs = session.exam ? finishTimeMs(session.exam, session.examMeta) : 0
    const finished = session.exam
        ? session.examFinished || examTimerFinished(session.exam, session.examMeta, now)
        : false

    let panel: ReactNode = null
    if (session.loading) {
        panel = <WidgetSpinner />
    } else if (session.role === 'tutor') {
        panel = (
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 px-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Tutor session</p>
                {session.tutorStatus ? (
                    <>
                        <p>Status: {session.tutorStatus.status}</p>
                        <p className="tabular-nums">Start: {formatInstant(session.tutorStatus.time_start)}</p>
                        <p className="tabular-nums">End: {formatInstant(session.tutorStatus.time_end)}</p>
                    </>
                ) : null}
            </div>
        )
    } else if (!session.exam) {
        panel = <WidgetSpinner />
    } else if (tab === 'info') {
        panel = (
            <ExamFloatingWidgetInfo
                title={session.exam.title}
                courseTitle={session.courseTitle}
                instructorName={session.instructorName}
            />
        )
    } else if (tab === 'clock') {
        panel = (
            <div className="flex min-h-0 flex-1 items-center justify-center p-2">
                <CompactClock size={172} />
            </div>
        )
    } else if (tab === 'problems') {
        panel = <ExamFloatingWidgetProblems problems={session.exam.problems} statuses={session.problemStatuses} />
    } else if (tab === 'documents') {
        panel = <ExamFloatingWidgetDocuments documents={session.exam.documents} />
    } else if (tab === 'submissions') {
        panel = <ExamFloatingWidgetSubmissions submissions={session.submissions} examProblems={session.exam.problems} />
    } else {
        panel = (
            <ExamTimerCard
                started={started}
                finished={finished}
                now={now}
                exam={session.exam}
                finishMs={finishMs}
                submittedAtMs={session.submissions[0]?.time_inMs ?? null}
                continueExam={{ onClick: () => requestExamFloatingWidgetNavigation('/problems') }}
                viewConfirmation={{ onClick: () => requestExamFloatingWidgetNavigation('/submissions') }}
            />
        )
    }

    return (
        <TooltipProvider>
            <div
                className={cn(
                    'flex size-[300px] max-h-[300px] max-w-[300px] flex-col overflow-hidden bg-background text-foreground',
                )}
            >
                <section
                    className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    role="tabpanel"
                    id={`exam-floating-widget-panel-${tab}`}
                    aria-labelledby={`exam-floating-widget-tabs-tab-${tab}`}
                >
                    {panel}
                </section>
                <div className="shrink-0 border-t border-border px-0.5 py-0.5">
                    <AnimatedTabs
                        activeTab={tab}
                        className="w-full"
                        hideLabels
                        layoutId="exam-floating-widget-tabs"
                        onChange={(id) => setTab(id as TabId)}
                        tabs={TABS}
                        variant="segment"
                    />
                </div>
            </div>
        </TooltipProvider>
    )
}
