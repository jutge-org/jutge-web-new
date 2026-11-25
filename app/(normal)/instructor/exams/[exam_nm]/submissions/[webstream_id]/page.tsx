'use client'

import { useParams } from 'next/navigation'
import { ExamSubmissionsWebStreamView } from '@/components/instructor/exams/ExamSubmissionsWebStreamView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorExamSubNav } from '@/lib/instructor/menus'

export default function InstructorExamSubmissionsWebStreamPage() {
    const { exam_nm } = useParams<{ exam_nm: string }>()
    const { webstream_id } = useParams<{ webstream_id: string }>()
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
            <ExamSubmissionsWebStreamView webstream_id={webstream_id} />
        </InstructorPageShell>
    )
}
