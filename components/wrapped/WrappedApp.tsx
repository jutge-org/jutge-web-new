'use client'

import { useState } from 'react'

import { WrappedDateRange } from '@/components/wrapped/WrappedDateRange'
import { WrappedDeck } from '@/components/wrapped/WrappedDeck'
import { WrappedTimeline, WRAPPED_SETTINGS_STEP } from '@/components/wrapped/WrappedTimeline'
import type { WrappedPeriod } from '@/lib/wrapped/period'

export function WrappedApp() {
    const [period, setPeriod] = useState<WrappedPeriod | null>(null)

    if (!period) {
        return (
            <div className="flex flex-col gap-4">
                <WrappedTimeline allowClickNavigation currentStep={WRAPPED_SETTINGS_STEP} />
                <WrappedDateRange onSelect={setPeriod} />
            </div>
        )
    }

    return <WrappedDeck period={period} onChangeDates={() => setPeriod(null)} />
}
