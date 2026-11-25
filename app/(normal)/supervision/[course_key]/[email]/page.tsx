'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { SupervisorGate } from '@/components/ClientGates'
import { SupervisionPageShell } from '@/components/supervision/SupervisionPageShell'
import { SupervisionStudentView, SupervisionStudentViewLoading } from '@/components/supervision/SupervisionStudentView'
import { normalizeCourseKeyParam } from '@/lib/courses'
import { fetchSupervisionStudentPageData, type SupervisionStudentPageData } from '@/lib/data/supervision'
import { supervisionBaseBreadcrumbs } from '@/lib/supervision'

export default function SupervisionStudentPage() {
    return (
        <SupervisorGate>
            <SupervisionStudentPageContent />
        </SupervisorGate>
    )
}

function SupervisionStudentPageContent() {
    const params = useParams<{ course_key: string; email: string }>()
    const courseKey = normalizeCourseKeyParam(params.course_key)
    const email = decodeURIComponent(params.email)
    const [data, setData] = useState<SupervisionStudentPageData | null | undefined>(undefined)

    useEffect(() => {
        void fetchSupervisionStudentPageData(courseKey, email).then(setData)
    }, [courseKey, email])

    if (data === null) {
        notFound()
    }

    const context = data?.supervisionContext ?? { courseKey, email }
    const breadcrumbs = supervisionBaseBreadcrumbs(context, data?.courseTitle)

    return (
        <SupervisionPageShell
            context={context}
            courseTitle={data?.courseTitle}
            breadcrumbs={breadcrumbs}
            profile={data?.profile}
        >
            {data === undefined ? <SupervisionStudentViewLoading /> : <SupervisionStudentView data={data} />}
        </SupervisionPageShell>
    )
}
