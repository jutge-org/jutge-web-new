'use client'

import dynamic from 'next/dynamic'

import { AuthedGate } from '@/components/ClientGates'
import { useSiteMode } from '@/components/SiteModeProvider'
import { ProblemsPageContent } from '@/components/problems/ProblemsPageContent'

const LiveProblemsPage = dynamic(() =>
    import('@/components/live/LiveProblemsPage').then((mod) => mod.LiveProblemsPage),
)

export default function ProblemsPage() {
    const site = useSiteMode()
    if (site.kind !== 'normal') return <LiveProblemsPage />
    return (
        <AuthedGate>
            <ProblemsPageContent />
        </AuthedGate>
    )
}
