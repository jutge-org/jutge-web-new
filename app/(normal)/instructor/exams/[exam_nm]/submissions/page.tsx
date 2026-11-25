'use client'

import { useParams } from 'next/navigation'
import { ExamSubmissionsView } from '@/components/instructor/exams/ExamSubmissionsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorExamSubNav } from '@/lib/instructor/menus'

export default function InstructorExamSubmissionsPage() {
    const { exam_nm } = useParams<{ exam_nm: string }>()
    const baseHref = `/instructor/exams/${exam_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Exams', url: '/instructor/exams' },
                { title: exam_nm, url: `${baseHref}/submissions` },
            ]}
        >
            <InstructorSubNav items={instructorExamSubNav(exam_nm)} baseHref={baseHref} activeSegment="submissions" />
            <ExamSubmissionsView />
        </InstructorPageShell>
    )
}
