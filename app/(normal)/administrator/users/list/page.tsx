'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import UsersListView from '@/components/administrator/users/UsersListView'

export default function AdministratorUsersListPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Users', url: '/administrator/users' },
                    { title: 'List users', url: '/administrator/users/list' },
                ]}
            >
                <UsersListView />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
