'use client'

import { useEffect, useState } from 'react'

import { AuthedGate } from '@/components/ClientGates'
import { ExamsList } from '@/components/exams/ExamsList'
import { ExamsListSkeleton } from '@/components/exams/ExamsListSkeleton'
import { ExamsReminderAlert } from '@/components/exams/ExamsReminderAlert'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import jutge from '@/lib/jutge'
import { fetchExamsData } from '@/lib/data/exams'
import type { ExamRow } from '@/lib/exams'

export default function ExamsPage() {
    return (
        <AuthedGate>
            <ExamsPageContent />
        </AuthedGate>
    )
}

function ExamsPageContent() {
    const [rows, setRows] = useState<ExamRow[] | null>(null)

    useEffect(() => {
        void fetchExamsData(jutge).then(setRows)
    }, [])

    if (!rows) {
        return (
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs breadcrumbs={[{ title: 'Exams', url: '/exams' }]} />
                <PageTitle section="/exams" authenticated />
                <ExamsListSkeleton />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Exams', url: '/exams' }]} />
            <PageTitle section="/exams" authenticated />
            <ExamsReminderAlert />
            <ExamsList rows={rows} />
        </div>
    )
}
