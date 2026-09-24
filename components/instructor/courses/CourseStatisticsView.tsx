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
import { buildHeatmapSourceData } from '@/lib/instructor/courseHeatmapSourceData'
import { deriveCourseSubmissionChartData } from '@/lib/instructor/courseSubmissionStatistics'
import type { CourseStatisticsPageData } from '@/lib/instructor/loadCourseStatisticsData'
import { deriveSubmissionChartData, toStatisticsSubmissionFromCourse } from '@/lib/instructor/submissionStatistics'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

type CourseStatisticsViewProps = {
    data: CourseStatisticsPageData
    /** Base path for problem drill-down links. Defaults to instructor course statistics. */
    statisticsBaseHref?: string
}

function initialStartDate(submissions: CourseStatisticsPageData['submissions']): Date {
    if (submissions.length === 0) return dayjs().startOf('day').toDate()
    const sorted = [...submissions].sort((a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf())
    return dayjs(sorted[0].time).startOf('day').toDate()
}

export function CourseStatisticsView({ data, statisticsBaseHref }: CourseStatisticsViewProps) {
    const { submissions, colors, course, profiles, lists, abstractProblems } = data
    const problemStatsBaseHref = statisticsBaseHref ?? `/instructor/courses/${course.course_nm}/statistics`
    const [settingsOpen, setSettingsOpen] = useState(false)

    const defaultStartDate = useMemo(() => initialStartDate(submissions), [submissions])
    const defaultEndDate = useMemo(() => dayjs().startOf('day').toDate(), [])
    // Session-only: remembered across dialog opens, reset when this view unmounts.
    const [startDate, setStartDate] = useState(defaultStartDate)
    const [endDate, setEndDate] = useState(defaultEndDate)

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

    const heatmap = useMemo(
        () => buildHeatmapSourceData(course, profiles, filteredSubmissions, lists, abstractProblems),
        [course, profiles, filteredSubmissions, lists, abstractProblems],
    )

    const handleAcceptPeriod = (start: Date, end: Date) => {
        setStartDate(start)
        setEndDate(end)
    }

    return (
        <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <AcceptedProblemsStudentsCard
                    course={course}
                    profiles={profiles}
                    lists={lists}
                    submissions={filteredSubmissions}
                />
                <SubmissionsOverTimeCard
                    courseNm={course.course_nm}
                    submissions={filteredSubmissions}
                    startDate={startDate}
                    endDate={endDate}
                    colors={colors}
                />
                <SubmissionsByDayCard chartData={chartData} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <SubmissionsByMonthOfYearCard courseNm={course.course_nm} chartData={chartData} colors={colors} />
                <SubmissionsByDayOfWeekCard courseNm={course.course_nm} chartData={chartData} colors={colors} />
                <SubmissionsByHourOfDayCard courseNm={course.course_nm} chartData={chartData} colors={colors} />
            </div>
            <CourseSubmissionDistributionCards courseNm={course.course_nm} derived={distributionData} colors={colors} />
            <ClassProgressHeatmapCards course_nm={course.course_nm} heatmap={heatmap} />
            <CourseStudentRankingCard
                course={course}
                profiles={profiles}
                lists={lists}
                submissions={filteredSubmissions}
            />
            <CourseProblemRankingCard
                course={course}
                lists={lists}
                submissions={filteredSubmissions}
                abstractProblems={abstractProblems}
                statisticsBaseHref={problemStatsBaseHref}
            />
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
