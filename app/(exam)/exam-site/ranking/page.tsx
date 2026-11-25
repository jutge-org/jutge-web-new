'use client'

import { notFound } from 'next/navigation'

import { LiveRankingPage } from '@/components/live/LiveRankingPage'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function RankingPage() {
    const site = useSiteMode()
    if (site.kind !== 'contest') notFound()
    return <LiveRankingPage />
}
