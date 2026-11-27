'use client'

import Link from 'next/link'
import { Clock3Icon, PauseIcon, RabbitIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EmailAddressText } from '@/components/general/EmailAddressText'
import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import AnimatedTabs from '@/components/smoothui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLiveRankingRefreshPoll } from '@/hooks/useLiveRankingRefreshPoll'
import {
    fetchLiveLoginsPageData,
    formatLiveDateTimeSeconds,
    liveErrorMessage,
    type LiveMultipleIpRow,
    type LiveRosterEntry,
} from '@/lib/data/liveExam'
import { cn } from '@/lib/utils'

type LiveLoginsRefreshSpeed = '300' | '60' | '0'
type LiveLoginsView = 'multiple' | 'all'

const LIVE_LOGINS_REFRESH_SPEED_STORAGE_KEY = 'jutge:live-logins-refresh-speed'
const LIVE_LOGINS_VIEW_STORAGE_KEY = 'jutge:live-logins-view'
const LIVE_LOGINS_VIEW_TABS_LAYOUT_ID = 'live-logins-view-tabs'

const LIVE_LOGINS_VIEW_TABS = [
    { id: 'multiple' as const, label: 'Multiple IPs' },
    { id: 'all' as const, label: 'All IPs' },
]

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

function parseLiveLoginsView(value: string | null | undefined): LiveLoginsView {
    if (value === 'multiple' || value === 'all') return value
    return 'multiple'
}

function readLiveLoginsView(): LiveLoginsView {
    if (typeof window === 'undefined') return 'multiple'
    return parseLiveLoginsView(localStorage.getItem(LIVE_LOGINS_VIEW_STORAGE_KEY))
}

function writeLiveLoginsView(view: LiveLoginsView): void {
    try {
        localStorage.setItem(LIVE_LOGINS_VIEW_STORAGE_KEY, view)
    } catch {
        // ignore quota / private mode
    }
}

function LiveLoginsRefreshToolbar({
    view,
    onViewChange,
    speed,
    onSpeedChange,
    onRefresh,
    refreshing,
    summary,
}: {
    view: LiveLoginsView
    onViewChange: (view: LiveLoginsView) => void
    speed: LiveLoginsRefreshSpeed
    onSpeedChange: (speed: LiveLoginsRefreshSpeed) => void
    onRefresh: () => void
    refreshing: boolean
    summary: string | null
}) {
    return (
        <div className="flex flex-row flex-wrap items-center gap-2">
            <AnimatedTabs
                activeTab={view}
                className="inline-flex w-auto shrink-0 [&_button]:w-44 [&_button]:min-w-44 [&_button]:max-w-44 [&_button]:flex-none [&_button]:shrink-0 [&_button]:whitespace-nowrap [&_button]:px-3 [&_button]:py-2"
                layoutId={LIVE_LOGINS_VIEW_TABS_LAYOUT_ID}
                onChange={(tabId) => {
                    const next = parseLiveLoginsView(tabId)
                    onViewChange(next)
                    writeLiveLoginsView(next)
                }}
                tabs={LIVE_LOGINS_VIEW_TABS}
                variant="segment"
            />
            {summary ? <p className="min-w-0 text-sm text-muted-foreground">{summary}</p> : null}
            <div className="grow" />
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
                                aria-label="Refresh IP control"
                            >
                                <RefreshCwIcon
                                    className={cn('size-4', refreshing && 'animate-spin')}
                                    aria-hidden
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Refresh IP control</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    )
}

function LiveMultipleIpsEmptyCard() {
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

function LiveAllIpsEmptyCard() {
    return (
        <Card className="w-full border border-dashed border-border bg-muted/20 py-0 shadow-none">
            <CardContent className="py-12">
                <Empty className="border-0 p-0">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <ShieldCheckIcon aria-hidden />
                        </EmptyMedia>
                        <EmptyTitle>No participants yet</EmptyTitle>
                        <EmptyDescription>
                            The live roster is empty. Participant login and submission IPs will appear here once
                            students join the exam.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </CardContent>
        </Card>
    )
}

function LiveParticipantIpList({ ips }: { ips: string[] }) {
    if (ips.length === 0) {
        return <p className="text-sm text-muted-foreground">—</p>
    }
    return (
        <ul className="flex list-none flex-col gap-1 p-0 text-sm">
            {ips.map((ip) => (
                <li key={ip}>{ip}</li>
            ))}
        </ul>
    )
}

function LiveMultipleIpStudentCard({ row }: { row: LiveMultipleIpRow }) {
    return (
        <Card className="w-full gap-0 border border-border py-0 shadow-sm">
            <CardContent className="grid gap-4 py-4 sm:grid-cols-2 sm:items-start">
                <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-base font-medium">{row.name}</p>
                    <p className="text-sm">
                        <EmailAddressText email={row.email} />
                    </p>
                </div>
                <ul className="flex min-w-0 flex-col gap-2">
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

function LiveAllIpsStudentCard({ roster }: { roster: LiveRosterEntry }) {
    return (
        <Card className="w-full gap-0 border border-border py-0 shadow-sm">
            <CardContent className="flex flex-col gap-4 py-4">
                <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-base font-medium">{roster.name}</p>
                    <p className="text-sm">
                        <EmailAddressText email={roster.email} />
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Login IPs
                        </p>
                        <LiveParticipantIpList ips={roster.login_ips} />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Submission IPs
                        </p>
                        <LiveParticipantIpList ips={roster.submission_ips} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function LiveLoginsPage() {
    const session = useLiveSession()
    const [roster, setRoster] = useState<LiveRosterEntry[] | null>(null)
    const [multipleIpByEmail, setMultipleIpByEmail] = useState<Map<string, LiveMultipleIpRow> | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [speed, setSpeed] = useState<LiveLoginsRefreshSpeed>(() => readLiveLoginsRefreshSpeed())
    const [view, setView] = useState<LiveLoginsView>(() => readLiveLoginsView())

    const canLoad = !session.loading && session.role === 'tutor'

    const multipleIpRows = useMemo(
        () => (multipleIpByEmail ? [...multipleIpByEmail.values()] : null),
        [multipleIpByEmail],
    )

    const toolbarSummary = useMemo(() => {
        if (view === 'multiple') {
            if (multipleIpRows === null) return null
            if (multipleIpRows.length === 0) return null
            return `${multipleIpRows.length} access${multipleIpRows.length === 1 ? '' : 'es'} with multiple IPs.`
        }
        if (roster === null) return null
        if (roster.length === 0) return null
        return `${roster.length} participant${roster.length === 1 ? '' : 's'}.`
    }, [view, multipleIpRows, roster])

    const reload = useCallback(async () => {
        const next = await fetchLiveLoginsPageData()
        setRoster(next.roster)
        setMultipleIpByEmail(next.multipleIpByEmail)
    }, [])

    useEffect(() => {
        if (!canLoad) return
        let cancelled = false
        setLoading(true)
        void reload()
            .catch((loadError: unknown) => {
                if (!cancelled) setError(liveErrorMessage(loadError, 'Could not load IP control data.'))
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
            setError(liveErrorMessage(loadError, 'Could not load IP control data.')),
        )
    }, [reload])

    useLiveRankingRefreshPoll(canLoad && roster !== null, speed, pollLogins)

    function refreshNow() {
        setError(null)
        setRefreshing(true)
        void reload()
            .catch((loadError: unknown) => setError(liveErrorMessage(loadError, 'Could not load IP control data.')))
            .finally(() => setRefreshing(false))
    }

    if (session.loading) return <LiveSpinner />
    if (session.role !== 'tutor') {
        return (
            <LivePage>
                <LiveNotice>
                    {session.authenticated ? 'IP control is for tutors.' : <Link href="/">Sign in</Link>}
                </LiveNotice>
            </LivePage>
        )
    }

    return (
        <LivePage>
            <LiveLoginsRefreshToolbar
                view={view}
                onViewChange={setView}
                speed={speed}
                onSpeedChange={setSpeed}
                onRefresh={refreshNow}
                refreshing={refreshing}
                summary={toolbarSummary}
            />
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {loading && roster === null ? <LiveSpinner /> : null}
            {view === 'multiple' && multipleIpRows && multipleIpRows.length > 0 ? (
                <ul
                    className="flex list-none flex-col gap-4"
                    role="tabpanel"
                    id="live-logins-panel-multiple"
                    aria-labelledby={`${LIVE_LOGINS_VIEW_TABS_LAYOUT_ID}-tab-multiple`}
                >
                    {multipleIpRows.map((row) => (
                        <li key={row.email}>
                            <LiveMultipleIpStudentCard row={row} />
                        </li>
                    ))}
                </ul>
            ) : null}
            {view === 'multiple' && multipleIpRows !== null && multipleIpRows.length === 0 ? (
                <div
                    role="tabpanel"
                    id="live-logins-panel-multiple"
                    aria-labelledby={`${LIVE_LOGINS_VIEW_TABS_LAYOUT_ID}-tab-multiple`}
                >
                    <LiveMultipleIpsEmptyCard />
                </div>
            ) : null}
            {view === 'all' && roster && roster.length > 0 ? (
                <ul
                    className="flex list-none flex-col gap-4"
                    role="tabpanel"
                    id="live-logins-panel-all"
                    aria-labelledby={`${LIVE_LOGINS_VIEW_TABS_LAYOUT_ID}-tab-all`}
                >
                    {roster.map((entry) => (
                        <li key={entry.email}>
                            <LiveAllIpsStudentCard roster={entry} />
                        </li>
                    ))}
                </ul>
            ) : null}
            {view === 'all' && roster !== null && roster.length === 0 ? (
                <div
                    role="tabpanel"
                    id="live-logins-panel-all"
                    aria-labelledby={`${LIVE_LOGINS_VIEW_TABS_LAYOUT_ID}-tab-all`}
                >
                    <LiveAllIpsEmptyCard />
                </div>
            ) : null}
        </LivePage>
    )
}