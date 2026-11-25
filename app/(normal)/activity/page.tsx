'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import SmoothButton from '@/components/smoothui/smooth-button'
import { StatisticsDashboard } from '@/components/statistics/StatisticsDashboard'
import { fetchStatisticsData, type StatisticsData } from '@/lib/data/statistics'
import jutge from '@/lib/jutge'
import { RssIcon } from 'lucide-react'

export default function ActivityPage() {
    return (
        <AuthedGate>
            <ActivityPageContent />
        </AuthedGate>
    )
}

function ActivityPageContent() {
    const [data, setData] = useState<StatisticsData | null>(null)

    useEffect(() => {
        void fetchStatisticsData(jutge).then(setData)
    }, [])

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Activity', url: '/activity' }]} />
            <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
                <SmoothButton asChild color="blue" size="sm" variant="candy">
                    <Link href="/activity/wrapped"><RssIcon className="h-4 w-4" /> Jutge Wrapped</Link>
                </SmoothButton>
            </div>
            <StatisticsDashboard data={data} />
        </div>
    )
}
