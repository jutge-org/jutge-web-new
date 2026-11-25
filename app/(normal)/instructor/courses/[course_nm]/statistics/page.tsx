'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

import { CourseStatisticsView } from '@/components/instructor/courses/CourseStatisticsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { FullWidthBreakout } from '@/components/layout/FullWidthBreakout'
import { instructorCourseSubNav } from '@/lib/instructor/menus'
import { loadCourseStatisticsDataByNm, type CourseStatisticsPageData } from '@/lib/instructor/loadCourseStatisticsData'

export default function InstructorCourseStatisticsPage() {
    const { course_nm } = useParams<{ course_nm: string }>()
    const baseHref = `/instructor/courses/${course_nm}`
    const [data, setData] = useState<CourseStatisticsPageData | null | undefined>(undefined)

    useEffect(() => {
        let cancelled = false
        setData(undefined)

        void (async () => {
            try {
                const pageData = await loadCourseStatisticsDataByNm(course_nm)
                if (!cancelled) setData(pageData)
            } catch {
                if (!cancelled) {
                    toast.error('Could not load statistics.')
                    setData(null)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [course_nm])

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
                <CourseStatisticsView
                    key={course_nm}
                    data={data ?? null}
                    loading={data === undefined}
                    error={data === null}
                />
            </FullWidthBreakout>
        </InstructorPageShell>
    )
}
