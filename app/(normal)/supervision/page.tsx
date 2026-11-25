'use client'

import { useEffect, useState } from 'react'

import { SupervisorGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { SupervisionForm } from '@/components/supervision/SupervisionForm'
import { fetchSupervisionCourseOptions } from '@/lib/data/supervision'
import type { SupervisionCourseOption } from '@/lib/supervision'

export default function SupervisionPage() {
    return <SupervisorGate>{(user) => <SupervisionPageContent userId={user.id} />}</SupervisorGate>
}

function SupervisionPageContent({ userId }: { userId: string }) {
    const [courses, setCourses] = useState<SupervisionCourseOption[] | null>(null)

    useEffect(() => {
        void fetchSupervisionCourseOptions().then(setCourses)
    }, [])

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Supervision', url: '/supervision' }]} />
            <PageTitle section="/supervision" authenticated hidden={false} />
            <SupervisionForm userId={userId} courses={courses} />
        </div>
    )
}
