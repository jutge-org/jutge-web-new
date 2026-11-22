'use client'

import { notFound } from 'next/navigation'

import { LiveStudentsPage } from '@/components/live/LiveStudentsPage'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function StudentsPage() {
    const site = useSiteMode()
    if (site.kind === 'normal') notFound()
    return <LiveStudentsPage />
}
