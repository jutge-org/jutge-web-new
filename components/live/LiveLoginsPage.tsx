'use client'

import Link from 'next/link'
import { Clock3Icon, PauseIcon, RabbitIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { EmailAddressText } from '@/components/general/EmailAddressText'
import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLiveRankingRefreshPoll } from '@/hooks/useLiveRankingRefreshPoll'
import { fetchMultipleIps, formatLiveDateTimeSeconds, liveErrorMessage } from '@/lib/data/liveExam'
import { cn } from '@/lib/utils'

type LoginRow = Awaited<ReturnType<typeof fetchMultipleIps>>

type LiveLoginsRefreshSpeed = '300' | '60' | '0'

const LIVE_LOGINS_REFRESH_SPEED_STORAGE_KEY = 'jutge:live-logins-refresh-speed'

function parseLiveLoginsRefreshSpeed(value: string | null | undefined): LiveLoginsRefreshSpeed {
    if (value === '300' || value === '60' || value === '0') return value
    return '300'
}

function readLiveLoginsRefreshSpeed(): LiveLoginsRefreshSpeed {
    if (typeof window === 'undefined') return '300'
    return parseLiveLoginsRefreshSpeed(localStorage.getItem(LIVE_LOGINS_REFRESH_SPEED_STORAGE_KEY))
}

function writeLiveLoginsRefreshSpeed(speed: LiveLoginsRefreshSpeed): void {
    try {
        localStorage.setItem(LIVE_LOGINS_REFRESH_SPEED_STORAGE_KEY, speed)
    } catch {
        // ignore quota / private mode
    }
}

function LiveLoginsRefreshToolbar({
    speed,
    onSpeedChange,
    onRefresh,
    refreshing,
    studentCount,
}: {
    speed: LiveLoginsRefreshSpeed
    onSpeedChange: (speed: LiveLoginsRefreshSpeed) => void
    onRefresh: () => void
    refreshing: boolean
    studentCount: number | null
}) {
    return (
        <div className="flex flex-row items-center gap-2">
            {studentCount !== null && studentCount > 0 ? (
                <p className="min-w-0 text-sm text-muted-foreground">
                    {`${studentCount} participant${studentCount === 1 ? '' : 's'} with multiple IPs.`}
                </p>
            ) : null}
            <div className="flex-grow" />
            <div className="flex shrink-0 flex-row items-center gap-2">
                <Select
                    value={speed}
                    onValueChange={(value) => {
                        const next = parseLiveLoginsRefreshSpeed(value)
                        onSpeedChange(next)
                        writeLiveLoginsRefreshSpeed(next)
                    }}
                >
                    <SelectTrigger className="w-40" aria-label="Auto-refresh interval">
                        <SelectValue placeholder="Refresh" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="300">
                            <div className="flex flex-row items-center gap-2">
                                <Clock3Icon className="h-4 w-4" aria-hidden />
                                5 minutes
                            </div>
                        </SelectItem>
                        <SelectItem value="60">
                            <div className="flex flex-row items-center gap-2">
                                <RabbitIcon className="h-4 w-4" aria-hidden />
                                1 minute
                            </div>
                        </SelectItem>
                        <SelectItem value="0">
                            <div className="flex flex-row items-center gap-2">
                                <PauseIcon className="h-4 w-4" aria-hidden />
                                Pause
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
                                onClick={onRefresh}
                                disabled={refreshing}
                                aria-label="Refresh logins"
                            >
                                <RefreshCwIcon
                                    className={cn('size-4', refreshing && 'animate-spin')}
                                    aria-hidden
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Refresh logins</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    )
}

function LiveLoginsEmptyCard() {
    return (
        <Card className="w-full border border-dashed border-border bg-muted/20 py-0 shadow-none">
            <CardContent className="py-12">
                <Empty className="border-0 p-0">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <ShieldCheckIcon aria-hidden />
                        </EmptyMedia>
                        <EmptyTitle>No multi-IP sign-ins</EmptyTitle>
                        <EmptyDescription>
                            Every participant has signed in from a single IP address so far. This list updates when
                            someone uses more than one IP during the exam.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </CardContent>
        </Card>
    )
}

function LiveLoginStudentCard({ row }: { row: LoginRow[number] }) {
    return (
        <Card className="w-full gap-0 border border-border py-0 shadow-sm">
            <CardContent className="grid gap-4 py-4 sm:grid-cols-2 sm:items-start">
                <div className="flex min-w-0 flex-col gap-1 sm:pr-4">
                    <p className="text-base font-medium">{row.name}</p>
                    <p className="text-sm">
                        <EmailAddressText email={row.email} />
                    </p>
                </div>
                <ul className="flex min-w-0 flex-col gap-2 sm:border-l sm:border-border sm:pl-4">
                    {row.ips.map((entry) => (
                        <li
                            key={`${entry.ip}-${entry.at}`}
                            className="flex flex-col gap-0.5 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                            <span className="font-medium text-foreground">{entry.ip}</span>
                            <time className="text-muted-foreground tabular-nums" dateTime={entry.at}>
                                {formatLiveDateTimeSeconds(entry.at)}
                            </time>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

export function LiveLoginsPage() {
    const session = useLiveSession()
    const [rows, setRows] = useState<LoginRow | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [speed, setSpeed] = useState<LiveLoginsRefreshSpeed>(() => readLiveLoginsRefreshSpeed())

    const canLoad = !session.loading && session.role === 'tutor'

    const reload = useCallback(async () => {
        const next = await fetchMultipleIps()
        setRows(next)
    }, [])

    useEffect(() => {
        if (!canLoad) return
        let cancelled = false
        setLoading(true)
        void reload()
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load logins.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [canLoad, reload])

    const pollLogins = useCallback(() => {
        void reload().catch((loadError: unknown) =>
            setError(liveErrorMessage(loadError, 'Could not load logins.')),
        )
    }, [reload])

    useLiveRankingRefreshPoll(canLoad && rows !== null, speed, pollLogins)

    function refreshNow() {
        setError(null)
        setRefreshing(true)
        void reload()
            .catch((loadError: unknown) => setError(liveErrorMessage(loadError, 'Could not load logins.')))
            .finally(() => setRefreshing(false))
    }

    if (session.loading) return <LiveSpinner />
    if (session.role !== 'tutor') {
        return (
            <LivePage>
                <LiveNotice>
                    {session.authenticated ? 'Login review is for tutors.' : <Link href="/">Sign in</Link>}
                </LiveNotice>
            </LivePage>
        )
    }

    return (
        <LivePage>
            <LiveLoginsRefreshToolbar
                speed={speed}
                onSpeedChange={setSpeed}
                onRefresh={refreshNow}
                refreshing={refreshing}
                studentCount={rows?.length ?? null}
            />
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {loading && rows === null ? <LiveSpinner /> : null}
            {rows && rows.length > 0 ? (
                <ul className="flex list-none flex-col gap-4">
                    {rows.map((row) => (
                        <li key={row.email}>
                            <LiveLoginStudentCard row={row} />
                        </li>
                    ))}
                </ul>
            ) : null}
            {rows !== null && rows.length === 0 ? <LiveLoginsEmptyCard /> : null}
        </LivePage>
    )
}