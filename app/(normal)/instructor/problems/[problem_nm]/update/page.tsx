'use client'

import { useParams } from 'next/navigation'
import { ProblemUpdateView } from '@/components/instructor/problems/ProblemUpdateView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorProblemSubNav } from '@/lib/instructor/menus'

export default function InstructorProblemUpdatePage() {
    const { problem_nm } = useParams<{ problem_nm: string }>()
    const baseHref = `/instructor/problems/${problem_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Problems', url: '/instructor/problems' },
                { title: problem_nm, url: `${baseHref}/properties` },
            ]}
        >
            <InstructorSubNav items={instructorProblemSubNav(problem_nm)} baseHref={baseHref} activeSegment="update" />
            <ProblemUpdateView />
        </InstructorPageShell>
    )
}
