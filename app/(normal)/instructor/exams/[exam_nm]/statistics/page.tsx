'use client'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import { ExamStatisticsView } from '@/components/instructor/exams/ExamStatisticsView'
import { InstructorPageShell } from '@/components/instructor/InstructorPageShell'
import { InstructorSubNav } from '@/components/instructor/InstructorSubNav'
import { instructorExamSubNav } from '@/lib/instructor/menus'
import { useParams } from 'next/navigation'

export default function InstructorExamStatisticsPage() {
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
                { title: exam_nm, url: `${baseHref}/statistics` },
            ]}
        >
            <InstructorSubNav items={instructorExamSubNav(exam_nm)} baseHref={baseHref} activeSegment="statistics" />
            <ExamStatisticsView profile={profile} />
        </InstructorPageShell>
    )
}
