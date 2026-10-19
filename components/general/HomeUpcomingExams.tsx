'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
    CalendarClockIcon,
    CalendarPlusIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ClockIcon,
    MapPinIcon,
    SignatureIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { MarkdownText } from '@/components/general/MarkdownText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { fetchExamsData } from '@/lib/data/exams'
import type { ExamRow } from '@/lib/exams'
import jutge from '@/lib/jutge'
import { useOpenWebSettingsStore } from '@/store/openWebSettings'

dayjs.extend(relativeTime)

const UPCOMING_WINDOW_MS = 21 * 24 * 60 * 60 * 1000

// All upcoming exams starting within the next 3 weeks, nearest first.
function pickUpcomingExams(rows: ExamRow[]): ExamRow[] {
    const now = Date.now()
    const horizon = now + UPCOMING_WINDOW_MS

    return rows
        .filter((row) => row.statusTone === 'upcoming' && row.exp_time_startMs > now && row.exp_time_startMs <= horizon)
        .sort((a, b) => a.exp_time_startMs - b.exp_time_startMs)
}

// Full-width purple banners for every exam coming up within 3 weeks. Renders nothing while loading
// or when there are none, so cards only ever appear when they have content. Each card's collapsed
// state is persisted per exam through the synced user settings.
export function HomeUpcomingExams() {
    const [exams, setExams] = useState<ExamRow[]>([])

    useEffect(() => {
        let active = true
        void fetchExamsData(jutge)
            .then((rows) => {
                if (active) setExams(pickUpcomingExams(rows))
            })
            .catch(() => {
                // Silently ignore — the banners are optional chrome, not core content.
            })
        return () => {
            active = false
        }
    }, [])

    if (exams.length === 0) {
        return null
    }

    return (
        <div className="flex flex-col gap-3">
            {exams.map((exam) => (
                <UpcomingExamCard key={exam.exam_key} exam={exam} />
            ))}
        </div>
    )
}

function UpcomingExamCard({ exam }: { exam: ExamRow }) {
    const ready = useOpenWebSettingsStore((state) => state.ready)
    const collapsed = useOpenWebSettingsStore((state) => state.settings.ui.upcomingExamsCollapsed[exam.exam_key])
    const setUpcomingExamCollapsed = useOpenWebSettingsStore((state) => state.setUpcomingExamCollapsed)

    // Until settings hydrate, show the expanded view so a collapsed preference never flashes open.
    const isCollapsed = ready && Boolean(collapsed)

    const toggleButton = (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="size-7 shrink-0 rounded-full border-white/40 bg-transparent text-purple-50 hover:bg-white/15 hover:text-white"
                    onClick={() => setUpcomingExamCollapsed(exam.exam_key, !isCollapsed)}
                    aria-label={isCollapsed ? 'Expand upcoming exam' : 'Collapse upcoming exam'}
                    aria-expanded={!isCollapsed}
                >
                    {isCollapsed ? <ChevronDownIcon aria-hidden /> : <ChevronUpIcon aria-hidden />}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{isCollapsed ? 'Expand' : 'Collapse'}</TooltipContent>
        </Tooltip>
    )

    if (isCollapsed) {
        return (
            <Card className="rounded-2xl border-none bg-purple-600 text-purple-50 shadow-sm dark:bg-purple-700">
                <CardContent className="flex items-center gap-2.5 px-4 py-0">
                    <CourseIconImage iconUrl={exam.courseIconUrl} size="2sm" className="ring-1 ring-white/25" />
                    <div className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden">
                        <span className="shrink-0 text-xs leading-none font-semibold tracking-wide text-purple-100 uppercase">
                            Upcoming exam
                        </span>
                        <Link
                            href={`/exams/${exam.exam_key}`}
                            className="min-w-0 flex-1 truncate text-sm leading-none font-semibold text-white hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600"
                        >
                            {exam.title}
                        </Link>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-purple-100 sm:flex">
                        <ClockIcon className="size-3.5 shrink-0" aria-hidden />
                        <span>{exam.exp_time_start}</span>
                        <span className="text-purple-200">({dayjs(exam.exp_time_start).fromNow()})</span>
                    </span>
                    {exam.place ? (
                        <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-purple-100 md:flex">
                            <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
                            <span className="max-w-40 truncate">{exam.place}</span>
                        </span>
                    ) : null}
                    <TooltipProvider>{toggleButton}</TooltipProvider>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="rounded-2xl border-none bg-purple-600 text-purple-50 shadow-sm dark:bg-purple-700">
            <CardContent className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
                <Link href={`/exams/${exam.exam_key}`} className="shrink-0" aria-hidden tabIndex={-1}>
                    <CourseIconImage iconUrl={exam.courseIconUrl} size="md" className="ring-1 ring-white/25" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-purple-100 uppercase">
                                <CalendarClockIcon className="size-3.5 shrink-0" aria-hidden />
                                Upcoming exam
                            </p>
                            <Link
                                href={`/exams/${exam.exam_key}`}
                                className="mt-1 line-clamp-2 block text-lg font-semibold text-white hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600"
                            >
                                {exam.title}
                            </Link>
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-purple-100">
                                <span className="min-w-0 truncate">{exam.courseTitle}</span>
                                <span className="flex items-center gap-1.5">
                                    <SignatureIcon className="size-3.5 shrink-0" aria-hidden />
                                    {exam.ownerName}
                                </span>
                            </p>
                        </div>

                        <TooltipProvider>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="size-7 rounded-full border-white/40 bg-transparent text-purple-50 hover:bg-white/15 hover:text-white"
                                            asChild
                                        >
                                            <a
                                                href={exam.calendarUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label="Add to calendar"
                                            >
                                                <CalendarPlusIcon aria-hidden />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Add to calendar</TooltipContent>
                                </Tooltip>
                                {toggleButton}
                            </div>
                        </TooltipProvider>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <p className="flex items-start gap-2 text-sm font-medium text-purple-50">
                            <ClockIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                            <span>{exam.exp_time_start}</span>
                            <span className="text-purple-200">({dayjs(exam.exp_time_start).fromNow()})</span>
                        </p>
                        {exam.place ? (
                            <p className="flex items-start gap-2 text-sm font-medium text-purple-50">
                                <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                                <span>{exam.place}</span>
                            </p>
                        ) : null}
                    </div>

                    {exam.description ? (
                        <MarkdownText className="text-purple-100 prose-headings:text-purple-50 [&_a]:text-white [&_strong]:text-white">
                            {exam.description}
                        </MarkdownText>
                    ) : null}

                    {exam.contest ? (
                        <div>
                            <Badge variant="outline" className="border-white/40 bg-transparent text-purple-50">
                                Contest
                            </Badge>
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    )
}
