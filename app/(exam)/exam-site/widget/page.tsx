'use client'

import { notFound } from 'next/navigation'

import { ExamFloatingWidget } from '@/components/live/ExamFloatingWidget'
import { LivePage } from '@/components/live/LiveChrome'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function WidgetPage() {
    const site = useSiteMode()
    if (site.kind === 'normal') notFound()

    return (
        <LivePage className="items-center">
            <div className="w-96 w-96 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                <ExamFloatingWidget className="min-h-0 flex-1" />
            </div>
        </LivePage>
    )
}