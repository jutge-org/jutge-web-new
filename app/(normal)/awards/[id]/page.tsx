'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate, PageSpinner } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { AwardDetailCard } from '@/components/awards/AwardDetailCard'
import jutge from '@/lib/jutge'
import { fetchAwardDetail } from '@/lib/data/awards'
import type { AwardDetail } from '@/lib/awards'

export default function AwardDetailPage() {
    return (
        <AuthedGate>
            <AwardDetailPageContent />
        </AuthedGate>
    )
}

function AwardDetailPageContent() {
    const params = useParams<{ id: string }>()
    const [award, setAward] = useState<AwardDetail | null | undefined>(undefined)

    useEffect(() => {
        void fetchAwardDetail(jutge, decodeURIComponent(params.id)).then(setAward)
    }, [params.id])

    if (award === undefined) {
        return <PageSpinner />
    }

    if (!award) {
        notFound()
    }

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs
                breadcrumbs={[
                    { title: 'Awards', url: '/awards' },
                    { title: award.title, url: `/awards/${encodeURIComponent(award.award_id)}` },
                ]}
            />
            <AwardDetailCard award={award} />
        </div>
    )
}
