'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import HeatmapsView from '@/components/administrator/heatmaps/HeatmapsView'

export default function AdministratorHeatmapsPage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Heatmaps', url: '/administrator/heatmaps' },
                ]}
            >
                <HeatmapsView />
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
