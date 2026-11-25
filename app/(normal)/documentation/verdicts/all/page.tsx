import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'
import { VerdictsAllPageContent } from '@/components/documentation/VerdictsAllPageContent'

export default function DocumentationVerdictsAllPage() {
    return (
        <DocumentationPageShell
            activeTab="verdicts"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'Verdicts', url: '/documentation/verdicts' },
                { title: 'All', url: '/documentation/verdicts/all' },
            ]}
        >
            <VerdictsAllPageContent />
        </DocumentationPageShell>
    )
}
