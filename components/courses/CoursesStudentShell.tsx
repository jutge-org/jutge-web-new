'use client'

import { useEffect, useState } from 'react'

import { CoursesList } from '@/components/courses/CoursesList'
import { CoursesNav } from '@/components/courses/CoursesNav'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import jutge from '@/lib/jutge'
import type { CoursesData, CoursesTab } from '@/lib/courses'
import { fetchCoursesData } from '@/lib/data/courses'
import { fetchCoursesProgress, type CourseProgress } from '@/lib/data/coursesProgress'

const emptyCourseCounts: Pick<CoursesData, 'enrolled' | 'available' | 'archived'> = {
    enrolled: [],
    available: [],
    archived: [],
}

type CoursesStudentShellProps = {
    activeTab: CoursesTab
    data?: CoursesData | null
    children: React.ReactNode
}

export function CoursesStudentShell({ activeTab, data, children }: CoursesStudentShellProps) {
    const counts = data ?? emptyCourseCounts

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Courses', url: '/courses' }]} />
            <PageTitle section="/courses" authenticated />
            <CoursesNav activeTab={activeTab} counts={counts} />
            {children}
        </div>
    )
}

type CoursesTabPageProps = {
    activeTab: CoursesTab
    userId: string
}

export function CoursesTabPage({ activeTab, userId }: CoursesTabPageProps) {
    const [data, setData] = useState<CoursesData | null>(null)
    const [progress, setProgress] = useState<Record<string, CourseProgress> | undefined>(undefined)
    const [progressLoading, setProgressLoading] = useState(false)
    // Bumped after enroll/archive/etc. router.refresh() does not re-run this client fetch.
    const [reloadToken, setReloadToken] = useState(0)

    useEffect(() => {
        let cancelled = false

        void (async () => {
            const coursesData = await fetchCoursesData(jutge)
            if (cancelled) {
                return
            }

            // Show the cards straight away; progress is a second, slower pass.
            setData(coursesData)

            // Archived courses are still enrolled, so both tabs can show progress.
            const courseKeys = [...coursesData.enrolled, ...coursesData.archived].map((course) => course.course_key)
            if (courseKeys.length === 0) {
                setProgress(undefined)
                return
            }

            setProgressLoading(true)
            try {
                const coursesProgress = await fetchCoursesProgress(jutge, courseKeys)
                if (!cancelled) {
                    setProgress(coursesProgress)
                }
            } finally {
                if (!cancelled) {
                    setProgressLoading(false)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [reloadToken])

    // Available courses carry no progress: the student has not worked on them yet.
    const tabHasProgress = activeTab !== 'available'

    return (
        <CoursesStudentShell activeTab={activeTab} data={data}>
            <CoursesList
                tab={activeTab}
                courses={data?.[activeTab] ?? []}
                userId={userId}
                loading={data === null}
                progress={tabHasProgress ? progress : undefined}
                progressLoading={tabHasProgress && progressLoading}
                onCoursesChanged={() => setReloadToken((token) => token + 1)}
            />
        </CoursesStudentShell>
    )
}
