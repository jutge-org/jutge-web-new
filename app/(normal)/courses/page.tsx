'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { AuthedGate, PageSpinner } from '@/components/ClientGates'
import { CoursesTabPage } from '@/components/courses/CoursesStudentShell'
import { parseCoursesTab } from '@/lib/courses'

export default function CoursesPage() {
    return (
        <Suspense fallback={<PageSpinner />}>
            <CoursesPageContent />
        </Suspense>
    )
}

function CoursesPageContent() {
    const searchParams = useSearchParams()
    const activeTab = parseCoursesTab(searchParams.get('tab') ?? undefined)

    return <AuthedGate>{(user) => <CoursesTabPage activeTab={activeTab} userId={user.id} />}</AuthedGate>
}
