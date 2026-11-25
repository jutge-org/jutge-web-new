'use client'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import { ExamProblemsView } from '@/components/instructor/exams/ExamProblemsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorExamSubNav } from '@/lib/instructor/menus'
import { useParams } from 'next/navigation'

export default function InstructorExamProblemsPage() {
    const { exam_nm } = useParams<{ exam_nm: string }>()
    const { profile } = useAuth()
    const baseHref = `/instructor/exams/${exam_nm}`

    if (!profile) {
        return <PageSpinner />
    }

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Exams', url: '/instructor/exams' },
                { title: exam_nm, url: `${baseHref}/problems` },
            ]}
        >
            <InstructorSubNav items={instructorExamSubNav(exam_nm)} baseHref={baseHref} activeSegment="problems" />
            <ExamProblemsView profile={profile} />
        </InstructorPageShell>
    )
}
