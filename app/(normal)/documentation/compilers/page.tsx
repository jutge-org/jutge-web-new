import { CompilersPageContent } from '@/components/documentation/CompilersPageContent'
import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'

export default function DocumentationCompilersPage() {
    return (
        <DocumentationPageShell
            activeTab="compilers"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'Compilers', url: '/documentation/compilers' },
            ]}
        >
            <CompilersPageContent />
        </DocumentationPageShell>
    )
}
