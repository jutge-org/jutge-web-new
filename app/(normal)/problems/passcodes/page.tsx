'use client'

import { AuthedGate } from '@/components/ClientGates'
import { useSiteMode } from '@/components/SiteModeProvider'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { ProblemPasscodesView } from '@/components/problems/ProblemPasscodesView'

export default function ProblemPasscodesPage() {
    const site = useSiteMode()
    const content = (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs
                breadcrumbs={[
                    { title: 'Problems', url: '/problems' },
                    { title: 'Passcodes', url: '/problems/passcodes' },
                ]}
            />
            <ProblemPasscodesView />
        </div>
    )

    if (site.kind !== 'normal') return <LiveSessionGate>{content}</LiveSessionGate>
    return <AuthedGate>{content}</AuthedGate>
}
