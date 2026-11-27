'use client'

import { useCallback, useEffect, useState } from 'react'

import { AuthedGate, PageSpinner } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { SubmissionsList } from '@/components/submissions/SubmissionsList'
import {
    fetchTutorExamLatestSubmissions,
    TUTOR_EXAM_LATEST_SUBMISSIONS_DEFAULT_LIMIT,
} from '@/lib/data/liveExam'
import { fetchSubmissionsData } from '@/lib/data/submissions'
import jutge from '@/lib/jutge'
import type { SubmissionRow } from '@/lib/submissions'

export default function SubmissionsPage() {
    return (
        <AuthedGate>
            <SubmissionsPageContent />
        </AuthedGate>
    )
}

function SubmissionsPageContent() {
    const site = useSiteMode()
    if (site.kind !== 'normal') {
        return <LiveSubmissionsPageContent />
    }
    return <NormalSubmissionsPageContent />
}

function NormalSubmissionsPageContent() {
    const [rows, setRows] = useState<SubmissionRow[] | null>(null)

    useEffect(() => {
        void fetchSubmissionsData(jutge).then(setRows)
    }, [])

    return (
        <SubmissionsPageLayout
            rows={rows}
            loading={rows === null}
            onRefreshPending={async () => fetchSubmissionsData(jutge)}
        />
    )
}

function LiveSubmissionsPageContent() {
    const session = useLiveSession()
    const [rows, setRows] = useState<SubmissionRow[] | null>(null)
    const [latestLimit, setLatestLimit] = useState(TUTOR_EXAM_LATEST_SUBMISSIONS_DEFAULT_LIMIT)
    const isTutor = session.role === 'tutor'

    const loadRows = useCallback(async () => {
        if (session.role === 'tutor') {
            return fetchTutorExamLatestSubmissions(jutge, latestLimit)
        }
        return fetchSubmissionsData(jutge)
    }, [session.role, latestLimit])

    useEffect(() => {
        if (session.loading || session.role === null) return
        setRows(null)
        let cancelled = false
        void loadRows().then((next) => {
            if (!cancelled) setRows(next)
        })
        return () => {
            cancelled = true
        }
    }, [session.loading, session.role, loadRows])

    if (session.loading || session.role === null) {
        return <PageSpinner />
    }

    return (
        <SubmissionsPageLayout
            rows={rows}
            loading={rows === null}
            onRefreshPending={loadRows}
            emptyMessage={isTutor ? 'No exam submissions yet.' : undefined}
            showHelp={!isTutor}
            tutorLatestLimit={
                isTutor ? { limit: latestLimit, onLimitChange: setLatestLimit } : undefined
            }
        />
    )
}

function SubmissionsPageLayout({
    rows,
    loading,
    onRefreshPending,
    emptyMessage,
    showHelp = true,
    tutorLatestLimit,
}: {
    rows: SubmissionRow[] | null
    loading: boolean
    onRefreshPending: () => Promise<SubmissionRow[]>
    emptyMessage?: string
    showHelp?: boolean
    tutorLatestLimit?: {
        limit: number
        onLimitChange: (limit: number) => void
    }
}) {
    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Submissions', url: '/submissions' }]} />
            <PageTitle section="/submissions" authenticated />
            <SubmissionsList
                rows={rows ?? []}
                showHelp={showHelp}
                loading={loading}
                onRefreshPending={onRefreshPending}
                emptyMessage={emptyMessage}
                tutorLatestLimit={tutorLatestLimit}
            />
        </div>
    )
}