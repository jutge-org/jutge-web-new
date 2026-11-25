'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import { AdministratorUsersIndex } from '@/components/administrator/AdministratorUsersIndex'

export default function AdministratorUsersPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Users', url: '/administrator/users' },
                ]}
            >
                <AdministratorUsersIndex />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
