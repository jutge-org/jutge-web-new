'use client'

import { ProblemsNewView } from '@/components/instructor/problems/ProblemsNewView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorProblemsNewPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Problems', url: '/instructor/problems' },
                { title: 'New problem', url: '/instructor/problems/new' },
            ]}
        >
            <ProblemsNewView />
        </InstructorPageShell>
    )
}
