'use client'

import { ClassProgressHeatmapCards } from '@/components/instructor/courses/ClassProgressHeatmapCard'
import { AcceptedProblemsStudentsCard } from '@/components/instructor/courses/statistics/AcceptedProblemsStudentsCard'
import { CourseStatisticsPeriodDialog } from '@/components/instructor/courses/statistics/CourseStatisticsPeriodDialog'
import { SubmissionsByDayCard } from '@/components/instructor/courses/statistics/SubmissionsByDayCard'
import { SubmissionsByDayOfWeekCard } from '@/components/instructor/courses/statistics/SubmissionsByDayOfWeekCard'
import { SubmissionsByHourOfDayCard } from '@/components/instructor/courses/statistics/SubmissionsByHourOfDayCard'
import { SubmissionsByMonthOfYearCard } from '@/components/instructor/courses/statistics/SubmissionsByMonthOfYearCard'
import { CourseProblemRankingCard } from '@/components/instructor/courses/statistics/CourseProblemRankingCard'
import { CourseStudentRankingCard } from '@/components/instructor/courses/statistics/CourseStudentRankingCard'
import { CourseSubmissionDistributionCards } from '@/components/instructor/courses/statistics/CourseSubmissionDistributionCards'
import { SubmissionsOverTimeCard } from '@/components/instructor/courses/statistics/SubmissionsOverTimeCard'
import SwitchboardCard from '@/components/smoothui/switchboard-card'
import { buildHeatmapSourceData } from '@/lib/instructor/courseHeatmapSourceData'
import { deriveCourseSubmissionChartData } from '@/lib/instructor/courseSubmissionStatistics'
import type { CourseStatisticsPageData } from '@/lib/instructor/loadCourseStatisticsData'
import { deriveSubmissionChartData, toStatisticsSubmissionFromCourse } from '@/lib/instructor/submissionStatistics'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

type CourseStatisticsViewProps = {
    data: CourseStatisticsPageData | null
    /** True while the statistics fetch is still in flight. */
    loading?: boolean
    /** True when the statistics fetch failed. */
    error?: boolean
    /** Base path for problem drill-down links. Defaults to instructor course statistics. */
    statisticsBaseHref?: string
}

function initialStartDate(submissions: CourseStatisticsPageData['submissions']): Date {
    if (submissions.length === 0) return dayjs().startOf('day').toDate()
    const sorted = [...submissions].sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf())
    return dayjs(sorted[0].time).startOf('day').toDate()
}

export function CourseStatisticsView({
    data,
    loading = false,
    error = false,
    statisticsBaseHref,
}: CourseStatisticsViewProps) {
    const submissions = data?.submissions ?? []
    const course = data?.course
    const problemStatsBaseHref =
        statisticsBaseHref ?? (course ? `/instructor/courses/${course.course_nm}/statistics` : '')
    const [settingsOpen, setSettingsOpen] = useState(true)
    const [periodAccepted, setPeriodAccepted] = useState(false)

    const today = useMemo(() => dayjs().startOf('day').toDate(), [])
    const defaultStartDate = useMemo(() => (data ? initialStartDate(data.submissions) : today), [data, today])
    const defaultEndDate = today
    // Session-only: remembered across dialog opens, reset when this view unmounts.
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(today)

    useEffect(() => {
        if (data == null || periodAccepted) return
        setStartDate(initialStartDate(data.submissions))
    }, [data, periodAccepted])

    const filteredSubmissions = useMemo(() => {
        const start = dayjs(startDate).startOf('day')
        const end = dayjs(endDate).endOf('day')
        return submissions.filter((s) => {
            const t = dayjs(s.time)
            return !t.isBefore(start) && !t.isAfter(end)
        })
    }, [submissions, startDate, endDate])

    const chartData = useMemo(
        () => deriveCourseSubmissionChartData(filteredSubmissions, { start: startDate, end: endDate }),
        [filteredSubmissions, startDate, endDate],
    )

    const statisticsSubmissions = useMemo(
        () => filteredSubmissions.map(toStatisticsSubmissionFromCourse),
        [filteredSubmissions],
    )

    const distributionData = useMemo(() => deriveSubmissionChartData(statisticsSubmissions), [statisticsSubmissions])

    const heatmap = useMemo(() => {
        if (!data) return null
        return buildHeatmapSourceData(
            data.course,
            data.profiles,
            filteredSubmissions,
            data.lists,
            data.abstractProblems,
        )
    }, [data, filteredSubmissions])

    const handleAcceptPeriod = (start: Date, end: Date) => {
        setStartDate(start)
        setEndDate(end)
        setPeriodAccepted(true)
    }

    const showCharts = data != null && periodAccepted

    return (
        <div className="flex w-full flex-col gap-4">
            {showCharts && data && heatmap ? (
                <>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <AcceptedProblemsStudentsCard
                            course={data.course}
                            profiles={data.profiles}
                            lists={data.lists}
                            submissions={filteredSubmissions}
                        />
                        <SubmissionsOverTimeCard
                            courseNm={data.course.course_nm}
                            submissions={filteredSubmissions}
                            startDate={startDate}
                            endDate={endDate}
                            colors={data.colors}
                        />
                        <SubmissionsByDayCard chartData={chartData} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <SubmissionsByMonthOfYearCard
                            courseNm={data.course.course_nm}
                            chartData={chartData}
                            colors={data.colors}
                        />
                        <SubmissionsByDayOfWeekCard
                            courseNm={data.course.course_nm}
                            chartData={chartData}
                            colors={data.colors}
                        />
                        <SubmissionsByHourOfDayCard
                            courseNm={data.course.course_nm}
                            chartData={chartData}
                            colors={data.colors}
                        />
                    </div>
                    <CourseSubmissionDistributionCards
                        courseNm={data.course.course_nm}
                        derived={distributionData}
                        colors={data.colors}
                    />
                    <ClassProgressHeatmapCards course_nm={data.course.course_nm} heatmap={heatmap} />
                    <CourseStudentRankingCard
                        course={data.course}
                        profiles={data.profiles}
                        lists={data.lists}
                        submissions={filteredSubmissions}
                    />
                    <CourseProblemRankingCard
                        course={data.course}
                        lists={data.lists}
                        submissions={filteredSubmissions}
                        abstractProblems={data.abstractProblems}
                        statisticsBaseHref={problemStatsBaseHref}
                    />
                </>
            ) : error ? (
                <p className="text-sm text-muted-foreground">Could not load statistics.</p>
            ) : loading ? (
                <div className="mx-auto w-full max-w-lg py-4" aria-busy="true" aria-label="Loading statistics">
                    <SwitchboardCard
                        title="Loading statistics..."
                        subtitle="Gathering submissions and preparing charts for this course."
                        randomLights
                        className="h-[220px]"
                    />
                </div>
            ) : null}
            <CourseStatisticsPeriodDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                startDate={startDate}
                endDate={endDate}
                defaultStartDate={defaultStartDate}
                defaultEndDate={defaultEndDate}
                onAccept={handleAcceptPeriod}
            />
        </div>
    )
}
