'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import DashboardView from '@/components/administrator/dashboard'
import { FullWidthBreakout } from '@/components/layout/FullWidthBreakout'

export default function AdministratorPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Dashboard', url: '/administrator' },
                ]}
            >
                <FullWidthBreakout className="px-2">
                    <DashboardView />
                </FullWidthBreakout>
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
