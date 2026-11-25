import { DocumentationIndex } from '@/components/documentation/DocumentationIndex'
import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'

export default function DocumentationPage() {
    return (
        <DocumentationPageShell activeTab="index" breadcrumbs={[{ title: 'Documentation', url: '/documentation' }]}>
            <DocumentationIndex />
        </DocumentationPageShell>
    )
}
