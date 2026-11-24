'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { ExamSubmissionsTable } from '@/components/exams/ExamSubmissionsTable'
import { ExamTimerCard } from '@/components/live/ExamTimerCard'
import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { LiveExamDocumentsGrid } from '@/components/live/LiveExamDocumentsGrid'
import { LiveExamProblemsCards } from '@/components/live/LiveExamProblemsGrid'
import { LiveExamInfoCard, useLiveExamCourseTitle } from '@/components/live/LivePreStartCard'
import { LiveStudentExamYamlCard } from '@/components/live/LiveStudentExamYamlCard'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { examStatus, fetchLiveExamSubmissions, finishTimeMs, formatInstant, liveErrorMessage } from '@/lib/data/liveExam'
import jutge from '@/lib/jutge'
import type { SubmissionRow } from '@/lib/submissions'
import type { RunningExam } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

function useNow(enabled: boolean): number {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!enabled) return
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [enabled])
    return now
}

export function LiveDashboard() {
    const session = useLiveSession()
    const now = useNow(!session.loading && session.authenticated)
    const [docError, setDocError] = useState<string | null>(null)
    const [starting, setStarting] = useState(false)
    const [submissions, setSubmissions] = useState<SubmissionRow[] | undefined>(undefined)
    const studentExam = session.role === 'student' ? session.exam : null
    const status = studentExam ? examStatus(studentExam, now) : 'waiting'
    const isRunning = status === 'running'

    useEffect(() => {
        if (!session.authenticated || session.role !== 'student' || examStatus(session.exam) !== 'waiting') return
        const timer = window.setInterval(() => {
            void session.refresh()
        }, 10_000)
        return () => window.clearInterval(timer)
    }, [session])

    useEffect(() => {
        if (!studentExam || !isRunning) return
        const exam = studentExam
        let cancelled = false

        async function loadSubmissions() {
            const rows = await fetchLiveExamSubmissions(jutge, exam)
            if (!cancelled) setSubmissions(rows)
        }

        void loadSubmissions()
        const timer = window.setInterval(() => {
            void loadSubmissions()
        }, 10_000)

        return () => {
            cancelled = true
            window.clearInterval(timer)
        }
    }, [studentExam, isRunning])

    if (session.loading) return <LiveSpinner />
    if (!session.authenticated) {
        return (
            <LivePage title="Dashboard">
                <LiveNotice>
                    <Link href="/" className="underline">
                        Sign in
                    </Link>{' '}
                    to enter.
                </LiveNotice>
            </LivePage>
        )
    }

    if (session.role === 'tutor') {
        const tutorStatus = session.tutorStatus
        return (
            <LivePage title="Dashboard">
                {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
                <p>
                    Status: <strong>{tutorStatus?.status ?? 'unknown'}</strong>
                </p>
                <p>Start: {formatInstant(tutorStatus?.time_start ?? null)}</p>
                <p>Latest end: {formatInstant(tutorStatus?.time_end ?? null)}</p>
                {tutorStatus?.status === 'waiting' ? (
                    <Button
                        type="button"
                        disabled={starting}
                        onClick={() => {
                            setStarting(true)
                            void jutge.tutor.examctl
                                .start()
                                .then(() => session.refresh())
                                .catch((error: unknown) => setDocError(liveErrorMessage(error, 'Could not start.')))
                                .finally(() => setStarting(false))
                        }}
                    >
                        {starting ? 'Starting…' : 'Start'}
                    </Button>
                ) : null}
                {docError ? <LiveNotice>{docError}</LiveNotice> : null}
            </LivePage>
        )
    }

    const exam = session.exam
    if (!exam) return <LiveSpinner label="Loading exam…" />

    const finishMs = finishTimeMs(exam, null)
    const finished = status === 'finished'
    const submittedAtMs = submissions?.[0]?.time_inMs ?? null

    return (
        <LivePage className={status === 'waiting' ? 'min-h-0 flex-1' : undefined}>
            {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
            <LiveExamInformationSection
                exam={exam}
                examKey={session.examKey}
                status={status}
                now={now}
                finished={finished}
                finishMs={finishMs}
                submittedAtMs={submittedAtMs}
            />
            {isRunning ? (
                <StudentExamSections
                    exam={exam}
                    submissions={submissions}
                    docError={docError}
                    setDocError={setDocError}
                />
            ) : null}
            <section
                aria-labelledby="live-dev-heading"
                className={cn('flex flex-col gap-4', status !== 'running' && 'mt-auto shrink-0')}
            >
                <h2 id="live-dev-heading" className="text-lg font-medium">
                    Dev
                </h2>
                <LiveStudentExamYamlCard exam={exam} />
            </section>
        </LivePage>
    )
}

function LiveExamInformationSection({
    exam,
    examKey,
    status,
    now,
    finished,
    finishMs,
    submittedAtMs,
}: {
    exam: RunningExam
    examKey?: string | null
    status: ReturnType<typeof examStatus>
    now: number
    finished: boolean
    finishMs: number
    submittedAtMs: number | null
}) {
    const courseTitle = useLiveExamCourseTitle(exam, examKey)
    const started = status !== 'waiting'

    return (
        <section aria-labelledby="live-exam-info-heading" className="flex flex-col gap-4">
            <div>
                <h1 id="live-exam-info-heading" className="text-2xl font-semibold tracking-tight">
                    {exam.title}
                </h1>
                {courseTitle ? <p className="mt-0.5 text-sm font-medium text-muted-foreground">{courseTitle}</p> : null}
            </div>
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-stretch lg:justify-between">
                <LiveExamInfoCard className="min-w-0 flex-1 self-stretch" exam={exam} status={status} now={now} />
                <div className="flex h-[280px] w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <ExamTimerCard
                        exam={exam}
                        now={now}
                        started={started}
                        finished={finished}
                        finishMs={finishMs}
                        submittedAtMs={submittedAtMs}
                        continueExam={{ href: '/problems' }}
                        viewConfirmation={{ href: '/submissions' }}
                    />
                </div>
            </div>
        </section>
    )
}

function StudentExamSections({
    exam,
    submissions,
    docError,
    setDocError,
}: {
    exam: RunningExam
    submissions: SubmissionRow[] | undefined
    docError: string | null
    setDocError: (value: string | null) => void
}) {
    const documents = useMemo(
        () => [...exam.documents].sort((a, b) => a.title.localeCompare(b.title)),
        [exam.documents],
    )

    return (
        <>
            <section className="flex flex-col gap-4" aria-labelledby="live-problems-heading">
                <h2 id="live-problems-heading" className="text-lg font-medium">
                    Problems
                </h2>
                <LiveExamProblemsCards exam={exam} />
            </section>
            <section className="flex flex-col gap-4" aria-labelledby="live-submissions-heading">
                <h2 id="live-submissions-heading" className="text-lg font-medium">
                    Submissions
                </h2>
                {submissions === undefined ? (
                    <LiveSpinner label="Loading submissions…" />
                ) : submissions.length > 0 ? (
                    <Card className="gap-0 overflow-hidden border border-border pt-0 pb-0 shadow-sm ring-0">
                        <CardContent className="p-0">
                            <ExamSubmissionsTable submissions={submissions} />
                        </CardContent>
                    </Card>
                ) : (
                    <p className="text-sm text-muted-foreground">No submissions yet.</p>
                )}
            </section>
            {documents.length > 0 ? (
                <section className="flex flex-col gap-4" aria-labelledby="live-documents-heading">
                    <h2 id="live-documents-heading" className="text-lg font-medium">
                        Documents
                    </h2>
                    {docError ? <LiveNotice>{docError}</LiveNotice> : null}
                    <LiveExamDocumentsGrid documents={documents} onError={setDocError} />
                </section>
            ) : null}
        </>
    )
}