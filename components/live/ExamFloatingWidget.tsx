'use client'

import dayjs from 'dayjs'

import AnimatedTabs from '@/components/smoothui/animated-tabs'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemStatusIcon } from '@/components/problems/ProblemStatusIcon'
import { CompactClock } from '@/components/utilities/CompactClock'
import { ExamTimerCard } from '@/components/live/ExamTimerCard'
import { LiveExamMarkdownDialog } from '@/components/live/LiveExamInfoCard'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useExamFloatingWidgetSession } from '@/hooks/useExamFloatingWidgetSession'
import {
    abstractProblemsToIconUrlMap,
    abstractProblemsToTitleMap,
    fetchAbstractProblemsDict,
} from '@/lib/data/problems'
import { getPreferredLanguageId } from '@/lib/data/auth'
import { downloadExamDocument, examStatus, finishTimeMs, formatInstant, liveErrorMessage } from '@/lib/data/liveExam'
import { documentTypeLabel, getDocumentFileIcon } from '@/lib/instructor/documents'
import {
    readExamFloatingWidgetTab,
    requestExamFloatingWidgetNavigation,
    writeExamFloatingWidgetTab,
    type ExamFloatingWidgetTabId,
} from '@/lib/examFloatingWidget'
import type { SubmissionRow } from '@/lib/submissions'
import { cn } from '@/lib/utils'
import {
    BookOpenIcon,
    ClockIcon,
    FileBracesCornerIcon,
    FileTextIcon,
    InfoIcon,
    Loader2Icon,
    SendIcon,
    SignatureIcon,
    TimerIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AbstractStatus, RunningExamDocument, RunningExamProblem } from '@/lib/jutge_api_client'

export const EXAM_FLOATING_WIDGET_SIZE_PX = 300

const TABS: { id: ExamFloatingWidgetTabId; label: string; icon: ReactNode }[] = [
    { id: 'info', label: 'Info', icon: <InfoIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'timer', label: 'Timer', icon: <TimerIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'problems', label: 'Problems', icon: <FileBracesCornerIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'submissions', label: 'Submissions', icon: <SendIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'documents', label: 'Documents', icon: <FileTextIcon className="size-4 shrink-0" aria-hidden /> },
    { id: 'clock', label: 'Clock', icon: <ClockIcon className="size-4 shrink-0" aria-hidden /> },
]

function formatSubmissionShortTime(timeInMs: number): string {
    return dayjs(timeInMs).format('HH:mm')
}

function ExamFloatingWidgetSubmissions({
    submissions,
    examProblems,
}: {
    submissions: SubmissionRow[]
    examProblems: RunningExamProblem[]
}) {
    const captionByProblemNm = useMemo(() => {
        const map = new Map<string, string>()
        for (const problem of examProblems) {
            const caption = problem.caption?.trim()
            if (caption) map.set(problem.problem_nm, caption)
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
            <table className="w-full border-collapse text-sm leading-snug">
                <caption className="sr-only">Exam submissions</caption>
                <tbody>
                    {submissions.map((row) => {
                        const caption = captionByProblemNm.get(row.problem_nm)
                        return (
                        <tr
                            key={row.rowKey}
                            className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/60"
                            tabIndex={0}
                            role="link"
                            aria-label={`Open submission ${row.submission_id} for ${row.problemTitle}`}
                            onClick={() => requestExamFloatingWidgetNavigation(row.submissionHref)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    requestExamFloatingWidgetNavigation(row.submissionHref)
                                }
                            }}
                        >
                            <td className="max-w-0 py-1.5 pl-1 pr-1 align-middle">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="flex min-w-0 items-center gap-1.5">
                                            {row.iconUrl ? (
                                                <ProblemIconImage iconUrl={row.iconUrl} size="xs" className="shrink-0" />
                                            ) : (
                                                <span className="inline-block size-4 shrink-0" aria-hidden />
                                            )}
                                            {caption ? (
                                                <span className="shrink-0 truncate font-medium tabular-nums">
                                                    {caption}
                                                </span>
                                            ) : null}
                                            <span
                                                className={cn(
                                                    'min-w-0 truncate',
                                                    caption
                                                        ? 'text-muted-foreground'
                                                        : 'font-medium text-foreground',
                                                )}
                                            >
                                                {row.problem_nm}
                                            </span>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">{row.problemTitle}</TooltipContent>
                                </Tooltip>
                            </td>
                            <td className="w-10 truncate py-1.5 pr-2 align-middle tabular-nums text-muted-foreground">
                                {row.submission_id}
                            </td>
                            <td className="max-w-[5.5rem] truncate py-1.5 pl-2 pr-1 align-middle">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="flex min-w-0 items-center gap-1">
                                            {row.verdictEmoji ? (
                                                <span
                                                    aria-hidden
                                                    className={cn(
                                                        'shrink-0 text-sm leading-none',
                                                        row.verdict === 'Pending' ? 'animate-pulse' : undefined,
                                                    )}
                                                >
                                                    {row.verdictEmoji}
                                                </span>
                                            ) : (
                                                <span className="shrink-0 text-muted-foreground">—</span>
                                            )}
                                            <span className="min-w-0 truncate">{row.verdict}</span>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">{row.verdictFullName}</TooltipContent>
                                </Tooltip>
                            </td>
                            <td className="w-10 shrink-0 py-1.5 pr-0.5 text-right align-middle tabular-nums text-muted-foreground">
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
                    const busy = downloadingNm !== null
                    return (
                        <li key={document.document_nm} className="border-b border-border last:border-b-0">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60 disabled:opacity-50"
                                        disabled={busy}
                                        aria-label={
                                            downloading
                                                ? `Downloading ${document.title}`
                                                : `Download ${document.title} (${typeLabel})`
                                        }
                                        onClick={() => void runDownload(document)}
                                    >
                                        {downloading ? (
                                            <Loader2Icon
                                                className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                                                aria-hidden
                                            />
                                        ) : (
                                            <FileIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                                        )}
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                            {document.title}
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    {downloading ? 'Downloading…' : `${document.title} (${typeLabel})`}
                                </TooltipContent>
                            </Tooltip>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

function useExamFloatingWidgetProblemMeta(problemNms: readonly string[]): {
    iconUrls: Map<string, string | null>
    titles: Map<string, string>
} {
    const problemNmsKey = problemNms.join('\0')
    const [iconUrls, setIconUrls] = useState<Map<string, string | null>>(() => new Map())
    const [titles, setTitles] = useState<Map<string, string>>(() => new Map())

    useEffect(() => {
        let cancelled = false
        void Promise.all([fetchAbstractProblemsDict(), getPreferredLanguageId()]).then(
            ([dict, preferredLanguageId]) => {
                if (cancelled) return
                const allIcons = abstractProblemsToIconUrlMap(dict)
                const allTitles = abstractProblemsToTitleMap(dict, preferredLanguageId)
                const nextIcons = new Map<string, string | null>()
                const nextTitles = new Map<string, string>()
                for (const problem_nm of problemNms) {
                    nextIcons.set(problem_nm, allIcons.get(problem_nm) ?? null)
                    const title = allTitles.get(problem_nm)
                    if (title) nextTitles.set(problem_nm, title)
                }
                setIconUrls(nextIcons)
                setTitles(nextTitles)
            },
        )
        return () => {
            cancelled = true
        }
    }, [problemNmsKey])

    return { iconUrls, titles }
}

function ExamFloatingWidgetProblems({
    problems,
    statuses,
}: {
    problems: RunningExamProblem[]
    statuses: Record<string, AbstractStatus>
}) {
    const problemNms = useMemo(() => problems.map((problem) => problem.problem_nm), [problems])
    const { iconUrls, titles } = useExamFloatingWidgetProblemMeta(problemNms)

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
                const caption = problem.caption?.trim() || null
                const title = titles.get(problem.problem_nm) ?? null
                const problemPath = `/problems/${problem.problem_nm}`
                const iconUrl = iconUrls.get(problem.problem_nm) ?? null
                return (
                    <li key={problem.problem_nm} className="border-b border-border last:border-b-0">
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/60"
                            onClick={() => requestExamFloatingWidgetNavigation(problemPath)}
                        >
                            <span className="flex shrink-0 items-center justify-center">
                                {iconUrl ? (
                                    <ProblemIconImage iconUrl={iconUrl} size="base" className="shrink-0" />
                                ) : (
                                    <span className="inline-block size-5 shrink-0" aria-hidden />
                                )}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex min-w-0 items-baseline gap-1.5 overflow-hidden">
                                    {caption ? (
                                        <>
                                            <span className="shrink-0 truncate text-sm font-medium text-foreground">
                                                {caption}
                                            </span>
                                            {title && title !== caption ? (
                                                <span className="min-w-0 truncate text-sm text-muted-foreground">
                                                    {title}
                                                </span>
                                            ) : null}
                                        </>
                                    ) : (
                                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                                            {title ?? problem.problem_nm}
                                        </span>
                                    )}
                                </span>
                                <span className="block min-w-0 truncate text-[11px] leading-tight text-muted-foreground">
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
    description,
    instructions,
    showInstructions,
}: {
    title: string
    courseTitle: string | null
    instructorName: string | null
    description: string | null | undefined
    instructions: string | null | undefined
    showInstructions: boolean
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 px-4 py-3">
            <div>
                <h1 className="text-base font-semibold leading-snug tracking-tight text-foreground">{title}</h1>
                {courseTitle || instructorName ? (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {courseTitle ? (
                            <span className="inline-flex items-center gap-1.5 font-medium">
                                <BookOpenIcon className="size-3.5 shrink-0" aria-hidden />
                                {courseTitle}
                            </span>
                        ) : null}
                        {instructorName ? (
                            <span className="inline-flex items-center gap-1.5">
                                <SignatureIcon className="size-3.5 shrink-0" aria-hidden />
                                {instructorName}
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>
            <div className="flex flex-wrap gap-4">
                <LiveExamMarkdownDialog
                    buttonLabel="Description"
                    dialogTitle="Description"
                    emptyText="No description"
                    markdown={description}
                />
                {showInstructions ? (
                    <LiveExamMarkdownDialog
                        buttonLabel="Instructions"
                        dialogTitle="Instructions"
                        emptyText="No instructions"
                        markdown={instructions}
                    />
                ) : null}
            </div>
        </div>
    )
}

export function ExamFloatingWidget({ className }: { className?: string }) {
    const [tab, setTab] = useState<ExamFloatingWidgetTabId>(() => readExamFloatingWidgetTab())
    const session = useExamFloatingWidgetSession()
    const now = useNow(!session.loading)
    const liveStatus = session.exam ? examStatus(session.exam, now, session.examMeta) : 'waiting'
    const started = liveStatus !== 'waiting'
    const finishMs = session.exam ? finishTimeMs(session.exam, session.examMeta) : 0
    const finished = liveStatus === 'finished' || session.examFinished

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
                description={session.exam.description}
                instructions={session.exam.instructions}
                showInstructions={liveStatus === 'running' || liveStatus === 'finished'}
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
        panel = (
            <ExamFloatingWidgetSubmissions
                submissions={session.submissions}
                examProblems={session.exam.problems}
            />
        )
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
        <div
            className={cn(
                'flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background text-foreground',
                className,
            )}
        >
            <TooltipProvider>
                <>
                    <div className="w-full shrink-0">
                        <AnimatedTabs
                            activeTab={tab}
                            className="rounded-none border-b border-border bg-muted p-0"
                            hideLabels
                            tooltipSide="bottom"
                            layoutId="exam-floating-widget-tabs"
                            onChange={(id) => {
                                const next = id as ExamFloatingWidgetTabId
                                setTab(next)
                                writeExamFloatingWidgetTab(next)
                            }}
                            tabs={TABS}
                            variant="segment"
                        />
                    </div>
                    <section
                        className="flex min-h-0 flex-1 flex-col overflow-hidden"
                        role="tabpanel"
                        id={`exam-floating-widget-panel-${tab}`}
                        aria-labelledby={`exam-floating-widget-tabs-tab-${tab}`}
                    >
                        {panel}
                    </section>
                </>
            </TooltipProvider>
        </div>
    )
}
