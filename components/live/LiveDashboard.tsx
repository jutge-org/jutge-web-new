'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { LiveExamProblemsCards } from '@/components/live/LiveExamProblemsGrid'
import { LivePreStartCard } from '@/components/live/LivePreStartCard'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { Button } from '@/components/ui/button'
import {
    downloadExamDocument,
    examHasStarted,
    formatClock,
    formatInstant,
    liveErrorMessage,
} from '@/lib/data/liveExam'
import jutge from '@/lib/jutge'
import type { RunningExam } from '@/lib/jutge_api_client'

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

    useEffect(() => {
        if (!session.authenticated || session.role !== 'student' || examHasStarted(session.exam)) return
        const timer = window.setInterval(() => {
            void session.refresh()
        }, 10_000)
        return () => window.clearInterval(timer)
    }, [session])

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
        const status = session.tutorStatus
        return (
            <LivePage title="Dashboard">
                {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
                <p>
                    Status: <strong>{status?.status ?? 'unknown'}</strong>
                </p>
                <p>Start: {formatInstant(status?.time_start ?? null)}</p>
                <p>Latest end: {formatInstant(status?.time_end ?? null)}</p>
                {status?.status === 'waiting' ? (
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

    const started = examHasStarted(exam)
    const startMs = exam.time_start ? new Date(exam.time_start).getTime() : null
    const expectedMs = new Date(exam.exp_time_start).getTime()
    const endMs = startMs === null ? null : startMs + exam.running_time * 60_000
    let clockLabel = 'Waiting to start'
    let clock = '—'
    if (!started) {
        clockLabel = 'Starts in'
        clock = formatClock(expectedMs - now)
    } else if (endMs !== null) {
        clockLabel = 'Time left'
        clock = formatClock(endMs - now)
    }

    if (!started) {
        return (
            <LivePage className="min-h-0 flex-1">
                {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
                <LivePreStartCard exam={exam} examKey={session.examKey} />
            </LivePage>
        )
    }

    return (
        <LivePage title={exam.title}>
            {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
            <p role="timer" aria-live="polite">
                {clockLabel}: <strong>{clock}</strong>
            </p>
            {exam.instructions ? <p className="whitespace-pre-wrap">{exam.instructions}</p> : null}
            <StudentExamSections exam={exam} docError={docError} setDocError={setDocError} />
        </LivePage>
    )
}

function StudentExamSections({
    exam,
    docError,
    setDocError,
}: {
    exam: RunningExam
    docError: string | null
    setDocError: (value: string | null) => void
}) {
    return (
        <>
            <section className="flex flex-col gap-4" aria-labelledby="live-problems-heading">
                <h2 id="live-problems-heading" className="text-lg font-medium">
                    Problems
                </h2>
                <LiveExamProblemsCards exam={exam} />
            </section>
            {exam.documents.length > 0 ? (
                <section className="flex flex-col gap-2" aria-labelledby="live-documents-heading">
                    <h2 id="live-documents-heading" className="text-lg font-medium">
                        Documents
                    </h2>
                    {docError ? <LiveNotice>{docError}</LiveNotice> : null}
                    <ul className="flex flex-col gap-2">
                        {exam.documents.map((document) => (
                            <li key={document.document_nm} className="flex flex-wrap items-center gap-3">
                                <span>{document.title}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setDocError(null)
                                        void downloadExamDocument(document.document_nm).catch((error: unknown) => {
                                            setDocError(liveErrorMessage(error, 'Could not download the document.'))
                                        })
                                    }}
                                >
                                    Download PDF
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </>
    )
}
