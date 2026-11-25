'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import RankingView from '@/components/administrator/ranking/RankingView'

export default function AdministratorRankingPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Ranking', url: '/administrator/ranking' },
                ]}
            >
                <RankingView />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
