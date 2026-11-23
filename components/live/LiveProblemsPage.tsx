'use client'

import Link from 'next/link'

import { LiveNotice } from '@/components/live/LiveChrome'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { ProblemsPageContent, ProblemsPageLoading } from '@/components/problems/ProblemsPageContent'

export function LiveProblemsPage() {
    return (
        <LiveSessionGate
            loadingFallback={<ProblemsPageLoading showPasscodes />}
            signedOut={
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see the problems.
                </LiveNotice>
            }
        >
            <ProblemsPageContent showPasscodes />
        </LiveSessionGate>
    )
}
