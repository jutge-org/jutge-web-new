'use client'

import { StatisticsChartTableView } from '@/components/instructor/statistics/StatisticsChartTableView'
import { CardAction, CardContent, CardHeader, CardTitle, ResizableCard } from '@/components/ResizableCard'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import {
    ACCEPTED_PROBLEMS_BUCKET_SIZE_DEFAULT,
    ACCEPTED_PROBLEMS_BUCKET_SIZE_MAX,
    ACCEPTED_PROBLEMS_BUCKET_SIZE_MIN,
    deriveAcceptedProblemsStudentsHistogram,
} from '@/lib/instructor/courseAcceptedProblemsHistogram'
import { deriveCourseStudentRanking } from '@/lib/instructor/courseStudentRanking'
import type { Dict } from '@/lib/instructor/utils'
import type { CourseSubmission, InstructorCourse, InstructorList, StudentProfile } from '@/lib/jutge_api_client'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

type AcceptedProblemsStudentsCardProps = {
    course: InstructorCourse
    profiles: Dict<StudentProfile>
    lists: InstructorList[]
    submissions: CourseSubmission[]
}

export function AcceptedProblemsStudentsCard({
    course,
    profiles,
    lists,
    submissions,
}: AcceptedProblemsStudentsCardProps) {
    const [bucketSize, setBucketSize] = useState(ACCEPTED_PROBLEMS_BUCKET_SIZE_DEFAULT)

    const acceptedCounts = useMemo(
        () => deriveCourseStudentRanking(course, profiles, lists, submissions).map((row) => row.ok),
        [course, profiles, lists, submissions],
    )

    const chartData = useMemo(
        () => deriveAcceptedProblemsStudentsHistogram(acceptedCounts, bucketSize),
        [acceptedCounts, bucketSize],
    )

    const chartConfig = useMemo(
        () => ({
            students: {
                label: 'Students',
                color: 'oklch(0.55 0.14 240)',
            },
        }),
        [],
    )

    return (
        <ResizableCard className="w-full" defaultHeight={340}>
            <CardHeader className="p-4">
                <CardTitle>AC problems/students</CardTitle>
                <CardAction>
                    <div className="flex items-center gap-2">
                        <span className="shrink-0 text-xs text-muted-foreground">Bucket size</span>
                        <Slider
                            min={ACCEPTED_PROBLEMS_BUCKET_SIZE_MIN}
                            max={ACCEPTED_PROBLEMS_BUCKET_SIZE_MAX}
                            step={1}
                            value={[bucketSize]}
                            onValueChange={(value) => setBucketSize(value[0] ?? ACCEPTED_PROBLEMS_BUCKET_SIZE_DEFAULT)}
                            aria-label="Bucket size"
                            className="w-18"
                        />
                        <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            {bucketSize}
                        </span>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {chartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students to display.</p>
                ) : (
                    <StatisticsChartTableView
                        exportFileName={`${course.course_nm}-accepted-problems-students`}
                        csvRecords={chartData.map((row) => ({
                            'Accepted problems': row.label,
                            Students: row.students,
                        }))}
                        hasData={chartData.some((row) => row.students > 0)}
                        table={
                            <ScrollArea className="h-[200px] w-full">
                                <Table>
                                    <TableBody>
                                        {chartData.map((row) => (
                                            <TableRow key={row.label}>
                                                <TableCell>{row.label}</TableCell>
                                                <TableCell className="text-end">{row.students}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        }
                    >
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    label={{
                                        position: 'insideBottom',
                                        offset: -4,
                                    }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    label={{
                                        value: 'Students',
                                        angle: -90,
                                        position: 'insideLeft',
                                    }}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="students" fill="var(--color-students)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </StatisticsChartTableView>
                )}
            </CardContent>
        </ResizableCard>
    )
}
