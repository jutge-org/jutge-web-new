'use client'

import { DrawStub } from '@/components/utilities/DrawStub'
import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'

export default function UtilitiesDrawPage() {
    return (
        <UtilitiesPageShell
            activeTab="draw"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'Draw', url: '/utilities/draw' },
            ]}
            titleHidden={true}
            title="Draw"
            titleDescription="Drawing tools"
        >
            <DrawStub />
        </UtilitiesPageShell>
    )
}
