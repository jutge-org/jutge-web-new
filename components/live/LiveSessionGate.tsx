'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { LiveNotice, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'

export function LiveSessionGate({
    children,
    loadingFallback,
    signedOut,
}: {
    children: ReactNode
    loadingFallback?: ReactNode
    signedOut?: ReactNode
}) {
    const session = useLiveSession()
    if (session.loading) return loadingFallback ?? <LiveSpinner />
    if (!session.authenticated) {
        return (
            signedOut ?? (
                <LiveNotice>
                    <Link href="/">Sign in</Link> to view this page.
                </LiveNotice>
            )
        )
    }
    return children
}
