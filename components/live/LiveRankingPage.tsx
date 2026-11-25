'use client'

import Link from 'next/link'
import { PauseIcon, RabbitIcon, RefreshCwIcon, SnailIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ExamRankingTable } from '@/components/exams/ExamRankingTable'
import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
    fetchPublicContestWatchColors,
    liveRankingExamProblems,
} from '@/lib/data/contestWatch'
import { examStatus, fetchStudentRanking, fetchTutorRanking, liveErrorMessage } from '@/lib/data/liveExam'
import {
    parseLiveRankingRefreshSpeed,
    readLiveRankingRefreshSpeed,
    writeLiveRankingRefreshSpeed,
    type LiveRankingRefreshSpeed,
} from '@/lib/data/liveRankingRefresh'
import { useLiveRankingRefreshPoll } from '@/hooks/useLiveRankingRefreshPoll'
import type { ColorMapping, Ranking } from '@/lib/jutge_api_client'

export function LiveRankingPage() {
    const site = useSiteMode()
    const session = useLiveSession()
    const [ranking, setRanking] = useState<Ranking | null>(null)
    const [colors, setColors] = useState<ColorMapping | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [speed, setSpeed] = useState<LiveRankingRefreshSpeed>(() => readLiveRankingRefreshSpeed())

    const examProblems = useMemo(
        () =>
            ranking
                ? liveRankingExamProblems(ranking, session.exam?.problems)
                : [],
        [ranking, session.exam?.problems],
    )

    const canLoad =
        session.role === 'tutor' ||
        (site.kind === 'contest' && session.role === 'student' && examStatus(session.exam) !== 'waiting')

    const loadRanking = useCallback(async () => {
        const load = session.role === 'tutor' ? fetchTutorRanking() : fetchStudentRanking()
        const [nextRanking, nextColors] = await Promise.all([load, fetchPublicContestWatchColors()])
        setRanking(nextRanking)
        setColors(nextColors)
    }, [session.role])

    useEffect(() => {
        if (!canLoad) return
        let cancelled = false
        setLoading(true)
        void loadRanking()
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load the ranking.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [canLoad, loadRanking])

    const pollRanking = useCallback(() => {
        void loadRanking().catch((loadError: unknown) =>
            setError(liveErrorMessage(loadError, 'Could not load the ranking.')),
        )
    }, [loadRanking])

    useLiveRankingRefreshPoll(canLoad, speed, pollRanking)

    function refreshNow() {
        setError(null)
        setRefreshing(true)
        void loadRanking()
            .catch((loadError: unknown) => setError(liveErrorMessage(loadError, 'Could not load the ranking.')))
            .finally(() => setRefreshing(false))
    }

    if (session.loading) return <LiveSpinner />
    if (!session.authenticated) {
        return (
            <LivePage>
                <LiveNotice>
                    <Link href="/">Sign in</Link> to see the ranking.
                </LiveNotice>
            </LivePage>
        )
    }
    if (session.role === 'student' && site.kind !== 'contest') {
        return (
            <LivePage>
                <LiveNotice>The ranking is not available in an exam.</LiveNotice>
            </LivePage>
        )
    }
    if (session.role === 'student' && examStatus(session.exam) === 'waiting') {
        return (
            <LivePage>
                <LiveNotice>The ranking is not available yet.</LiveNotice>
            </LivePage>
        )
    }

    return (
        <LivePage>
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            <div className="text-sm flex flex-row items-center gap-2">
                <div className="flex-grow" />
                <Select
                    value={speed}
                    onValueChange={(value) => {
                        const next = parseLiveRankingRefreshSpeed(value)
                        setSpeed(next)
                        writeLiveRankingRefreshSpeed(next)
                    }}
                >
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Speed" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="30">
                            <div className="flex flex-row gap-2 items-center">
                                <SnailIcon className="h-4 w-4" /> Slow (30s)
                            </div>
                        </SelectItem>
                        <SelectItem value="10">
                            <div className="flex flex-row gap-2 items-center">
                                <RabbitIcon className="h-4 w-4" /> Fast (10s)
                            </div>
                        </SelectItem>
                        <SelectItem value="0">
                            <div className="flex flex-row gap-2 items-center">
                                <PauseIcon className="h-4 w-4" /> Pause
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={refreshNow}
                                disabled={refreshing}
                                aria-label="Refresh ranking"
                            >
                                <RefreshCwIcon
                                    className={cn('size-4', refreshing && 'animate-spin')}
                                    aria-hidden
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Refresh ranking</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {loading && (ranking === null || colors === null) ? <LiveSpinner /> : null}
            {ranking && colors ? (
                <ExamRankingTable ranking={ranking} examProblems={examProblems} colors={colors} />
            ) : null}
        </LivePage>
    )
}