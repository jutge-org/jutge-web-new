'use client'

import { notFound } from 'next/navigation'

import { LiveWatchPage } from '@/components/live/LiveWatchPage'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function WatchExamPage() {
    const site = useSiteMode()
    if (site.kind !== 'contest') notFound()
    return <LiveWatchPage />
}
