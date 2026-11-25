'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import StatisticsView from '@/components/administrator/statistics/StatisticsView'
import { FullWidthBreakout } from '@/components/layout/FullWidthBreakout'

export default function AdministratorStatisticsPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Statistics', url: '/administrator/statistics' },
                ]}
            >
                <FullWidthBreakout className="px-2">
                    <StatisticsView />
                </FullWidthBreakout>
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
