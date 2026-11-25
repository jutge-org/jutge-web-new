'use client'

import { ClockView } from '@/components/utilities/ClockView'
import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'

export default function UtilitiesClockPage() {
    return (
        <UtilitiesPageShell
            activeTab="clock"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'Clock', url: '/utilities/clock' },
            ]}
            titleHidden={true}
            title="Clock"
            titleDescription="Show the current time"
        >
            <ClockView />
        </UtilitiesPageShell>
    )
}
