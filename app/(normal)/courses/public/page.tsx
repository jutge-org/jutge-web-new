'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import { GuestCoursesList } from '@/components/courses/GuestCoursesList'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { fetchPublicCourses } from '@/lib/data/courses'
import type { GuestCourseRow } from '@/lib/courses'

export default function PublicCoursesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [courses, setCourses] = useState<GuestCourseRow[] | null>(null)

    useEffect(() => {
        if (!loading && user) {
            router.replace('/courses')
        }
    }, [loading, user, router])

    useEffect(() => {
        if (loading || user) return
        void fetchPublicCourses().then(setCourses)
    }, [loading, user])

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Courses', url: '/courses/public' }]} />
            <PageTitle section="/courses" authenticated={false} hidden={false} />
            {loading || user || !courses ? <PageSpinner /> : <GuestCoursesList courses={courses} />}
        </div>
    )
}
