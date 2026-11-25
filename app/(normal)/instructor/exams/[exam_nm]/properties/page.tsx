'use client'

import { useParams } from 'next/navigation'
import { ExamPropertiesView } from '@/components/instructor/exams/ExamPropertiesView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorExamSubNav } from '@/lib/instructor/menus'

export default function InstructorExamPropertiesPage() {
    const { exam_nm } = useParams<{ exam_nm: string }>()
    const baseHref = `/instructor/exams/${exam_nm}`

    return (
        <InstructorPageShell
            breadcrumbs={[
                { title: 'Instructor', url: '/instructor' },
                { title: 'Exams', url: '/instructor/exams' },
                { title: exam_nm, url: `${baseHref}/properties` },
            ]}
        >
            <InstructorSubNav items={instructorExamSubNav(exam_nm)} baseHref={baseHref} activeSegment="properties" />
            <ExamPropertiesView />
        </InstructorPageShell>
    )
}
