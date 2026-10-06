'use client'

import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'
import { UtilityCodeEditor } from '@/components/utilities/UtilityCodeEditor'

export default function UtilitiesEditorPage() {
    return (
        <UtilitiesPageShell
            activeTab="editor"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'Editor', url: '/utilities/editor' },
            ]}
            titleHidden={true}
            title="Editor"
            titleDescription="Edit source code with syntax highlighting"
        >
            <div className="h-[calc(100dvh-13rem)] min-h-96 w-full overflow-hidden">
                <UtilityCodeEditor variant="embedded" />
            </div>
        </UtilitiesPageShell>
    )
}
