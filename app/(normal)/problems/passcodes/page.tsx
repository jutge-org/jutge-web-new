'use client'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { ProblemPasscodesView } from '@/components/problems/ProblemPasscodesView'

export default function ProblemPasscodesPage() {
    return (
        <AuthedGate>
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs
                    breadcrumbs={[
                        { title: 'Problems', url: '/problems' },
                        { title: 'Passcodes', url: '/problems/passcodes' },
                    ]}
                />
                <ProblemPasscodesView />
            </div>
        </AuthedGate>
    )
}
