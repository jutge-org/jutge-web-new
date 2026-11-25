'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import DashboardView from '@/components/administrator/dashboard'
import { FullWidthBreakout } from '@/components/layout/FullWidthBreakout'

export default function AdministratorDashboardPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Dashboard', url: '/administrator/dashboard' },
                ]}
            >
                <FullWidthBreakout className="px-2">
                    <DashboardView />
                </FullWidthBreakout>
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
