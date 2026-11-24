'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'

import { LiveExamDocumentsGrid } from '@/components/live/LiveExamDocumentsGrid'
import { LiveNotice, LivePage } from '@/components/live/LiveChrome'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { useLiveSession } from '@/components/live/LiveSessionProvider'

function LiveDocumentsPageAuthenticated() {
    const session = useLiveSession()
    const [error, setError] = useState<string | null>(null)
    const onError = useCallback((message: string | null) => setError(message), [])

    const documents = useMemo(() => {
        const list = session.exam?.documents ?? []
        return [...list].sort((a, b) => a.title.localeCompare(b.title))
    }, [session.exam?.documents])

    if (session.role !== 'student') {
        return (
            <LivePage title="Documents">
                <LiveNotice>This page is only available to students taking the exam.</LiveNotice>
            </LivePage>
        )
    }

    return (
        <LivePage title="Documents">
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">There are no documents for this exam.</p>
            ) : (
                <LiveExamDocumentsGrid documents={documents} onError={onError} />
            )}
        </LivePage>
    )
}

export function LiveDocumentsPage() {
    return (
        <LiveSessionGate
            signedOut={
                <LivePage title="Documents">
                    <LiveNotice>
                        <Link href="/">Sign in</Link> to see exam documents.
                    </LiveNotice>
                </LivePage>
            }
        >
            <LiveDocumentsPageAuthenticated />
        </LiveSessionGate>
    )
}