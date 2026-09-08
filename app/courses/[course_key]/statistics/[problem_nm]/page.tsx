'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { AuthedGate, PageSpinner } from '@/components/ClientGates'
import { CourseManageShell, type CourseManageCoreData } from '@/components/courses/CourseManageShell'
import { CourseProblemStatisticsView } from '@/components/instructor/courses/CourseProblemStatisticsView'
import { courseHref, courseNmFromKey } from '@/lib/courses'
import {
    loadCourseProblemStatisticsData,
    type CourseProblemStatisticsPageData,
} from '@/lib/instructor/loadCourseProblemStatisticsData'

function CourseProblemStatisticsContent({
    courseKey,
    problem_nm,
}: {
    courseKey: string
    problem_nm: string
}) {
    const course_nm = courseNmFromKey(courseKey)
    const [data, setData] = useState<CourseProblemStatisticsPageData | null>(null)

    useEffect(() => {
        if (!course_nm) return
        void loadCourseProblemStatisticsData(course_nm, problem_nm, courseKey).then(setData)
    }, [course_nm, problem_nm, courseKey])

    if (!course_nm || !data) {
        return <PageSpinner />
    }

    const href = courseHref(courseKey)

    return (
        <CourseProblemStatisticsView
            data={data}
            courseStatsHref={`${href}/statistics`}
            courseHref={href}
        />
    )
}

export default function CourseProblemStatisticsPage() {
    const { problem_nm } = useParams<{ problem_nm: string }>()

    return (
        <AuthedGate>
            {(user) => (
                <CourseManageShell userId={user.id}>
                    {(courseData: CourseManageCoreData) => (
                        <CourseProblemStatisticsContent
                            courseKey={courseData.courseKey}
                            problem_nm={problem_nm}
                        />
                    )}
                </CourseManageShell>
            )}
        </AuthedGate>
    )
}
