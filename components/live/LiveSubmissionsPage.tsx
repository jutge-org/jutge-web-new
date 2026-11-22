'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import {
    compilerLabel,
    fetchLatestSubmissions,
    fetchStudentSubmissions,
    fetchVerdictTables,
    formatInstant,
    liveErrorMessage,
    problemNmOfKey,
    submissionProblemNm,
    verdictLabel,
    type LiveLatestSubmission,
} from '@/lib/data/liveExam'
import type { AllTables, Submission } from '@/lib/jutge_api_client'

function StudentSubmissions({ problemNms }: { problemNms: string[] }) {
    const [rows, setRows] = useState<Submission[] | null>(null)
    const [tables, setTables] = useState<AllTables | null>(null)
    const [error, setError] = useState<string | null>(null)

    const problemKey = problemNms.join('\n')

    useEffect(() => {
        let cancelled = false
        const names = problemKey === '' ? [] : problemKey.split('\n')
        void Promise.all([fetchStudentSubmissions(names), fetchVerdictTables()])
            .then(([submissions, nextTables]) => {
                if (cancelled) return
                setRows(submissions)
                setTables(nextTables)
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load submissions.'))
            })
        return () => {
            cancelled = true
        }
    }, [problemKey])

    if (error) return <LiveNotice>{error}</LiveNotice>
    if (!rows || !tables) return <LiveSpinner />
    if (rows.length === 0) return <LiveNotice>No submissions yet.</LiveNotice>
    return (
        <table className="w-full text-sm">
            <caption className="sr-only">Your submissions</caption>
            <thead>
                <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-medium">Time</th>
                    <th className="py-2 pr-3 font-medium">Problem</th>
                    <th className="py-2 pr-3 font-medium">Verdict</th>
                    <th className="py-2 font-medium">Compiler</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => {
                    const problemNm = submissionProblemNm(row.problem_id) ?? row.problem_id
                    return (
                        <tr key={row.submission_id} className="border-b">
                            <td className="py-2 pr-3">
                                <Link
                                    href={`/problems/${problemNm}/submissions/${row.submission_id}`}
                                    className="underline"
                                >
                                    {formatInstant(row.time_in)}
                                </Link>
                            </td>
                            <td className="py-2 pr-3">{problemNm}</td>
                            <td className="py-2 pr-3">{verdictLabel(tables, row.veredict)}</td>
                            <td className="py-2">{compilerLabel(tables, row.compiler_id)}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

function TutorSubmissions() {
    const [rows, setRows] = useState<LiveLatestSubmission[] | null>(null)
    const [tables, setTables] = useState<AllTables | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        void Promise.all([fetchLatestSubmissions(100), fetchVerdictTables()])
            .then(([submissions, nextTables]) => {
                if (cancelled) return
                setRows(submissions)
                setTables(nextTables)
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load submissions.'))
            })
        return () => {
            cancelled = true
        }
    }, [])

    if (error) return <LiveNotice>{error}</LiveNotice>
    if (!rows || !tables) return <LiveSpinner />
    if (rows.length === 0) return <LiveNotice>No submissions yet.</LiveNotice>
    return (
        <table className="w-full text-sm">
            <caption className="sr-only">Latest submissions</caption>
            <thead>
                <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-medium">Time</th>
                    <th className="py-2 pr-3 font-medium">Student</th>
                    <th className="py-2 pr-3 font-medium">Problem</th>
                    <th className="py-2 pr-3 font-medium">Verdict</th>
                    <th className="py-2 font-medium">Compiler</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row, index) => (
                    <tr key={`${row.email}-${row.time_in}-${index}`} className="border-b">
                        <td className="py-2 pr-3">{formatInstant(row.time_in)}</td>
                        <td className="py-2 pr-3">{row.email}</td>
                        <td className="py-2 pr-3">{row.problem}</td>
                        <td className="py-2 pr-3">{verdictLabel(tables, row.verdict)}</td>
                        <td className="py-2">{compilerLabel(tables, row.compiler_id)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export function LiveSubmissionsPage() {
    const session = useLiveSession()
    if (session.loading) return <LiveSpinner />
    if (!session.authenticated) {
        return (
            <LivePage title="Submissions">
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see submissions.
                </LiveNotice>
            </LivePage>
        )
    }
    return (
        <LivePage title="Submissions">
            {session.role === 'tutor' ? (
                <TutorSubmissions />
            ) : (
                <StudentSubmissions problemNms={(session.exam?.problems ?? []).map((problem) => problem.problem_nm)} />
            )}
        </LivePage>
    )
}

export function LiveProblemSubmissionsPage() {
    const session = useLiveSession()
    const params = useParams<{ key: string }>()
    const problemNm = problemNmOfKey(params.key)

    if (session.loading) return <LiveSpinner />
    if (!session.authenticated) {
        return (
            <LivePage title="Submissions">
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see submissions.
                </LiveNotice>
            </LivePage>
        )
    }
    if (!problemNm) {
        return (
            <LivePage title="Submissions">
                <LiveNotice>Unknown problem.</LiveNotice>
            </LivePage>
        )
    }
    if (session.role === 'tutor') {
        return (
            <LivePage title="Submissions">
                <LiveNotice>
                    Tutor submissions for one problem are listed with the latest submissions on the submissions page.
                    Source for another student is not available from the live exam API.
                </LiveNotice>
                <Link href="/submissions" className="underline">
                    All latest submissions
                </Link>
            </LivePage>
        )
    }
    return (
        <LivePage title="Submissions">
            <StudentSubmissions problemNms={[problemNm]} />
        </LivePage>
    )
}
