'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AuthedGate } from '@/components/ClientGates'
import { CourseManageShell, type CourseManageCoreData } from '@/components/courses/CourseManageShell'
import { CourseStatisticsView } from '@/components/instructor/courses/CourseStatisticsView'
import SwitchboardCard from '@/components/smoothui/switchboard-card'
import { courseHref } from '@/lib/courses'
import { loadCourseStatisticsData, type CourseStatisticsPageData } from '@/lib/instructor/loadCourseStatisticsData'

function CourseStatisticsContent({ courseKey, course }: Pick<CourseManageCoreData, 'courseKey' | 'course'>) {
    const [data, setData] = useState<CourseStatisticsPageData | null | undefined>(undefined)
    const listKeys = course.lists.join(',')

    useEffect(() => {
        let cancelled = false
        setData(undefined)

        void (async () => {
            try {
                const pageData = await loadCourseStatisticsData({ courseKey, course })
                if (!cancelled) {
                    setData(pageData)
                }
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
        // Intentionally depend on course identity fields, not the object reference.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- course fields captured via courseKey/listKeys/course_nm
    }, [courseKey, listKeys, course.course_nm])

    if (data === undefined) {
        return (
            <div className="mx-auto w-full max-w-lg py-4" aria-busy="true" aria-label="Loading statistics">
                <SwitchboardCard
                    title="Loading statistics..."
                    subtitle="Gathering submissions and preparing charts for this course."
                    randomLights
                    className="h-[220px]"
                />
            </div>
        )
    }

    if (data === null) {
        return <p className="text-sm text-muted-foreground">Could not load statistics.</p>
    }

    return <CourseStatisticsView data={data} statisticsBaseHref={`${courseHref(courseKey)}/statistics`} />
}

export default function CourseStatisticsPage() {
    return (
        <AuthedGate>
            {(user) => (
                <CourseManageShell userId={user.id}>
                    {(courseData: CourseManageCoreData) => (
                        <CourseStatisticsContent courseKey={courseData.courseKey} course={courseData.course} />
                    )}
                </CourseManageShell>
            )}
        </AuthedGate>
    )
}
