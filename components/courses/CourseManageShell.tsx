'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AccessDeniedGate } from '@/components/AccessDeniedGate'
import { CourseDetailHeader, CourseDetailLoading } from '@/components/courses/CourseDetail'
import { CourseDetailNav } from '@/components/courses/CourseDetailNav'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import {
    buildCourseRow,
    canSuperviseCourse,
    courseHref,
    isCourseOwnedByUser,
    isCourseTutor,
    type CourseStatus,
} from '@/lib/courses'
import { fetchCourse, fetchPublicCourse } from '@/lib/data/courses'
import type { Course } from '@/lib/jutge_api_client'
import jutge from '@/lib/jutge'

type CourseManageCoreData = {
    courseKey: string
    course: Course
    status: CourseStatus
    isOwner: boolean
    isTutor: boolean
    row: ReturnType<typeof buildCourseRow>
    problemCount?: number
}

type CourseManageShellProps = {
    userId: string
    children?: ReactNode
}

/** Shared shell for course owner/tutor management tabs under `/courses/[course_key]/*`. */
export function CourseManageShell({ userId, children }: CourseManageShellProps) {
    const params = useParams<{ course_key: string }>()
    const [courseData, setCourseData] = useState<CourseManageCoreData | null | undefined>(undefined)
    const [reloadToken, setReloadToken] = useState(0)

    useEffect(() => {
        let cancelled = false

        setCourseData(undefined)

        void (async () => {
            const [result, profile] = await Promise.all([
                fetchCourse(jutge, params.course_key),
                jutge.student.profile.get(),
            ])
            if (cancelled) {
                return
            }

            if (!result) {
                setCourseData(null)
                return
            }

            const { courseKey, course, status } = result
            const isOwner = isCourseOwnedByUser(course.owner, profile)
            const isTutor = isCourseTutor(course, isOwner)
            const row = buildCourseRow(course, status, courseKey, isOwner)

            let problemCount: number | undefined
            if (status === 'available' && course.public !== 0) {
                const publicCourse = await fetchPublicCourse(courseKey)
                if (!cancelled && publicCourse) {
                    problemCount = publicCourse.course.problem_count
                }
            }

            setCourseData({
                courseKey,
                course,
                status,
                isOwner,
                isTutor,
                row,
                problemCount,
            })
        })()

        return () => {
            cancelled = true
        }
    }, [params.course_key, reloadToken])

    if (courseData === null) {
        notFound()
    }

    const href = courseHref(params.course_key)

    if (courseData !== undefined && !canSuperviseCourse(courseData)) {
        return <AccessDeniedGate />
    }

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs
                breadcrumbs={[
                    { title: 'Courses', url: '/courses' },
                    { title: courseData?.row.title ?? '…', url: href },
                ]}
            />
            {courseData === undefined ? (
                <CourseDetailLoading />
            ) : (
                <>
                    <CourseDetailNav
                        courseKey={courseData.courseKey}
                        isOwner={courseData.isOwner}
                        isTutor={courseData.isTutor}
                    />
                    <CourseDetailHeader
                        courseKey={courseData.courseKey}
                        course={courseData.course}
                        status={courseData.status}
                        isOwner={courseData.isOwner}
                        isTutor={courseData.isTutor}
                        userId={userId}
                        problemCount={courseData.problemCount}
                        onCourseChanged={() => setReloadToken((token) => token + 1)}
                    />
                    {children}
                </>
            )}
        </div>
    )
}

export function CourseInConstruction() {
    return <p className="text-muted-foreground">In construction.</p>
}
