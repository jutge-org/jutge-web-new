'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'

import { AuthedGate, PageSpinner } from '@/components/ClientGates'
import { CourseListItemsTable } from '@/components/courses/CourseListItemsTable'
import { ExamDetailHeaderCard } from '@/components/exams/ExamDetailHeaderCard'
import { ExamSubmissionsTable } from '@/components/exams/ExamSubmissionsTable'
import { ExamsReminderAlert } from '@/components/exams/ExamsReminderAlert'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import jutge from '@/lib/jutge'
import { fetchExamDetail } from '@/lib/data/exams'
import type { ExamDetail } from '@/lib/exams'

export default function ExamDetailPage() {
    return (
        <AuthedGate>
            <ExamDetailPageContent />
        </AuthedGate>
    )
}

function ExamDetailPageContent() {
    const params = useParams<{ key: string }>()
    const [exam, setExam] = useState<ExamDetail | null | undefined>(undefined)

    useEffect(() => {
        void fetchExamDetail(jutge, params.key).then(setExam)
    }, [params.key])

    if (exam === undefined) {
        return <PageSpinner />
    }

    if (!exam) {
        notFound()
    }

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs
                breadcrumbs={[
                    { title: 'Exams', url: '/exams' },
                    { title: exam.title, url: `/exams/${exam.exam_key}` },
                ]}
            />
            <ExamsReminderAlert />
            <TooltipProvider>
                <ExamDetailHeaderCard exam={exam} />
                {exam.problems.length > 0 ? (
                    <Card className="gap-0 pt-2 pb-0 ring-0 border border-border shadow-sm">
                        <CardHeader className="border-b border-border px-4 py-2">
                            <CardTitle className="text-lg font-semibold">Problems</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <CourseListItemsTable
                                items={exam.problems}
                                languages={exam.languages}
                                statuses={exam.problemStatuses}
                                lastSubmissions={exam.problemLastSubmissions}
                            />
                        </CardContent>
                    </Card>
                ) : null}
                {exam.submissions.length > 0 ? (
                    <Card className="gap-0 pt-2 pb-0 ring-0 border border-border shadow-sm">
                        <CardHeader className="border-b border-border px-4 py-2">
                            <CardTitle className="text-lg font-semibold">Submissions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ExamSubmissionsTable submissions={exam.submissions} />
                        </CardContent>
                    </Card>
                ) : null}
            </TooltipProvider>
        </div>
    )
}
