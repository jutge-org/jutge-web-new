'use client'

import { notFound } from 'next/navigation'

import { LiveStatisticsPage } from '@/components/live/LiveStatisticsPage'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function StatisticsPage() {
    const site = useSiteMode()
    if (site.kind === 'normal') notFound()
    return <LiveStatisticsPage />
}
