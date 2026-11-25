'use client'

import { useParams } from 'next/navigation'
import { ProblemTranslationView } from '@/components/instructor/problems/ProblemTranslationView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorProblemSubNav } from '@/lib/instructor/menus'

export default function InstructorProblemTranslationPage() {
    const { problem_nm } = useParams<{ problem_nm: string }>()
    const { problem_id } = useParams<{ problem_id: string }>()
    const baseHref = `/instructor/problems/${problem_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Problems', url: '/instructor/problems' },
                { title: problem_nm, url: `${baseHref}/properties` },
                { title: problem_id, url: `${baseHref}/${problem_id}` },
            ]}
        >
            <InstructorSubNav
                items={instructorProblemSubNav(problem_nm)}
                baseHref={baseHref}
                activeSegment="properties"
            />
            <ProblemTranslationView />
        </InstructorPageShell>
    )
}
