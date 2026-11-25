'use client'

import { useEffect, useState } from 'react'

import { AuthedGate, PageSpinner } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { AwardsList } from '@/components/awards/AwardsList'
import jutge from '@/lib/jutge'
import { fetchAwardsByType } from '@/lib/data/awards'
import type { AwardTypeSummary } from '@/lib/awards'

export default function AwardsPage() {
    return (
        <AuthedGate>
            <AwardsPageContent />
        </AuthedGate>
    )
}

function AwardsPageContent() {
    const [awards, setAwards] = useState<AwardTypeSummary[] | null>(null)

    useEffect(() => {
        void fetchAwardsByType(jutge).then(setAwards)
    }, [])

    if (!awards) {
        return <PageSpinner />
    }

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Awards', url: '/awards' }]} />
            <PageTitle section="/awards" authenticated />
            <AwardsList awards={awards} />
        </div>
    )
}
