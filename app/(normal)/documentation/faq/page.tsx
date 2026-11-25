import { DocumentationPageShell } from '@/components/documentation/DocumentationPageShell'
import { FaqView } from '@/components/documentation/FaqView'
import faqDocument from '@/content/documentation/faq.json'

export default function DocumentationFaqPage() {
    return (
        <DocumentationPageShell
            activeTab="faq"
            breadcrumbs={[
                { title: 'Documentation', url: '/documentation' },
                { title: 'FAQ', url: '/documentation/faq' },
            ]}
            titleHidden={false}
            title={faqDocument.title}
            titleDescription={faqDocument.description}
        >
            <FaqView />
        </DocumentationPageShell>
    )
}
