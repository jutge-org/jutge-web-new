'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { AuthedGate } from '@/components/ClientGates'
import { useSiteMode } from '@/components/SiteModeProvider'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { SubmissionsList } from '@/components/submissions/SubmissionsList'
import jutge from '@/lib/jutge'
import { fetchSubmissionsData } from '@/lib/data/submissions'
import type { SubmissionRow } from '@/lib/submissions'

const LiveSubmissionsPage = dynamic(() =>
    import('@/components/live/LiveSubmissionsPage').then((mod) => mod.LiveSubmissionsPage),
)

export default function SubmissionsPage() {
    const site = useSiteMode()
    if (site.kind !== 'normal') return <LiveSubmissionsPage />
    return <NormalSubmissionsPage />
}

function NormalSubmissionsPage() {
    return (
        <AuthedGate>
            <SubmissionsPageContent />
        </AuthedGate>
    )
}

function SubmissionsPageContent() {
    const [rows, setRows] = useState<SubmissionRow[] | null>(null)

    useEffect(() => {
        void fetchSubmissionsData(jutge).then(setRows)
    }, [])

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Submissions', url: '/submissions' }]} />
            <PageTitle section="/submissions" authenticated />
            <SubmissionsList rows={rows ?? []} showHelp loading={rows === null} />
        </div>
    )
}
