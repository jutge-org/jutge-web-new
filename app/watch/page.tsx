'use client'

import { notFound } from 'next/navigation'

import { LiveWatchIndexPage } from '@/components/live/LiveWatchPage'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function WatchPage() {
    const site = useSiteMode()
    if (site.kind !== 'contest') notFound()
    return <LiveWatchIndexPage />
}
