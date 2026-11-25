'use client'

import { BookOpenIcon, SignatureIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { MarkdownText } from '@/components/general/MarkdownText'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    type LiveExamStatus,
    formatLiveDateTime,
    formatLiveWallClock,
    formatRemainingHumanExact,
    formatRunningTimeHumanExact,
    resolveLiveExamCourseTitle,
    runningExamCourseTitle,
    runningExamDurationMinutes,
    runningExamInstructorName,
} from '@/lib/data/liveExam'
import { LIVE_WALL_CLOCK_PLACEHOLDER } from '@/hooks/use-live-wall-clock'
import type { RunningExam } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

const LABEL_CLASS = 'w-0 whitespace-nowrap pr-4 text-right align-baseline text-sm font-medium text-muted-foreground'
const VALUE_CLASS = 'min-w-0 text-left align-baseline text-sm font-medium text-foreground sm:text-base'

type DataRowSpec = { label: string; value: string; live?: boolean }

function buildExamInfoRows(
    exam: RunningExam,
    status: LiveExamStatus,
    now: number,
    finishMs: number,
): DataRowSpec[] {
    const clockLive = now > 0
    const rows: DataRowSpec[] = [
        {
            label: 'Current time',
            value: clockLive ? formatLiveWallClock(now) : LIVE_WALL_CLOCK_PLACEHOLDER.slice(0, 5),
            live: clockLive,
        },
    ]

    if (status === 'waiting') {
        rows.push({ label: 'Expected start time', value: formatLiveDateTime(exam.exp_time_start) })
        rows.push({
            label: 'Running time',
            value: formatRunningTimeHumanExact(runningExamDurationMinutes(exam)),
        })
        return rows
    }

    rows.push({
        label: 'Start time',
        value: exam.time_start ? formatLiveDateTime(exam.time_start) : '—',
    })

    if (status === 'finished') {
        rows.push({ label: 'Remaining time', value: 'Exam finished' })
    } else {
        rows.push({
            label: 'Remaining time',
            value: clockLive
                ? formatRemainingHumanExact(Math.max(0, finishMs - now))
                : LIVE_WALL_CLOCK_PLACEHOLDER,
            live: clockLive,
        })
    }

    return rows
}

export function useLiveExamCourseTitle(exam: RunningExam, examKey?: string | null): string | null {
    const [courseTitle, setCourseTitle] = useState<string | null>(() => runningExamCourseTitle(exam))

    useEffect(() => {
        let active = true
        const inline = runningExamCourseTitle(exam)
        if (inline) {
            setCourseTitle(inline)
            return
        }
        void resolveLiveExamCourseTitle(exam, examKey).then((title) => {
            if (active) setCourseTitle(title)
        })
        return () => {
            active = false
        }
    }, [exam, examKey])

    return courseTitle
}

type LiveExamInfoCardProps = {
    exam: RunningExam
    status: LiveExamStatus
    now: number
    finishMs: number
    examKey?: string | null
    headingId?: string
    className?: string
}

export function LiveExamInfoCard({
    exam,
    status,
    now,
    finishMs,
    examKey,
    headingId,
    className,
}: LiveExamInfoCardProps) {
    const rows = useMemo(() => buildExamInfoRows(exam, status, now, finishMs), [exam, status, now, finishMs])
    const showInstructions = status === 'running' || status === 'finished'
    const courseTitle = useLiveExamCourseTitle(exam, examKey)
    const instructorName = runningExamInstructorName(exam)

    return (
        <Card className={cn('w-full overflow-hidden rounded-2xl border border-border py-0 shadow-sm ring-0', className)}>
            <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
                <table className="w-full border-collapse [&_td]:py-1.5 [&_th]:py-1.5">
                    <caption className="sr-only">Exam details</caption>
                    <tbody>
                        <tr>
                            <th scope="row" className={LABEL_CLASS} aria-hidden />
                            <td className={VALUE_CLASS}>
                                <h2
                                    id={headingId}
                                    className="text-lg font-semibold tracking-tight text-foreground"
                                >
                                    {exam.title}
                                </h2>
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
                            </td>
                        </tr>
                        {rows.map((row) => (
                            <DataRow key={row.label} label={row.label} value={row.value} live={row.live} />
                        ))}
                        <tr>
                            <th scope="row" className={LABEL_CLASS} aria-hidden />
                            <td className={VALUE_CLASS}>
                                <div className="mt-4 flex flex-wrap gap-4">
                                    <LiveExamMarkdownDialog
                                        buttonLabel="Description"
                                        dialogTitle="Description"
                                        emptyText="No description"
                                        markdown={exam.description}
                                    />
                                    {showInstructions ? (
                                        <LiveExamMarkdownDialog
                                            buttonLabel="Instructions"
                                            dialogTitle="Instructions"
                                            emptyText="No instructions"
                                            markdown={exam.instructions}
                                        />
                                    ) : null}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </CardContent>
        </Card>
    )
}

export function LiveExamMarkdownDialog({
    buttonLabel,
    dialogTitle,
    markdown,
    emptyText,
}: {
    buttonLabel: string
    dialogTitle: string
    markdown: string | null | undefined
    emptyText: string
}) {
    const [open, setOpen] = useState(false)
    const hasContent = Boolean(markdown?.trim())

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <SmoothButton
                    className="min-w-[6.5rem]"
                    color="blue"
                    size="xs"
                    type="button"
                    variant="candy"
                >
                    {buttonLabel}
                </SmoothButton>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                {hasContent ? (
                    <MarkdownText className="text-sm text-muted-foreground">{markdown!}</MarkdownText>
                ) : (
                    <p className="text-sm text-muted-foreground">{emptyText}</p>
                )}
            </DialogContent>
        </Dialog>
    )
}

function DataRow({ label, value, live }: { label: string; value: string; live?: boolean }) {
    return (
        <tr>
            <th scope="row" className={LABEL_CLASS}>
                {label}
            </th>
            <td
                className={cn(VALUE_CLASS, live && 'tabular-nums')}
                {...(live ? { role: 'timer', 'aria-live': 'polite' as const, 'aria-atomic': true as const } : {})}
            >
                {value}
            </td>
        </tr>
    )
}