'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { LiveNotice } from '@/components/live/LiveChrome'
import { LiveSessionGate } from '@/components/live/LiveSessionGate'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { ProblemsPageContent, ProblemsPageLoading } from '@/components/problems/ProblemsPageContent'
import type { RunningExamProblem } from '@/lib/jutge_api_client'

function LiveProblemsPageAuthenticated() {
    const session = useLiveSession()
    const examProblemsByNm = useMemo(() => {
        const map = new Map<string, RunningExamProblem>()
        for (const problem of session.exam?.problems ?? []) {
            map.set(problem.problem_nm, problem)
        }
        return map
    }, [session.exam?.problems])
    const problemOrder = useMemo(
        () => session.exam?.problems.map((problem) => problem.problem_nm) ?? [],
        [session.exam?.problems],
    )

    return (
        <ProblemsPageContent
            showPasscodes
            layout="cards"
            examProblemsByNm={examProblemsByNm}
            problemOrder={problemOrder}
        />
    )
}

export function LiveProblemsPage() {
    return (
        <LiveSessionGate
            loadingFallback={<ProblemsPageLoading showPasscodes layout="cards" />}
            signedOut={
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see the problems.
                </LiveNotice>
            }
        >
            <LiveProblemsPageAuthenticated />
        </LiveSessionGate>
    )
}