'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { fetchExamStatistics, fetchTutorRanking, liveErrorMessage } from '@/lib/data/liveExam'

export function LiveProblemsPage() {
    const session = useLiveSession()
    const [tutorProblems, setTutorProblems] = useState<string[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (session.loading || session.role !== 'tutor') return
        let cancelled = false
        void Promise.all([fetchExamStatistics(), fetchTutorRanking()])
            .then(([statistics, ranking]) => {
                if (cancelled) return
                const names = new Set<string>(Object.keys(statistics.submissions))
                for (const row of ranking) {
                    for (const result of row.rankingResults) names.add(result.problem_nm)
                }
                setTutorProblems([...names].sort())
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load problems.'))
            })
        return () => {
            cancelled = true
        }
    }, [session.loading, session.role])

    if (session.loading) return <LiveSpinner />
    if (!session.authenticated) {
        return (
            <LivePage title="Problems">
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see the problems.
                </LiveNotice>
            </LivePage>
        )
    }

    if (session.role === 'student') {
        const problems = session.exam?.problems ?? []
        return (
            <LivePage title="Problems">
                {problems.length === 0 ? (
                    <LiveNotice>No problems have been published for this exam yet.</LiveNotice>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {problems.map((problem) => (
                            <li key={problem.problem_nm}>
                                <Link href={`/problems/${problem.problem_nm}`} className="underline">
                                    {problem.caption || problem.problem_nm}
                                </Link>
                                {problem.weight != null ? (
                                    <span className="text-muted-foreground"> · weight {problem.weight}</span>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </LivePage>
        )
    }

    return (
        <LivePage title="Problems">
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {tutorProblems === null && !error ? <LiveSpinner /> : null}
            {tutorProblems && tutorProblems.length === 0 ? (
                <LiveNotice>Problems show up here once the ranking or statistics include them.</LiveNotice>
            ) : null}
            {tutorProblems && tutorProblems.length > 0 ? (
                <ul className="flex flex-col gap-2">
                    {tutorProblems.map((problemNm) => (
                        <li key={problemNm}>
                            <Link href={`/problems/${problemNm}`} className="underline">
                                {problemNm}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : null}
        </LivePage>
    )
}
