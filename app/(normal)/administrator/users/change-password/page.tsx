'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import ChangePasswordView from '@/components/administrator/users/ChangePasswordView'

export default function AdministratorUsersChangePasswordPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Users', url: '/administrator/users' },
                    { title: 'Change password', url: '/administrator/users/change-password' },
                ]}
            >
                <ChangePasswordView />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
