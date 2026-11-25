'use client'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { ProblemsSearchView } from '@/components/problems/ProblemsSearchView'

export default function ProblemsSearchPage() {
    return (
        <AuthedGate>
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs
                    breadcrumbs={[
                        { title: 'Problems', url: '/problems' },
                        { title: 'Search', url: '/problems/search' },
                    ]}
                />
                <ProblemsSearchView />
            </div>
        </AuthedGate>
    )
}
