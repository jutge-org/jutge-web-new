'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { LiveRankingTable } from '@/components/live/LiveRankingTable'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Button } from '@/components/ui/button'
import { examStatus, fetchStudentRanking, fetchTutorRanking, liveErrorMessage } from '@/lib/data/liveExam'
import type { Ranking } from '@/lib/jutge_api_client'

export function LiveRankingPage() {
    const site = useSiteMode()
    const session = useLiveSession()
    const [ranking, setRanking] = useState<Ranking | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const canLoad =
        session.role === 'tutor' ||
        (site.kind === 'contest' && session.role === 'student' && examStatus(session.exam) !== 'waiting')

    useEffect(() => {
        if (!canLoad) return
        let cancelled = false
        setLoading(true)
        const load = session.role === 'tutor' ? fetchTutorRanking() : fetchStudentRanking()
        void load
            .then((next) => {
                if (!cancelled) setRanking(next)
            })
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load the ranking.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [canLoad, session.role])

    if (session.loading) return <LiveSpinner />
    if (!session.authenticated) {
        return (
            <LivePage title="Ranking">
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see the ranking.
                </LiveNotice>
            </LivePage>
        )
    }
    if (session.role === 'student' && site.kind !== 'contest') {
        return (
            <LivePage title="Ranking">
                <LiveNotice>The ranking is not available in an exam.</LiveNotice>
            </LivePage>
        )
    }
    if (session.role === 'student' && examStatus(session.exam) === 'waiting') {
        return (
            <LivePage title="Ranking">
                <LiveNotice>The ranking is not available yet.</LiveNotice>
            </LivePage>
        )
    }

    return (
        <LivePage title="Ranking">
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            <Button
                type="button"
                variant="outline"
                onClick={() => {
                    setError(null)
                    setLoading(true)
                    const load = session.role === 'tutor' ? fetchTutorRanking() : fetchStudentRanking()
                    void load
                        .then(setRanking)
                        .catch((loadError: unknown) => setError(liveErrorMessage(loadError, 'Could not load the ranking.')))
                        .finally(() => setLoading(false))
                }}
            >
                Refresh
            </Button>
            {loading && ranking === null ? <LiveSpinner /> : null}
            {ranking ? <LiveRankingTable ranking={ranking} /> : null}
        </LivePage>
    )
}
