'use client'

import { useEffect, useState } from 'react'

import { MarkdownText } from '@/components/general/MarkdownText'
import { Card, CardContent } from '@/components/ui/card'
import {
    formatLiveDateTime,
    formatRunningTimeHuman,
    resolveLiveExamCourseTitle,
    runningExamCourseTitle,
} from '@/lib/data/liveExam'
import type { RunningExam } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

const LABEL_CLASS = 'w-0 whitespace-nowrap pr-4 text-right align-baseline text-sm font-medium text-muted-foreground'
const VALUE_CLASS = 'min-w-0 text-left align-baseline text-sm font-medium text-foreground sm:text-base'

function useNow(): number {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [])
    return now
}

type LivePreStartCardProps = {
    exam: RunningExam
    examKey?: string | null
    className?: string
}

export function LivePreStartCard({ exam, examKey, className }: LivePreStartCardProps) {
    const now = useNow()
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

    const rows = [
        { label: 'Expected start time', value: formatLiveDateTime(exam.exp_time_start) },
        { label: 'Current time', value: formatLiveDateTime(now), live: true },
        { label: 'Running time', value: formatRunningTimeHuman(exam.running_time) },
        { label: 'Status', value: 'Not yet started' },
    ] as const

    return (
        <Card className={cn('w-full overflow-hidden rounded-2xl border border-border py-0 shadow-sm ring-0', className)}>
            <div className="border-b border-border bg-muted/60 px-4 py-3 sm:px-5">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">{exam.title}</h1>
                {courseTitle ? (
                    <p className="mt-0.5 text-sm font-medium text-muted-foreground">{courseTitle}</p>
                ) : null}
            </div>
            <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
                <table className="w-full border-collapse [&_td]:py-1.5 [&_th]:py-1.5">
                    <caption className="sr-only">Exam details before start</caption>
                    <tbody>
                        {rows.map((row) => (
                            <DataRow key={row.label} label={row.label} value={row.value} live={'live' in row && row.live} />
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