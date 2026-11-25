'use client'

import { ProblemsNewTerminalView } from '@/components/instructor/problems/ProblemsNewTerminalView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'

export default function InstructorProblemsNewTerminalPage() {
    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Problems', url: '/instructor/problems' },
                { title: 'New problem', url: '/instructor/problems/new' },
            ]}
        >
            <ProblemsNewTerminalView />
        </InstructorPageShell>
    )
}
