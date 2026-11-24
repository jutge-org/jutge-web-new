'use client'

import { useEffect, useMemo, useState } from 'react'

import { MarkdownText } from '@/components/general/MarkdownText'
import { Card, CardContent } from '@/components/ui/card'
import {
    type LiveExamStatus,
    formatLiveDateTime,
    formatLiveDateTimeWithRelative,
    formatRunningTimeHuman,
    resolveLiveExamCourseTitle,
    runningExamCourseTitle,
} from '@/lib/data/liveExam'
import type { RunningExam } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

const LABEL_CLASS = 'w-0 whitespace-nowrap pr-4 text-right align-baseline text-sm font-medium text-muted-foreground'
const VALUE_CLASS = 'min-w-0 text-left align-baseline text-sm font-medium text-foreground sm:text-base'

function examStatusLabel(status: LiveExamStatus): string {
    switch (status) {
        case 'waiting':
            return 'Not yet started'
        case 'running':
            return 'In progress'
        case 'finished':
            return 'Finished'
    }
}

type DataRowSpec = { label: string; value: string; live?: boolean }

function buildExamInfoRows(exam: RunningExam, status: LiveExamStatus, now: number): DataRowSpec[] {
    const rows: DataRowSpec[] = []

    if (status === 'waiting') {
        rows.push({
            label: 'Expected start time',
            value: formatLiveDateTimeWithRelative(exam.exp_time_start, now),
        })
    } else if (exam.time_start) {
        rows.push({ label: 'Start time', value: formatLiveDateTime(exam.time_start) })
    }

    rows.push({ label: 'Current time', value: formatLiveDateTime(now), live: true })
    rows.push({ label: 'Running time', value: formatRunningTimeHuman(exam.running_time) })
    rows.push({ label: 'Status', value: examStatusLabel(status) })

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
    className?: string
}

export function LiveExamInfoCard({ exam, status, now, className }: LiveExamInfoCardProps) {
    const rows = useMemo(() => buildExamInfoRows(exam, status, now), [exam, status, now])

    return (
        <Card className={cn('w-full overflow-hidden rounded-2xl border border-border py-0 shadow-sm ring-0', className)}>
            <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
                <table className="w-full border-collapse [&_td]:py-1.5 [&_th]:py-1.5">
                    <caption className="sr-only">Exam details</caption>
                    <tbody>
                        {rows.map((row) => (
                            <DataRow key={row.label} label={row.label} value={row.value} live={row.live} />
                        ))}
                        {exam.description ? (
                            <tr>
                                <th scope="row" className={cn(LABEL_CLASS, 'align-top')}>
                                    Description
                                </th>
                                <td className={cn(VALUE_CLASS, 'align-top font-normal text-muted-foreground')}>
                                    <MarkdownText className="text-sm">{exam.description}</MarkdownText>
                                </td>
                            </tr>
                        ) : null}
                        {status !== 'waiting' && exam.instructions ? (
                            <tr>
                                <th scope="row" className={cn(LABEL_CLASS, 'align-top')}>
                                    Instructions
                                </th>
                                <td className={cn(VALUE_CLASS, 'align-top font-normal text-muted-foreground')}>
                                    <MarkdownText className="text-sm">{exam.instructions}</MarkdownText>
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    )
}

function DataRow({ label, value, live }: { label: string; value: string; live?: boolean }) {
    return (
        <tr>
            <th scope="row" className={LABEL_CLASS}>
                {label}
            </th>
            <td
                className={cn(VALUE_CLASS, 'tabular-nums')}
                {...(live ? { role: 'timer', 'aria-live': 'polite' as const, 'aria-atomic': true as const } : {})}
            >
                {value}
            </td>
        </tr>
    )
}