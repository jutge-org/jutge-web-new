'use client'

import { ExamsNewView } from '@/components/instructor/exams/ExamsNewView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorExamsNewPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Exams', url: '/instructor/exams' },
                { title: 'Add exam', url: '/instructor/exams/new' },
            ]}
        >
            <ExamsNewView />
        </InstructorPageShell>
    )
}
