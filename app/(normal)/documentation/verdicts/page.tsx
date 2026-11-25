import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'
import { VerdictsPageContent } from '@/components/documentation/VerdictsPageContent'

export default function DocumentationVerdictsPage() {
    return (
        <DocumentationPageShell
            activeTab="verdicts"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'Verdicts', url: '/documentation/verdicts' },
            ]}
        >
            <VerdictsPageContent />
        </DocumentationPageShell>
    )
}
