'use client'

import { ExamsListView } from '@/components/instructor/exams/ExamsListView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorExamsPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Exams', url: '/instructor/exams' },
            ]}
        >
            <ExamsListView />
        </InstructorPageShell>
    )
}
