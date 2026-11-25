'use client'

import { DocumentsNewView } from '@/components/instructor/documents/DocumentsNewView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorDocumentsNewPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Documents', url: '/instructor/documents' },
                { title: 'New document', url: '/instructor/documents/new' },
            ]}
        >
            <DocumentsNewView />
        </InstructorPageShell>
    )
}
