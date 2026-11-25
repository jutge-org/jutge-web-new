'use client'

import { useParams } from 'next/navigation'
import { ExamRankingView } from '@/components/instructor/exams/ExamRankingView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorExamSubNav } from '@/lib/instructor/menus'

export default function InstructorExamRankingPage() {
    const { exam_nm } = useParams<{ exam_nm: string }>()
    const baseHref = `/instructor/exams/${exam_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Exams', url: '/instructor/exams' },
                { title: exam_nm, url: `${baseHref}/ranking` },
            ]}
        >
            <InstructorSubNav items={instructorExamSubNav(exam_nm)} baseHref={baseHref} activeSegment="ranking" />
            <ExamRankingView />
        </InstructorPageShell>
    )
}
