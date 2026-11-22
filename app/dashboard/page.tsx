'use client'

import { notFound } from 'next/navigation'

import { LiveDashboard } from '@/components/live/LiveDashboard'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function DashboardPage() {
    const site = useSiteMode()
    if (site.kind === 'normal') notFound()
    return <LiveDashboard />
}
