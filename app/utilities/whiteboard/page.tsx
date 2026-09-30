'use client'

import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'
import { WhiteboardView } from '@/components/utilities/WhiteboardView'

export default function UtilitiesWhiteboardPage() {
    return (
        <UtilitiesPageShell
            activeTab="whiteboard"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'Whiteboard', url: '/utilities/whiteboard' },
            ]}
            titleHidden={true}
            title="Whiteboard"
            titleDescription="Sketch and annotate"
        >
            <WhiteboardView />
        </UtilitiesPageShell>
    )
}
