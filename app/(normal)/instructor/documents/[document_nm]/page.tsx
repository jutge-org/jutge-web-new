'use client'

import { useParams } from 'next/navigation'
import { DocumentPropertiesView } from '@/components/instructor/documents/DocumentPropertiesView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorDocumentPage() {
    const { document_nm } = useParams<{ document_nm: string }>()
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Documents', url: '/instructor/documents' },
                { title: document_nm, url: `/instructor/documents/${document_nm}` },
            ]}
        >
            <DocumentPropertiesView document_nm={document_nm} />
        </InstructorPageShell>
    )
}
