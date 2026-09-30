'use client'

import { TranslatorView } from '@/components/utilities/TranslatorView'
import { UtilitiesPageShell } from '@/components/utilities/UtilitiesPageShell'

export default function UtilitiesTranslatorPage() {
    return (
        <UtilitiesPageShell
            activeTab="translator"
            breadcrumbs={[
                { title: 'Utilities', url: '/utilities' },
                { title: 'Translator', url: '/utilities/translator' },
            ]}
            titleHidden={true}
            title="Translator"
            titleDescription="Translate text between languages"
        >
            <TranslatorView />
        </UtilitiesPageShell>
    )
}
