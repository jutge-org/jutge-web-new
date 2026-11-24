'use client'

import Link from 'next/link'
import { Suspense } from 'react'

import { LiveNotice, LiveSpinner } from '@/components/live/LiveChrome'
import { LiveExamProblemsPageContent } from '@/components/live/LiveExamProblemsPageContent'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { useLiveSession } from '@/components/live/LiveSessionProvider'

function LiveProblemsPageAuthenticated() {
    const session = useLiveSession()
    const exam = session.exam

    if (!exam) {
        return <LiveSpinner label="Loading exam…" />
    }

    return <LiveExamProblemsPageContent exam={exam} />
}

function LiveProblemsPageAuthenticatedWithSearchParams() {
    return (
        <Suspense fallback={<LiveSpinner label="Loading problems…" />}>
            <LiveProblemsPageAuthenticated />
        </Suspense>
    )
}

export function LiveProblemsPage() {
    return (
        <LiveSessionGate
            loadingFallback={<LiveSpinner label="Loading problems…" />}
            signedOut={
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see the problems.
                </LiveNotice>
            }
        >
            <LiveProblemsPageAuthenticatedWithSearchParams />
        </LiveSessionGate>
    )
}