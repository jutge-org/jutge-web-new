'use client'

import { AuthedGate } from '@/components/ClientGates'
import { useSiteMode } from '@/components/SiteModeProvider'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { ProblemsSearchView } from '@/components/problems/ProblemsSearchView'

export default function ProblemsSearchPage() {
    const site = useSiteMode()
    const content = (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs
                breadcrumbs={[
                    { title: 'Problems', url: '/problems' },
                    { title: 'Search', url: '/problems/search' },
                ]}
            />
            <ProblemsSearchView />
        </div>
    )

    if (site.kind !== 'normal') return <LiveSessionGate>{content}</LiveSessionGate>
    return <AuthedGate>{content}</AuthedGate>
}
