'use client'

import { ExamFloatingWidget } from '@/components/live/ExamFloatingWidget'
import { LivePage } from '@/components/live/LiveChrome'

export default function WidgetPage() {
    return (
        <LivePage className="items-center">
            <div className="w-96 w-96 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                <ExamFloatingWidget className="min-h-0 flex-1" />
            </div>
        </LivePage>
    )
}
