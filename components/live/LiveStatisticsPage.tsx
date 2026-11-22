'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { fetchExamStatistics, liveErrorMessage } from '@/lib/data/liveExam'
import type { ExamStatistics } from '@/lib/jutge_api_client'

function CountTable({ title, rows }: { title: string; rows: Record<string, Record<string, number>> }) {
    const problems = Object.keys(rows).sort()
    if (problems.length === 0) return null
    return (
        <section className="flex flex-col gap-2" aria-labelledby={`${title}-heading`}>
            <h2 id={`${title}-heading`} className="text-lg font-medium">
                {title}
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
                {problems.map((problem) => (
                    <li key={problem}>
                        <span className="font-medium">{problem}</span>
                        {': '}
                        {Object.entries(rows[problem] ?? {})
                            .map(([key, count]) => `${key} ${count}`)
                            .join(', ') || '—'}
                    </li>
                ))}
            </ul>
        </section>
    )
}

export function LiveStatisticsPage() {
    const session = useLiveSession()
    const [stats, setStats] = useState<ExamStatistics | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (session.loading || session.role !== 'tutor') return
        let cancelled = false
        void fetchExamStatistics()
            .then((next) => {
                if (!cancelled) setStats(next)
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load statistics.'))
            })
        return () => {
            cancelled = true
        }
    }, [session.loading, session.role])

    if (session.loading) return <LiveSpinner />
    if (session.role !== 'tutor') {
        return (
            <LivePage title="Statistics">
                <LiveNotice>
                    {session.authenticated ? 'Statistics are for tutors.' : <Link href="/">Sign in</Link>}
                </LiveNotice>
            </LivePage>
        )
    }
    if (error) {
        return (
            <LivePage title="Statistics">
                <LiveNotice>{error}</LiveNotice>
            </LivePage>
        )
    }
    if (!stats) return <LiveSpinner />

    return (
        <LivePage title="Statistics">
            <CountTable title="Verdicts" rows={stats.submissions} />
            <CountTable title="Statuses" rows={stats.statuses} />
            <CountTable title="Compilers" rows={stats.compilers} />
            <CountTable title="Languages" rows={stats.proglangs} />
            <section aria-labelledby="timeline-heading">
                <h2 id="timeline-heading" className="mb-2 text-lg font-medium">
                    Timeline
                </h2>
                {stats.timeline.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : null}
                {stats.timeline.length > 0 ? (
                    <table className="w-full text-sm">
                        <caption className="sr-only">Submissions over time</caption>
                        <thead>
                            <tr className="border-b text-left">
                                <th className="py-2 pr-3 font-medium">Minute</th>
                                <th className="py-2 pr-3 font-medium">Accepted</th>
                                <th className="py-2 font-medium">Other</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.timeline.map((entry) => (
                                <tr key={entry.minute} className="border-b">
                                    <td className="py-2 pr-3">{entry.minute}</td>
                                    <td className="py-2 pr-3">{entry.ok}</td>
                                    <td className="py-2">{entry.ko}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : null}
            </section>
        </LivePage>
    )
}
