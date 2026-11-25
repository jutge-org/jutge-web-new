'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { PageSpinner } from '@/components/ClientGates'
import { CourseProblemStatisticsView } from '@/components/instructor/courses/CourseProblemStatisticsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { FullWidthBreakout } from '@/components/layout/FullWidthBreakout'
import { instructorCourseSubNav } from '@/lib/instructor/menus'
import {
    loadCourseProblemStatisticsData,
    type CourseProblemStatisticsPageData,
} from '@/lib/instructor/loadCourseProblemStatisticsData'

export default function InstructorCourseProblemStatisticsPage() {
    const { course_nm, problem_nm } = useParams<{ course_nm: string; problem_nm: string }>()
    const baseHref = `/instructor/courses/${course_nm}`
    const [data, setData] = useState<CourseProblemStatisticsPageData | null>(null)

    useEffect(() => {
        void loadCourseProblemStatisticsData(course_nm, problem_nm).then(setData)
    }, [course_nm, problem_nm])

    if (!data) {
        return <PageSpinner />
    }

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Courses', url: '/instructor/courses' },
                { title: course_nm, url: `${baseHref}/statistics` },
                { title: problem_nm, url: `${baseHref}/statistics/${problem_nm}` },
            ]}
        >
            <InstructorSubNav
                items={instructorCourseSubNav(course_nm)}
                baseHref={baseHref}
                activeSegment="statistics"
            />
            <FullWidthBreakout className="mt-4 px-2">
                <CourseProblemStatisticsView data={data} />
            </FullWidthBreakout>
        </InstructorPageShell>
    )
}
