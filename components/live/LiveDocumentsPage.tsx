'use client'

import Link from 'next/link'
import { Suspense, useCallback, useMemo, useState } from 'react'

import { LiveExamDocumentsList } from '@/components/live/LiveExamDocumentsList'
import { LiveNotice, LivePage } from '@/components/live/LiveChrome'
import { LiveListLayoutToggle } from '@/components/live/LiveListLayoutToggle'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useLiveExamListLayout } from '@/hooks/useLiveExamListLayout'

function LiveDocumentsPageAuthenticated() {
    const session = useLiveSession()
    const [error, setError] = useState<string | null>(null)
    const onError = useCallback((message: string | null) => setError(message), [])
    const { layout, toggleLayout } = useLiveExamListLayout('documents')

    const documents = useMemo(() => {
        const list = session.exam?.documents ?? []
        return [...list].sort((a, b) => a.title.localeCompare(b.title))
    }, [session.exam?.documents])

    return (
        <LivePage>
            {documents.length > 0 ? (
                <div className="flex justify-end">
                    <LiveListLayoutToggle layout={layout} onToggle={toggleLayout} />
                </div>
            ) : null}
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">There are no documents for this exam.</p>
            ) : (
                <LiveExamDocumentsList documents={documents} layout={layout} onError={onError} />
            )}
        </LivePage>
    )
}

function LiveDocumentsPageAuthenticatedWithSearchParams() {
    return (
        <Suspense
            fallback={
                <LivePage>
                    <p className="text-muted-foreground" role="status">
                        Loading…
                    </p>
                </LivePage>
            }
        >
            <LiveDocumentsPageAuthenticated />
        </Suspense>
    )
}

export function LiveDocumentsPage() {
    return (
        <LiveSessionGate
            signedOut={
                <LivePage>
                    <LiveNotice>
                        <Link href="/">Sign in</Link> to see exam documents.
                    </LiveNotice>
                </LivePage>
            }
        >
            <LiveDocumentsPageAuthenticatedWithSearchParams />
        </LiveSessionGate>
    )
}