import { CompilerDetailPageContent } from '@/components/documentation/CompilerDetailPageContent'
import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'
import { slugToCompilerId } from '@/lib/documentation'

type DocumentationCompilerDetailPageProps = {
    params: Promise<{ id: string }>
}

export default async function DocumentationCompilerDetailPage({ params }: DocumentationCompilerDetailPageProps) {
    const { id } = await params

    return (
        <DocumentationPageShell
            activeTab="compilers"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'Compilers', url: '/documentation/compilers' },
                { title: slugToCompilerId(id), url: `/documentation/compilers/${id}` },
            ]}
        >
            <CompilerDetailPageContent id={id} />
        </DocumentationPageShell>
    )
}
