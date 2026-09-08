'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { PageSpinner } from '@/components/ClientGates'
import { CourseStatisticsView } from '@/components/instructor/courses/CourseStatisticsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { FullWidthBreakout } from '@/components/layout/FullWidthBreakout'
import { instructorCourseSubNav } from '@/lib/instructor/menus'
import { loadCourseStatisticsDataByNm, type CourseStatisticsPageData } from '@/lib/instructor/loadCourseStatisticsData'

export default function InstructorCourseStatisticsPage() {
    const { course_nm } = useParams<{ course_nm: string }>()
    const baseHref = `/instructor/courses/${course_nm}`
    const [data, setData] = useState<CourseStatisticsPageData | null>(null)

    useEffect(() => {
        void loadCourseStatisticsDataByNm(course_nm).then(setData)
    }, [course_nm])

    if (!data) {
        return <PageSpinner />
    }

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Courses', url: '/instructor/courses' },
                { title: course_nm, url: `${baseHref}/statistics` },
            ]}
        >
            <InstructorSubNav
                items={instructorCourseSubNav(course_nm)}
                baseHref={baseHref}
                activeSegment="statistics"
            />
            <FullWidthBreakout className="px-2">
                <CourseStatisticsView data={data} />
            </FullWidthBreakout>
        </InstructorPageShell>
    )
}
