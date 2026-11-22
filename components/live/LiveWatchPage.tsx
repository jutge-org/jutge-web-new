'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { ExamRankingTable } from '@/components/exams/ExamRankingTable'
import { ContestWatchForm } from '@/components/live/ContestWatchForm'
import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import {
    examProblemsFromRanking,
    fetchPublicContestRanking,
    fetchPublicContestWatchColors,
} from '@/lib/data/contestWatch'
import { liveErrorMessage } from '@/lib/data/liveExam'
import type { ColorMapping, Ranking } from '@/lib/jutge_api_client'

const POLL_MS = 10_000

export function LiveWatchIndexPage() {
    return (
        <LivePage title="Watch">
            <p className="text-muted-foreground">Choose a contest and follow its public ranking.</p>
            <ContestWatchForm />
        </LivePage>
    )
}

export function LiveWatchPage() {
    const params = useParams<{ examKey: string }>()
    const examKey = params.examKey
    const [ranking, setRanking] = useState<Ranking | null>(null)
    const [colors, setColors] = useState<ColorMapping | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!examKey) return
        let cancelled = false
        let timer = 0
        setRanking(null)
        setColors(null)
        setError(null)

        async function load() {
            try {
                const [nextRanking, nextColors] = await Promise.all([
                    fetchPublicContestRanking(examKey),
                    fetchPublicContestWatchColors(),
                ])
                if (cancelled) return
                setRanking(nextRanking)
                setColors(nextColors)
                setError(null)
                timer = window.setTimeout(() => void load(), POLL_MS)
            } catch (loadError) {
                if (cancelled) return
                setError(liveErrorMessage(loadError, 'Could not load the ranking.'))
            }
        }

        void load()
        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [examKey])

    const examProblems = useMemo(
        () => (ranking ? examProblemsFromRanking(ranking) : []),
        [ranking],
    )

    return (
        <LivePage title="Ranking">
            <p className="text-sm text-muted-foreground">Contest {examKey}</p>
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {!error && (ranking === null || colors === null) ? <LiveSpinner /> : null}
            {ranking && colors ? (
                <ExamRankingTable ranking={ranking} examProblems={examProblems} colors={colors} />
            ) : null}
        </LivePage>
    )
}