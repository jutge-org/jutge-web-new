'use client'

import { ProblemsListView } from '@/components/instructor/problems/ProblemsListView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorProblemsPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Problems', url: '/instructor/problems' },
            ]}
        >
            <ProblemsListView />
        </InstructorPageShell>
    )
}
