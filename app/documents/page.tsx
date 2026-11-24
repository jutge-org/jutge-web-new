'use client'

import { notFound } from 'next/navigation'

import { LiveDocumentsPage } from '@/components/live/LiveDocumentsPage'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function DocumentsPage() {
    const site = useSiteMode()
    if (site.kind === 'normal') notFound()
    return <LiveDocumentsPage />
}