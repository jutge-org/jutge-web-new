'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import GetSpamUsersView from '@/components/administrator/users/GetSpamUsersView'

export default function AdministratorUsersSpamPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Users', url: '/administrator/users' },
                    { title: 'Spam users', url: '/administrator/users/spam' },
                ]}
            >
                <GetSpamUsersView />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
