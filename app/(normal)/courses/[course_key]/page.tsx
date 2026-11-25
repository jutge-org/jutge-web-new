'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import { CourseDetail, CourseDetailLoading } from '@/components/courses/CourseDetail'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import jutge from '@/lib/jutge'
import { buildCourseRow, courseHref, isCourseOwnedByUser, isCourseTutor } from '@/lib/courses'
import type { LastSubmissionInfo } from '@/lib/submissions'
import { getPreferredLanguageId } from '@/lib/data/auth'
import { fetchCourse, fetchPublicCourse } from '@/lib/data/courses'
import { fetchCourseListsData, type CourseListData } from '@/lib/data/lists'
import { fetchAllAbstractProblems, fetchLanguages, fetchStudentProblemStatuses } from '@/lib/data/problems'
import { fetchLastSubmissionsByProblemNm } from '@/lib/data/submissions'
import type { Course, Language, AbstractStatus, Profile } from '@/lib/jutge_api_client'
import type { CourseStatus } from '@/lib/courses'

type CourseCoreData = {
    courseKey: string
    course: Course
    status: CourseStatus
    isOwner: boolean
    isTutor: boolean
    row: ReturnType<typeof buildCourseRow>
    problemCount?: number
}

type CourseListsData = {
    lists: CourseListData[]
    languages: Record<string, Language>
    statuses?: Record<string, AbstractStatus>
    lastSubmissions?: Record<string, LastSubmissionInfo>
}

export default function CoursePage() {
    return <AuthedGate>{(user) => <CoursePageContent userId={user.id} />}</AuthedGate>
}

function CoursePageContent({ userId }: { userId: string }) {
    const params = useParams<{ course_key: string }>()
    const [courseData, setCourseData] = useState<CourseCoreData | null | undefined>(undefined)
    const [listsData, setListsData] = useState<CourseListsData | undefined>(undefined)
    const [listsLoading, setListsLoading] = useState(false)
    // Bumped when the enrollment changes, to fetch the course again: the status decides whether
    // the lists are loaded at all, so it cannot be left stale.
    const [reloadToken, setReloadToken] = useState(0)

    useEffect(() => {
        let cancelled = false

        setCourseData(undefined)
        setListsData(undefined)
        setListsLoading(false)

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

            if (status === 'available') {
                return
            }

            setListsLoading(true)
            void loadCourseLists({
                course,
                profile,
                isCancelled: () => cancelled,
                setListsData,
                setListsLoading,
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
                <CourseDetail
                    courseKey={courseData.courseKey}
                    course={courseData.course}
                    status={courseData.status}
                    isOwner={courseData.isOwner}
                    isTutor={courseData.isTutor}
                    userId={userId}
                    lists={listsData?.lists ?? []}
                    languages={listsData?.languages ?? {}}
                    statuses={listsData?.statuses}
                    lastSubmissions={listsData?.lastSubmissions}
                    listsLoading={listsLoading}
                    problemCount={courseData.problemCount}
                    onCourseChanged={() => setReloadToken((token) => token + 1)}
                />
            )}
        </div>
    )
}

async function loadCourseLists({
    course,
    profile,
    isCancelled,
    setListsData,
    setListsLoading,
}: {
    course: Course
    profile: Profile
    isCancelled: () => boolean
    setListsData: (data: CourseListsData) => void
    setListsLoading: (loading: boolean) => void
}) {
    try {
        const [preferredLanguageId, languages, statuses, lastSubmissionsByProblemNm] = await Promise.all([
            getPreferredLanguageId(),
            fetchLanguages(),
            fetchStudentProblemStatuses(jutge),
            fetchLastSubmissionsByProblemNm(jutge),
        ])
        if (isCancelled()) {
            return
        }

        const problems = await fetchAllAbstractProblems(preferredLanguageId)
        if (isCancelled()) {
            return
        }

        const lists = await fetchCourseListsData(jutge, course.lists, problems, profile)
        if (isCancelled()) {
            return
        }

        setListsData({
            lists,
            languages,
            statuses,
            lastSubmissions: Object.fromEntries(lastSubmissionsByProblemNm),
        })
    } finally {
        if (!isCancelled()) {
            setListsLoading(false)
        }
    }
}
