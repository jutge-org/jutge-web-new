'use client'

import { AdministratorIndex } from '@/components/administrator/AdministratorIndex'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import { AdministratorGate } from '@/components/ClientGates'

export default function AdministratorPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell breadcrumbs={[{ title: 'Administrator', url: '/administrator' }]}>
                <AdministratorIndex />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
