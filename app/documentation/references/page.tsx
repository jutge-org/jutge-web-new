import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'
import { ReferencesView } from '@/components/documentation/ReferencesView'

export default function DocumentationReferencesPage() {
    return (
        <DocumentationPageShell
            activeTab="references"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'References', url: '/documentation/references' },
            ]}
            titleHidden={false}
            titleDescription="Language references and cheat sheets hosted on Jutge.org."
        >
            <ReferencesView />
        </DocumentationPageShell>
    )
}
