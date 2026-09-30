'use client'

import { SandPackView } from '@/components/utilities/SandPackView'
import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'

export default function UtilitiesSandPackPage() {
    return (
        <UtilitiesPageShell
            activeTab="sandpack"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'SandPack', url: '/utilities/sandpack' },
            ]}
            titleHidden={true}
            title="SandPack"
            titleDescription="Edit and run JavaScript in the browser"
        >
            <SandPackView />
        </UtilitiesPageShell>
    )
}
