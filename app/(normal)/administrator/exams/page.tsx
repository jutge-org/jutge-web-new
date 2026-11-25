'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import ExamsView from '@/components/administrator/exams/ExamsView'

export default function AdministratorExamsPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Exams', url: '/administrator/exams' },
                ]}
            >
                <ExamsView />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
