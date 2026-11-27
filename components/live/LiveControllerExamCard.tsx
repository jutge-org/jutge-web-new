'use client'

import {
    BookOpenIcon,
    CheckIcon,
    ClockIcon,
    EyeIcon,
    EyeOffIcon,
    Loader2Icon,
    MapPinIcon,
    SignatureIcon,
} from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import { MarkdownText } from '@/components/general/MarkdownText'
import { useLiveExamCourseTitle, useLiveExamPlace } from '@/components/live/LiveExamInfoCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    downloadExamDocument,
    fetchLiveRoster,
    liveErrorMessage,
    liveRosterParticipantStats,
    runningExamInstructorName,
    tutorExamCtlStatusToLiveStatus,
    type LiveRosterParticipantStats,
    type LiveTutorStatus,
} from '@/lib/data/liveExam'
import { documentTypeLabel, getDocumentFileIcon } from '@/lib/instructor/documents'
import jutge from '@/lib/jutge'
import type { RunningExam, RunningExamDocument } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

const CONTROLLER_INFO_ROOT_CLASS = '[--controller-label-w:7rem]'
const DATA_ROW_GRID_CLASS =
    'grid grid-cols-[var(--controller-label-w)_minmax(0,1fr)] items-baseline gap-x-3 py-0.5'
const LABEL_CLASS =
    'min-w-0 text-right text-sm font-medium text-muted-foreground'
const VALUE_CLASS = 'min-w-0 text-left text-sm font-medium text-foreground sm:text-base'

const PARTICIPANT_COUNT_FORMAT = new Intl.NumberFormat()

type DataRowSpec = { label: string; value: ReactNode; live?: boolean }

const CONTROLLER_CARD_CLASS =
    'w-full overflow-hidden rounded-2xl border border-border py-0 shadow-sm ring-0'

type TitleBadgeItem = { key: string; label: string }

function TitleBadges({ items }: { items: TitleBadgeItem[] }) {
    return (
        <span className="inline-flex max-w-full flex-wrap gap-1.5">
            {items.map((item) => (
                <Badge
                    key={item.key}
                    variant="secondary"
                    className="h-auto max-w-full font-normal"
                >
                    <span className="truncate">{item.label}</span>
                </Badge>
            ))}
        </span>
    )
}

function problemBadgeLabel(problem: RunningExam['problems'][number]): string {
    const caption = problem.caption?.trim() ?? ''
    if (caption) return `${caption}: ${problem.problem_nm}`
    return problem.problem_nm
}

function ProblemLinkBadges({ problems }: { problems: RunningExam['problems'] }) {
    return (
        <span className="inline-flex max-w-full flex-wrap gap-1.5">
            {problems.map((problem) => {
                const label = problemBadgeLabel(problem)
                return (
                    <Badge
                        key={problem.problem_nm}
                        asChild
                        variant="secondary"
                        className="h-auto max-w-full font-normal"
                    >
                        <Link href={`/problems/${problem.problem_nm}`}>
                            <span className="truncate">{label}</span>
                        </Link>
                    </Badge>
                )
            })}
        </span>
    )
}

function DocumentDownloadBadges({ documents }: { documents: RunningExamDocument[] }) {
    const sortedDocuments = useMemo(
        () => [...documents].sort((a, b) => a.title.localeCompare(b.title)),
        [documents],
    )
    const [downloadingNm, setDownloadingNm] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const runDownload = useCallback(
        async (document: RunningExamDocument) => {
            if (downloadingNm) return
            setDownloadingNm(document.document_nm)
            setError(null)
            try {
                await downloadExamDocument(document)
            } catch (downloadError: unknown) {
                setError(liveErrorMessage(downloadError, 'Could not download the document.'))
            } finally {
                setDownloadingNm(null)
            }
        },
        [downloadingNm],
    )

    return (
        <span className="inline-flex max-w-full flex-col gap-1">
            <span className="inline-flex max-w-full flex-wrap gap-1.5">
                {sortedDocuments.map((document) => {
                    const downloading = downloadingNm === document.document_nm
                    const typeLabel = documentTypeLabel(document)
                    const FileIcon = getDocumentFileIcon(document.type)
                    const actionLabel =
                        typeLabel === 'PDF'
                            ? `Open ${document.title}`
                            : `Download ${document.title}`

                    return (
                        <Badge
                            key={document.document_nm}
                            asChild
                            variant="secondary"
                            className={cn(
                                'h-auto max-w-full font-normal',
                                downloading && 'pointer-events-none opacity-70',
                            )}
                        >
                            <button
                                type="button"
                                disabled={downloadingNm !== null}
                                aria-busy={downloading}
                                aria-label={downloading ? `Loading ${document.title}` : actionLabel}
                                onClick={() => void runDownload(document)}
                            >
                                {downloading ? (
                                    <Loader2Icon className="size-3 shrink-0 animate-spin" aria-hidden />
                                ) : (
                                    <FileIcon className="size-3 shrink-0" aria-hidden />
                                )}
                                <span className="truncate">{document.title}</span>
                            </button>
                        </Badge>
                    )
                })}
            </span>
            {error ? (
                <span className="text-sm text-destructive" role="alert">
                    {error}
                </span>
            ) : null}
        </span>
    )
}

function sortedCompilerBadges(
    compilerIds: string[],
    compilerNameById: Record<string, string>,
): TitleBadgeItem[] {
    return [...compilerIds]
        .sort((a, b) =>
            (compilerNameById[a] ?? a).localeCompare(compilerNameById[b] ?? b, undefined, {
                sensitivity: 'base',
            }),
        )
        .map((compilerId) => ({
            key: compilerId,
            label: compilerNameById[compilerId] ?? compilerId,
        }))
}

function ExamPlaceValue({ place }: { place: string | null | undefined }) {
    const value = place?.trim() ?? ''
    if (!value) {
        return null
    }
    return (
        <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium text-foreground">{value}</span>
        </span>
    )
}

function courseAndAuthorValue(courseTitle: string | null, instructorName: string | null): ReactNode {
    const course = courseTitle?.trim() ?? ''
    const author = instructorName?.trim() ?? ''
    if (!course && !author) {
        return '—'
    }

    return (
        <span className="inline-flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {course ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                    <BookOpenIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate text-sm font-medium text-foreground">{course}</span>
                </span>
            ) : null}
            {author ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                    <SignatureIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate text-sm font-medium text-foreground">{author}</span>
                </span>
            ) : null}
        </span>
    )
}

type ParticipantStatKey = keyof Pick<
    LiveRosterParticipantStats,
    'entered' | 'finished' | 'banned' | 'invited' | 'total'
>

function ParticipantStatsValue({
    stats,
    loading,
    contest,
}: {
    stats: LiveRosterParticipantStats | null
    loading: boolean
    contest: boolean
}) {
    if (loading && !stats) {
        return <span className="text-sm text-muted-foreground">Loading…</span>
    }
    if (!stats) {
        return <span className="text-sm text-muted-foreground">—</span>
    }

    const items: {
        key: ParticipantStatKey
        label: string
        valueClassName?: string
    }[] = [
            { key: 'entered', label: 'Entered' },
            { key: 'finished', label: 'Finished' },
            {
                key: 'banned',
                label: 'Banned',
                valueClassName: stats.banned > 0 ? 'text-destructive' : undefined,
            },
        ]
    if (contest) {
        items.push({ key: 'invited', label: 'Invited' })
    }
    items.push({ key: 'total', label: 'Total' })

    return (
        <dl className="flex flex-wrap justify-center gap-2">
            {items.map((item) => (
                <div
                    key={item.key}
                    className="min-w-[4.5rem] rounded-lg border border-border/80 bg-muted/30 px-3 py-2"
                >
                    <dt className="text-right text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                        {item.label}
                    </dt>
                    <dd
                        className={cn(
                            'mt-0.5 text-right text-xl font-semibold tabular-nums tracking-tight text-foreground',
                            item.valueClassName,
                        )}
                    >
                        {PARTICIPANT_COUNT_FORMAT.format(stats[item.key])}
                    </dd>
                </div>
            ))}
        </dl>
    )
}

function ControllerExamIdentityCard({
    exam,
    headingId,
    courseTitle,
    instructorName,
    place,
}: {
    exam: RunningExam
    headingId?: string
    courseTitle: string | null
    instructorName: string | null
    place: string | null
}) {
    return (
        <Card className={CONTROLLER_CARD_CLASS}>
            <CardContent className="px-4 py-3 sm:px-5 sm:py-4">
                <h2
                    id={headingId}
                    className="min-w-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                >
                    {exam.title}
                </h2>
                <div className="mt-1.5 flex flex-col gap-1">
                    {courseAndAuthorValue(courseTitle, instructorName)}
                    <ExamPlaceValue place={place} />
                </div>
            </CardContent>
        </Card>
    )
}

type ControllerExamPasswordCardProps = {
    exam: RunningExam
    tutorStatus: LiveTutorStatus
    headingId?: string
    className?: string
}

type ControllerExamParticipantsCardProps = {
    exam: RunningExam
    className?: string
}

export function ControllerExamParticipantsCard({
    exam,
    className,
}: ControllerExamParticipantsCardProps) {
    const [participantStats, setParticipantStats] = useState<LiveRosterParticipantStats | null>(null)
    const [participantsLoading, setParticipantsLoading] = useState(true)

    useEffect(() => {
        let active = true

        async function loadParticipants() {
            try {
                const roster = await fetchLiveRoster()
                if (!active) return
                setParticipantStats(liveRosterParticipantStats(roster))
            } catch {
                if (!active) return
                setParticipantStats(null)
            } finally {
                if (active) setParticipantsLoading(false)
            }
        }

        setParticipantsLoading(true)
        void loadParticipants()
        const timer = window.setInterval(() => {
            void loadParticipants()
        }, 10_000)

        return () => {
            active = false
            window.clearInterval(timer)
        }
    }, [])

    return (
        <Card className={cn(CONTROLLER_CARD_CLASS, className)}>
            <CardContent className="flex flex-col items-center justify-center px-4 py-4 sm:px-5 sm:py-5">
                <ParticipantStatsValue
                    contest={exam.contest != 0}
                    loading={participantsLoading}
                    stats={participantStats}
                />
            </CardContent>
        </Card>
    )
}

export function ControllerExamPasswordCard({
    exam,
    tutorStatus,
    headingId = 'live-controller-exam-password-heading',
    className,
}: ControllerExamPasswordCardProps) {
    const passwordLabel = exam.contest != 0 ? 'Contest password' : 'Exam password'
    const password = tutorStatus.password?.trim() ?? ''
    const [blurred, setBlurred] = useState(false)
    const toggleBlurLabel = blurred ? 'Show password' : 'Blur password'

    return (
        <Card className={cn(CONTROLLER_CARD_CLASS, className)}>
            <CardContent className="flex flex-col items-center justify-center gap-1 px-4 py-4 text-center sm:px-5 sm:py-5">
                <div className="flex items-center justify-center gap-1.5">
                    <p id={headingId} className="text-sm font-medium text-muted-foreground">
                        {passwordLabel}
                    </p>
                    {password ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                                        aria-label={toggleBlurLabel}
                                        aria-pressed={blurred}
                                        onClick={() => setBlurred((prev) => !prev)}
                                    >
                                        {blurred ? (
                                            <EyeIcon className="size-4" aria-hidden />
                                        ) : (
                                            <EyeOffIcon className="size-4" aria-hidden />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{toggleBlurLabel}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : null}
                </div>
                <p
                    className={cn(
                        'font-mono text-2xl font-semibold tracking-widest text-foreground tabular-nums transition-[filter] sm:text-3xl',
                        blurred && password && 'blur-[6px] select-none',
                    )}
                    aria-labelledby={headingId}
                    aria-hidden={blurred && Boolean(password)}
                >
                    {password || '—'}
                </p>
            </CardContent>
        </Card>
    )
}

function buildControllerResourceRows(
    exam: RunningExam,
    compilerNameById: Record<string, string>,
): DataRowSpec[] {
    return [
        {
            label: 'Problems',
            value:
                exam.problems.length > 0 ? (
                    <ProblemLinkBadges problems={exam.problems} />
                ) : (
                    '—'
                ),
        },
        {
            label: 'Documents',
            value:
                exam.documents.length > 0 ? (
                    <DocumentDownloadBadges documents={exam.documents} />
                ) : (
                    '—'
                ),
        },
        {
            label: 'Compilers',
            value:
                exam.compilers.length > 0 ? (
                    <TitleBadges items={sortedCompilerBadges(exam.compilers, compilerNameById)} />
                ) : (
                    '—'
                ),
        },
    ]
}

function ControllerExamDataCard({
    caption,
    rows,
    className,
}: {
    caption: string
    rows: DataRowSpec[]
    className?: string
}) {
    return (
        <Card className={cn(CONTROLLER_CARD_CLASS, className)}>
            <CardContent className="px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex w-full flex-col" role="table" aria-label={caption}>
                    {rows.map((row) => (
                        <DataRow key={row.label} label={row.label} value={row.value} live={row.live} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

type LiveControllerExamCardProps = {
    exam: RunningExam
    examKey?: string | null
    headingId?: string
    className?: string
}

export function LiveControllerExamCard({
    exam,
    examKey,
    headingId,
    className,
}: LiveControllerExamCardProps) {
    const courseTitle = useLiveExamCourseTitle(exam, examKey)
    const place = useLiveExamPlace(exam, examKey)
    const instructorName = runningExamInstructorName(exam)
    return (
        <div className={cn(CONTROLLER_INFO_ROOT_CLASS, className)}>
            <ControllerExamIdentityCard
                courseTitle={courseTitle}
                exam={exam}
                headingId={headingId}
                instructorName={instructorName}
                place={place}
            />
        </div>
    )
}

type LiveControllerExamResourcesCardProps = {
    exam: RunningExam
    className?: string
}

export function LiveControllerExamResourcesCard({ exam, className }: LiveControllerExamResourcesCardProps) {
    const [compilerNameById, setCompilerNameById] = useState<Record<string, string>>({})

    useEffect(() => {
        if (exam.compilers.length === 0) return
        let active = true
        void jutge.tables.getCompilers().then((compilers) => {
            if (!active) return
            const names: Record<string, string> = {}
            for (const compilerId of exam.compilers) {
                names[compilerId] = compilers[compilerId]?.name ?? compilerId
            }
            setCompilerNameById(names)
        })
        return () => {
            active = false
        }
    }, [exam.compilers])

    const resourceRows = useMemo(
        () => buildControllerResourceRows(exam, compilerNameById),
        [exam, compilerNameById],
    )

    return (
        <div className={cn(CONTROLLER_INFO_ROOT_CLASS, className)}>
            <ControllerExamDataCard caption="Exam problems, documents, and compilers" rows={resourceRows} />
        </div>
    )
}

export function ControllerExamStatusBadge({
    status,
    label,
}: {
    status: ReturnType<typeof tutorExamCtlStatusToLiveStatus>
    label: string
}) {
    return (
        <Badge
            className={cn(
                'h-auto shrink-0 gap-1.5 border-transparent py-1 font-semibold',
                status === 'waiting' &&
                'bg-amber-500/15 text-amber-950 dark:bg-amber-500/20 dark:text-amber-100',
                status === 'running' && 'bg-blue/15 text-blue-ink',
                status === 'finished' && 'bg-destructive/15 text-destructive-ink',
            )}
        >
            {status === 'waiting' ? <ClockIcon aria-hidden /> : null}
            {status === 'running' ? (
                <span
                    className="size-1.5 shrink-0 animate-pulse rounded-full bg-blue"
                    aria-hidden
                />
            ) : null}
            {status === 'finished' ? <CheckIcon aria-hidden /> : null}
            {label}
        </Badge>
    )
}

function DataRow({ label, value, live }: { label: string; value: ReactNode; live?: boolean }) {
    return (
        <div role="row" className={DATA_ROW_GRID_CLASS}>
            <div role="rowheader" className={LABEL_CLASS}>
                {label}
            </div>
            <div
                role="cell"
                className={cn(VALUE_CLASS, live && 'tabular-nums')}
                {...(live ? { role: 'timer', 'aria-live': 'polite' as const, 'aria-atomic': true as const } : {})}
            >
                {value}
            </div>
        </div>
    )
}

type ControllerExamMarkdownCardProps = {
    title: string
    markdown: string | null | undefined
    emptyText: string
    className?: string
    headingId?: string
}

export function ControllerExamMarkdownCard({
    title,
    markdown,
    emptyText,
    className,
    headingId,
}: ControllerExamMarkdownCardProps) {
    const hasContent = Boolean(markdown?.trim())

    return (
        <Card
            className={cn(
                'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border py-0 shadow-sm ring-0',
                className,
            )}
        >
            <CardContent className="flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-5 sm:py-4">
                <h3
                    id={headingId}
                    className="shrink-0 text-sm font-semibold tracking-tight text-foreground"
                >
                    {title}
                </h3>
                <div className="mt-2 min-h-0 max-h-72 overflow-y-auto overscroll-contain sm:max-h-80">
                    {hasContent ? (
                        <MarkdownText className="text-sm text-muted-foreground">{markdown!}</MarkdownText>
                    ) : (
                        <p className="text-sm text-muted-foreground">{emptyText}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}