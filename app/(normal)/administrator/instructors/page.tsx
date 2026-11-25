'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import InstructorsView from '@/components/administrator/instructors/InstructorsView'

export default function AdministratorInstructorsPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Instructors', url: '/administrator/instructors' },
                ]}
            >
                <InstructorsView />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
