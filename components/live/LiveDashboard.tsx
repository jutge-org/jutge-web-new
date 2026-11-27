'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { ExamSubmissionsTable } from '@/components/exams/ExamSubmissionsTable'
import { ExamTimerCard } from '@/components/live/ExamTimerCard'
import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { LiveExamDocumentsSection } from '@/components/live/LiveExamDocumentsSection'
import { LiveExamProblemsCards } from '@/components/live/LiveExamProblemsSection'
import { LiveExamInfoCard } from '@/components/live/LiveExamInfoCard'
import { LiveSectionHeading } from '@/components/live/LiveSectionHeading'
import {
    SmoothCollapsible,
    SmoothCollapsibleContent,
    SmoothCollapsibleTrigger,
} from '@/components/smoothui/collapsible'
import { LiveStudentExamYamlCard } from '@/components/live/LiveStudentExamYamlCard'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    examStartedAtMs,
    examStatus,
    fetchLiveExamSubmissions,
    finishTimeMs,
    formatInstant,
    liveErrorMessage,
} from '@/lib/data/liveExam'
import jutge from '@/lib/jutge'
import type { SubmissionRow } from '@/lib/submissions'
import type { RunningExam } from '@/lib/jutge_api_client'
import { useLiveWallClockMs } from '@/hooks/use-live-wall-clock'
import { cn } from '@/lib/utils'

export function LiveDashboard() {
    const session = useLiveSession()
    const now = useLiveWallClockMs()
    const [docError, setDocError] = useState<string | null>(null)
    const [starting, setStarting] = useState(false)
    const [submissions, setSubmissions] = useState<SubmissionRow[] | undefined>(undefined)
    const studentExam = session.role === 'student' ? session.exam : null
    const clockReady = now > 0
    const status =
        studentExam && clockReady
            ? examStatus(studentExam, now)
            : studentExam?.time_start == null
              ? 'waiting'
              : 'running'
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
            <LivePage>
                {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
                <p>
                    Status: <strong>{tutorStatus?.status ?? 'unknown'}</strong>
                </p>
                <p>Start: {formatInstant(tutorStatus?.time_start ?? null)}</p>
                <p>Latest end: {formatInstant(tutorStatus?.time_end_max ?? null)}</p>
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
    const finished = clockReady && status === 'finished'
    const submittedAtMs = submissions?.[0]?.time_inMs ?? null
    const timerNow = clockReady ? now : examStartedAtMs(exam)

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
                timerNow={timerNow}
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
                className={cn(status !== 'running' && 'mt-auto shrink-0')}
            >
                <SmoothCollapsible defaultOpen={false} className="flex flex-col gap-4">
                    <SmoothCollapsibleTrigger id="live-dev-heading">
                        <span className="text-lg font-medium">Dev</span>
                    </SmoothCollapsibleTrigger>
                    <SmoothCollapsibleContent>
                        <LiveStudentExamYamlCard exam={exam} />
                    </SmoothCollapsibleContent>
                </SmoothCollapsible>
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
    timerNow,
}: {
    exam: RunningExam
    examKey?: string | null
    status: ReturnType<typeof examStatus>
    now: number
    finished: boolean
    finishMs: number
    submittedAtMs: number | null
    timerNow: number
}) {
    const started = status !== 'waiting'

    return (
        <section aria-labelledby="live-exam-info-heading" className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-stretch lg:justify-between">
                <LiveExamInfoCard
                    className="min-w-0 flex-1 self-stretch"
                    exam={exam}
                    examKey={examKey}
                    finishMs={finishMs}
                    headingId="live-exam-info-heading"
                    status={status}
                    now={now}
                />
                <div className="flex h-[280px] w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <ExamTimerCard
                        exam={exam}
                        now={timerNow}
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
                <LiveExamProblemsCards exam={exam} />
            </section>
            {documents.length > 0 ? (
                <section className="flex flex-col gap-4" aria-labelledby="live-documents-heading">
                    <LiveExamDocumentsSection
                        documents={documents}
                        docError={docError}
                        onError={setDocError}
                    />
                </section>
            ) : null}
            {submissions && submissions.length > 0 ? (
                <section className="flex flex-col gap-4" aria-labelledby="live-submissions-heading">
                    <LiveSectionHeading id="live-submissions-heading" href="/submissions">
                        Submissions
                    </LiveSectionHeading>
                    <Card className="gap-0 overflow-x-auto border border-border pt-0 pb-0 shadow-sm ring-0">
                        <CardContent className="p-0">
                            <ExamSubmissionsTable submissions={submissions} />
                        </CardContent>
                    </Card>
                </section>
            ) : null}
        </>
    )
}