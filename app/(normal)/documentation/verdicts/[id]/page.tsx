import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'
import { VerdictDetailPageContent } from '@/components/documentation/VerdictDetailPageContent'

type DocumentationVerdictDetailPageProps = {
    params: Promise<{ id: string }>
}

export default async function DocumentationVerdictDetailPage({ params }: DocumentationVerdictDetailPageProps) {
    const { id } = await params

    return (
        <DocumentationPageShell
            activeTab="verdicts"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'Verdicts', url: '/documentation/verdicts' },
                { title: id, url: `/documentation/verdicts/${id}` },
            ]}
        >
            <VerdictDetailPageContent id={id} />
        </DocumentationPageShell>
    )
}
