'use client'

import { notFound } from 'next/navigation'

import { LiveFinishPage } from '@/components/live/LiveFinishPage'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function FinishPage() {
    const site = useSiteMode()
    if (site.kind === 'normal') notFound()
    return <LiveFinishPage />
}
