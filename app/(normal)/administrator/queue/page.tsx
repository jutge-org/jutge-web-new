'use client'

import { AdministratorGate } from '@/components/ClientGates'
import { AdministratorPageShell } from '@/components/administrator/AdministratorPageShell'
import QueueView from '@/components/administrator/queue/QueueView'
import { FullWidthBreakout } from '@/components/layout/FullWidthBreakout'

export default function AdministratorQueuePage() {
    return (
        <AdministratorGate>
            <AdministratorPageShell
                breadcrumbs={[
                    { title: 'Administrator', url: '/administrator' },
                    { title: 'Queue', url: '/administrator/queue' },
                ]}
            >
                <FullWidthBreakout className="px-2">
                    <QueueView />
                </FullWidthBreakout>
            </AdministratorPageShell>
        </AdministratorGate>
    )
}
