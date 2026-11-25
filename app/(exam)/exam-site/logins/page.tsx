'use client'

import { notFound } from 'next/navigation'

import { LiveLoginsPage } from '@/components/live/LiveLoginsPage'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function LoginsPage() {
    const site = useSiteMode()
    if (site.kind === 'normal') notFound()
    return <LiveLoginsPage />
}
