'use client'

import { useParams } from 'next/navigation'
import { ProblemUpdateTerminalView } from '@/components/instructor/problems/ProblemUpdateTerminalView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorProblemSubNav } from '@/lib/instructor/menus'

export default function InstructorProblemUpdateTerminalPage() {
    const { problem_nm } = useParams<{ problem_nm: string; webstream_id: string }>()
    const baseHref = `/instructor/problems/${problem_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Problems', url: '/instructor/problems' },
                { title: problem_nm, url: `${baseHref}/properties` },
                { title: 'Update', url: `${baseHref}/update` },
            ]}
        >
            <InstructorSubNav items={instructorProblemSubNav(problem_nm)} baseHref={baseHref} activeSegment="update" />
            <ProblemUpdateTerminalView />
        </InstructorPageShell>
    )
}
