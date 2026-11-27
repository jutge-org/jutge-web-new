'use client'

import dayjs from 'dayjs'
import { CheckIcon, MailIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import {
    createExamRingLayout,
    EXAM_RING_START_CLOCK_DEG,
    fractionToRingClockDeg,
    ringArcPath,
    ringPointFromClockDeg,
    ringTickSegment,
} from '@/components/live/examRingGeometry'
import {
    ControllerExamStatusBadge,
    ControllerStartExamButton,
} from '@/components/live/LiveControllerExamCard'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    fetchLiveRoster,
    finishTimeMs,
    formatClock,
    formatEndMarkParticipantLabel,
    formatLiveDateTime,
    formatRemainingHuman,
    formatRunningTimeHumanExact,
    formatTutorExamCtlStatusLabel,
    runningExamDurationMinutes,
    liveRosterCountAtEndMs,
    liveRosterParticipantTotal,
    tutorExamCtlStatusToLiveStatus,
    type LiveRosterEntry,
    type LiveTutorStatus,
} from '@/lib/data/liveExam'
import type { RunningExam } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

const CONTROLLER_RING = createExamRingLayout(260, 34)
/** Matches `bg-destructive/15` on the Finished status badge. */
const CONTROLLER_FINISHED_RING_STROKE =
    'color-mix(in oklab, var(--color-destructive) 20%, var(--color-background))'
const INSTANT_MARK_NEAR_NOW_MS = 5 * 60 * 1000
const END_MARK_DOT_R = 4.5
/** Radial extent of the blue “now” tick on each side of the ring track centerline. */
const NOW_TICK_HALF_LENGTH = 20
const NOW_TICK_STROKE = 2
/** Signed offset from the ring track (separate radii so marks do not overlap). */
const END_MARK_DOT_RADIUS_OFFSET: Record<string, number> = {
    min: 10,
    mode: 0,
    max: -10,
}

type ControllerPhase = 'waiting' | 'running' | 'finished'

type EndMarkSpec = {
    id: string
    label: string
    ms: number
    fraction: number
    stroke: string
    participantCount?: number
    participantTotal?: number
}

function endMarkParticipantLabel(mark: EndMarkSpec): string | null {
    if (mark.participantCount == null || mark.participantTotal == null) return null
    return formatEndMarkParticipantLabel(mark.participantCount, mark.participantTotal)
}

function parseIsoMs(value: string | null | undefined): number | null {
    if (!value) return null
    const ms = new Date(value).getTime()
    return Number.isFinite(ms) ? ms : null
}

function instantMarkShowsDate(ms: number, now: number): boolean {
    if (!Number.isFinite(ms)) return false
    return !dayjs(ms).isSame(dayjs(now), 'day')
}

function formatInstantMark(ms: number, now: number): string {
    if (!Number.isFinite(ms)) return '—'
    const date = dayjs(ms)
    const nearNow = Math.abs(ms - now) < INSTANT_MARK_NEAR_NOW_MS
    const time = date.format(nearNow ? 'HH:mm:ss' : 'HH:mm')
    if (!instantMarkShowsDate(ms, now)) return time
    return `${date.format('YYYY-MM-DD')} ${time}`
}

function formatLegendInstant(ms: number, now: number): string {
    if (!Number.isFinite(ms)) return '—'
    const date = dayjs(ms)
    const time = date.format('HH:mm:ss')
    if (!instantMarkShowsDate(ms, now)) return time
    return `${date.format('YYYY-MM-DD')} ${time}`
}

function speakDuration(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const seconds = total % 60
    const parts: string[] = []
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
    if (minutes > 0 || hours > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`)
    return parts.join(' ')
}

function controllerRingWindow(
    exam: RunningExam,
    tutorStatus: LiveTutorStatus,
): { startMs: number; endMaxMs: number; spanMs: number } {
    const startMs =
        parseIsoMs(tutorStatus.time_start) ??
        parseIsoMs(exam.time_start) ??
        new Date(exam.exp_time_start).getTime()
    const endMaxMs = parseIsoMs(tutorStatus.time_end_max) ?? finishTimeMs(exam, null)
    const spanMs = Math.max(endMaxMs - startMs, 60_000)
    return { startMs, endMaxMs, spanMs }
}

function buildEndMarks(tutorStatus: LiveTutorStatus, startMs: number, spanMs: number): EndMarkSpec[] {
    const entries: { id: string; label: string; iso: string | null; stroke: string }[] = [
        { id: 'min', label: 'Earliest', iso: tutorStatus.time_end_min, stroke: 'var(--color-green)' },
        { id: 'mode', label: 'Mode', iso: tutorStatus.time_end_mode, stroke: 'var(--color-amber)' },
        { id: 'max', label: 'Latest', iso: tutorStatus.time_end_max, stroke: 'var(--color-destructive)' },
    ]
    const marks: EndMarkSpec[] = []
    for (const entry of entries) {
        const ms = parseIsoMs(entry.iso)
        if (ms == null) continue
        const fraction = (ms - startMs) / spanMs
        if (fraction < -0.01 || fraction > 1.02) continue
        marks.push({
            id: entry.id,
            label: entry.label,
            ms,
            fraction: Math.max(0, Math.min(1, fraction)),
            stroke: entry.stroke,
        })
    }
    return marks
}

function TimeReadout({
    value,
    spoken,
    caption,
    valueClassName,
}: {
    value: string
    spoken: string
    caption: string
    valueClassName?: string
}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <p
                className={cn(
                    'font-bold leading-none tracking-tight text-foreground tabular-nums',
                    valueClassName ?? 'text-[2rem]',
                )}
                role="timer"
                aria-label={spoken}
            >
                <span aria-hidden>{value}</span>
            </p>
            <p className="text-xs font-medium tracking-tight whitespace-nowrap text-muted-foreground">{caption}</p>
        </div>
    )
}

function ControllerRingFace({
    variant,
    progress,
    nowTickFraction,
    endMarks,
    now,
    topOverlay,
    children,
}: {
    variant: 'dashed' | 'drain' | 'full'
    progress?: number
    /** Position on the exam timeline (0–1) for the blue current-time tick; omit before the window. */
    nowTickFraction?: number | null
    endMarks: EndMarkSpec[]
    now: number
    topOverlay?: ReactNode
    children: ReactNode
}) {
    const { size, stroke, radius, center, trackPath } = CONTROLLER_RING
    const elapsed = progress != null ? Math.max(0, Math.min(1, progress)) : 0
    const progressPath =
        variant === 'drain'
            ? ringArcPath(EXAM_RING_START_CLOCK_DEG, fractionToRingClockDeg(elapsed), center, center, radius)
            : ''
    const showNowTick =
        nowTickFraction != null &&
        Number.isFinite(nowTickFraction) &&
        nowTickFraction >= 0 &&
        nowTickFraction <= 1
    const nowTickPath = showNowTick
        ? ringTickSegment(
            fractionToRingClockDeg(nowTickFraction),
            center,
            center,
            radius,
            NOW_TICK_HALF_LENGTH,
        )
        : ''

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="shrink-0"
                aria-hidden
            >
                {variant === 'dashed' ? (
                    <path
                        d={trackPath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        className="text-smooth-600 dark:text-smooth-700"
                    />
                ) : null}
                {variant === 'drain' ? (
                    <path
                        d={trackPath}
                        fill="none"
                        stroke="var(--border)"
                        strokeOpacity={0.85}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                    />
                ) : null}
                {variant === 'full' ? (
                    <path
                        d={trackPath}
                        fill="none"
                        stroke={CONTROLLER_FINISHED_RING_STROKE}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                    />
                ) : null}
                {progressPath ? (
                    <path
                        d={progressPath}
                        fill="none"
                        stroke="var(--color-blue)"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                    />
                ) : null}
                {nowTickPath ? (
                    <path
                        d={nowTickPath}
                        fill="none"
                        stroke={variant === 'full' ? CONTROLLER_FINISHED_RING_STROKE : 'currentColor'}
                        strokeWidth={NOW_TICK_STROKE}
                        strokeLinecap="round"
                        className={variant === 'full' ? undefined : 'text-blue-ink'}
                    />
                ) : null}
            </svg>
            {endMarks.length > 0 ? (
                <TooltipProvider delayDuration={200}>
                    {endMarks.map((mark) => {
                        const clockDeg = fractionToRingClockDeg(mark.fraction)
                        const dotOffset = END_MARK_DOT_RADIUS_OFFSET[mark.id] ?? 0
                        const dotR = radius + dotOffset
                        const dot = ringPointFromClockDeg(clockDeg, center, center, dotR)
                        const instant = formatLegendInstant(mark.ms, now)
                        const relative = humanTimeRelativeToNow(mark.ms, now)
                        const participants = endMarkParticipantLabel(mark)
                        const spoken = [mark.label, instant, relative, participants].filter(Boolean).join(', ')
                        return (
                            <Tooltip key={mark.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="pointer-events-auto absolute z-20 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        style={{ left: dot.x, top: dot.y }}
                                        aria-label={spoken}
                                    >
                                        <span
                                            className="block shrink-0 rounded-full"
                                            style={{
                                                width: END_MARK_DOT_R * 2,
                                                height: END_MARK_DOT_R * 2,
                                                backgroundColor: mark.stroke,
                                            }}
                                            aria-hidden
                                        />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                    <div className="flex flex-col gap-0.5 text-left">
                                        <span className="font-medium">{mark.label}</span>
                                        <span className="tabular-nums">{instant}</span>
                                        <span className="text-xs tabular-nums">{relative}</span>
                                        {participants ? (
                                            <span className="text-xs tabular-nums">{participants}</span>
                                        ) : null}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </TooltipProvider>
            ) : null}
            {topOverlay ? (
                <div className="pointer-events-none absolute left-1/2 top-[65%] z-10 -translate-x-1/2">
                    {topOverlay}
                </div>
            ) : null}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
                {children}
            </div>
        </div>
    )
}

function humanTimeRelativeToNow(markMs: number, now: number): string {
    const diffMs = markMs - now
    if (Math.abs(diffMs) < 30_000) return 'now'
    if (diffMs > 0) return `in ${formatRemainingHuman(diffMs)}`
    return `${formatRemainingHuman(-diffMs)} ago`
}

function EndMarkLegend({ marks, now }: { marks: EndMarkSpec[]; now: number }) {
    if (marks.length === 0) return null
    return (
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-border text-sm">
            <caption className="sr-only">Aggregated student end times</caption>
            <tbody>
                {marks.map((mark) => {
                    const participants = endMarkParticipantLabel(mark)
                    return (
                        <tr key={mark.id} className="border-b border-border last:border-b-0">
                            <th
                                scope="row"
                                className="px-3 py-2 text-left align-middle font-medium text-foreground"
                            >
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className="size-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: mark.stroke }}
                                        aria-hidden
                                    />
                                    {mark.label}
                                </span>
                            </th>
                            <td className="px-3 py-2 text-right align-middle">
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className="font-medium tabular-nums text-foreground">
                                        {formatLegendInstant(mark.ms, now)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {humanTimeRelativeToNow(mark.ms, now)}
                                    </span>
                                    {participants ? (
                                        <span className="text-sm tabular-nums text-muted-foreground">
                                            {participants}
                                        </span>
                                    ) : null}
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

const TIMING_ROW_ICON_CLASS = 'size-3.5 shrink-0 text-muted-foreground'

function TimingLegendRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <tr className="border-b border-border last:border-b-0">
            <th scope="row" className="px-3 py-2 text-left align-middle font-medium text-foreground">
                {label}
            </th>
            <td className="px-3 py-2 text-right align-middle">{children}</td>
        </tr>
    )
}

function ControllerExamTimingPanel({
    exam,
    tutorStatus,
    liveStatus,
}: {
    exam: RunningExam
    tutorStatus: LiveTutorStatus
    liveStatus: ReturnType<typeof tutorExamCtlStatusToLiveStatus>
}) {
    const runningTime = formatRunningTimeHumanExact(runningExamDurationMinutes(exam))
    const waiting = liveStatus === 'waiting'
    const startedAt = tutorStatus.time_start ?? exam.time_start
    const starterName = tutorStatus.starter_name?.trim() ?? ''
    const starterEmail = tutorStatus.starter_email?.trim() ?? ''

    return (
        <div className="flex w-full max-w-sm flex-col gap-4 text-base">
            <table className="w-full border-collapse overflow-hidden rounded-lg border border-border text-sm">
                <caption className="sr-only">Exam start and duration</caption>
                <tbody>
                    {waiting ? (
                        <TimingLegendRow label="Expected start">
                            <span className="font-medium tabular-nums text-foreground">
                                {formatLiveDateTime(exam.exp_time_start)}
                            </span>
                        </TimingLegendRow>
                    ) : (
                        <>
                            <TimingLegendRow label="Started at">
                                <span className="font-medium tabular-nums text-foreground">
                                    {startedAt ? formatLiveDateTime(startedAt) : '—'}
                                </span>
                            </TimingLegendRow>
                            <TimingLegendRow label="Started by">
                                <div className="flex flex-col items-end gap-0.5">
                                    {starterName ? (
                                        <span className="max-w-full truncate font-medium text-foreground">
                                            {starterName}
                                        </span>
                                    ) : null}
                                    {starterEmail ? (
                                        <span className="inline-flex max-w-full items-center justify-end gap-1.5 text-sm text-muted-foreground">
                                            <MailIcon className={TIMING_ROW_ICON_CLASS} aria-hidden />
                                            <span className="truncate">{starterEmail}</span>
                                        </span>
                                    ) : null}
                                    {!starterName && !starterEmail ? (
                                        <span className="text-muted-foreground">—</span>
                                    ) : null}
                                </div>
                            </TimingLegendRow>
                        </>
                    )}
                    <TimingLegendRow label="Running time">
                        <span className="font-medium text-foreground">{runningTime}</span>
                    </TimingLegendRow>
                </tbody>
            </table>
        </div>
    )
}

function ControllerTimerLegendPanel({
    phase,
    endMarks,
    now,
}: {
    phase: ControllerPhase
    endMarks: EndMarkSpec[]
    now: number
}) {
    if (phase === 'running') {
        return (
            <div className="flex w-full max-w-sm flex-col gap-4 text-base">
                {endMarks.length > 0 ? (
                    <EndMarkLegend marks={endMarks} now={now} />
                ) : (
                    <p className="text-sm text-muted-foreground">No aggregated end times yet.</p>
                )}
            </div>
        )
    }

    return (
        <div className="flex w-full max-w-sm flex-col gap-4 text-base">
            {endMarks.length > 0 ? (
                <EndMarkLegend marks={endMarks} now={now} />
            ) : (
                <p className="text-sm text-muted-foreground">No end time data.</p>
            )}
        </div>
    )
}

export function ControllerExamTimerCard({
    exam,
    tutorStatus,
    now,
    className,
}: {
    exam: RunningExam
    tutorStatus: LiveTutorStatus
    now: number
    className?: string
}) {
    const session = useLiveSession()
    const liveStatus = tutorExamCtlStatusToLiveStatus(tutorStatus.status)
    const statusLabel = formatTutorExamCtlStatusLabel(tutorStatus.status)
    const phase: ControllerPhase =
        liveStatus === 'finished' ? 'finished' : liveStatus === 'running' ? 'running' : 'waiting'
    const opensAtMs = new Date(exam.exp_time_start).getTime()
    const untilStartMs = Math.max(0, opensAtMs - now)
    const startDelayed = phase === 'waiting' && now > opensAtMs
    const delayedMs = startDelayed ? Math.max(0, now - opensAtMs) : 0

    const { startMs, endMaxMs, spanMs } = useMemo(
        () => controllerRingWindow(exam, tutorStatus),
        [exam, tutorStatus],
    )

    const [roster, setRoster] = useState<LiveRosterEntry[] | null>(null)

    useEffect(() => {
        if (phase === 'waiting') {
            setRoster(null)
            return
        }
        let cancelled = false
        async function loadRoster() {
            try {
                const rows = await fetchLiveRoster()
                if (!cancelled) setRoster(rows)
            } catch {
                if (!cancelled) setRoster(null)
            }
        }
        void loadRoster()
        const timer = window.setInterval(() => {
            void loadRoster()
        }, 10_000)
        return () => {
            cancelled = true
            window.clearInterval(timer)
        }
    }, [phase])

    const endMarks = useMemo(() => {
        if (phase === 'waiting') return []
        const marks = buildEndMarks(tutorStatus, startMs, spanMs)
        if (!roster) return marks
        const participantTotal = liveRosterParticipantTotal(roster)
        return marks.map((mark) => ({
            ...mark,
            participantCount: liveRosterCountAtEndMs(roster, mark.ms),
            participantTotal,
        }))
    }, [phase, tutorStatus, startMs, spanMs, roster])

    const nowFraction = phase === 'running' ? Math.max(0, Math.min(1, (now - startMs) / spanMs)) : null
    const nowTickFraction =
        phase === 'waiting' ? null : Math.max(0, Math.min(1, (now - startMs) / spanMs))
    const elapsedMs = phase === 'running' ? Math.max(0, now - startMs) : 0
    const untilLatestEndMs = phase === 'running' ? Math.max(0, endMaxMs - now) : 0
    const showHumanUntilEnd = untilLatestEndMs > 15 * 60 * 1000

    const ringAriaLabel = useMemo(() => {
        if (phase === 'waiting') {
            if (startDelayed) return `Delayed ${speakDuration(delayedMs)} past expected start`
            return `Countdown to start, ${speakDuration(untilStartMs)} remaining`
        }
        if (phase === 'running') {
            const markText = endMarks.map((m) => `${m.label} ${formatInstantMark(m.ms, now)}`).join(', ')
            return `Exam in progress. Elapsed ${speakDuration(elapsedMs)}. Student end times: ${markText || 'none yet'}`
        }
        return 'Exam finished'
    }, [phase, startDelayed, delayedMs, untilStartMs, elapsedMs, endMarks, now])

    return (
        <div
            className={cn(
                'grid w-full grid-cols-1 gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.1fr)] lg:items-center lg:gap-8',
                className,
            )}
            aria-label={ringAriaLabel}
        >
            <div className="flex min-w-0 justify-center lg:justify-end">
                <ControllerExamTimingPanel exam={exam} liveStatus={liveStatus} tutorStatus={tutorStatus} />
            </div>
            <div className="flex min-w-0 items-center justify-center">
                {phase === 'waiting' ? (
                    <ControllerRingFace
                        variant="dashed"
                        endMarks={[]}
                        nowTickFraction={nowTickFraction}
                        now={now}
                        topOverlay={<ControllerExamStatusBadge label={statusLabel} status={liveStatus} />}
                    >
                        <TimeReadout
                            value={formatClock(startDelayed ? delayedMs : untilStartMs)}
                            spoken={speakDuration(startDelayed ? delayedMs : untilStartMs)}
                            caption={startDelayed ? 'delayed' : 'until start'}
                        />
                    </ControllerRingFace>
                ) : null}
                {phase === 'running' ? (
                    <ControllerRingFace
                        variant="drain"
                        progress={nowFraction ?? 0}
                        nowTickFraction={nowTickFraction}
                        endMarks={endMarks}
                        now={now}
                        topOverlay={<ControllerExamStatusBadge label={statusLabel} status={liveStatus} />}
                    >
                        <TimeReadout
                            value={formatClock(elapsedMs)}
                            spoken={`Elapsed ${speakDuration(elapsedMs)}`}
                            caption="elapsed"
                            valueClassName={showHumanUntilEnd ? 'text-[1.5rem]' : undefined}
                        />
                    </ControllerRingFace>
                ) : null}
                {phase === 'finished' ? (
                    <ControllerRingFace
                        variant="full"
                        endMarks={endMarks}
                        nowTickFraction={nowTickFraction}
                        now={now}
                        topOverlay={<ControllerExamStatusBadge label={statusLabel} status={liveStatus} />}
                    >
                        <CheckIcon className="size-8 text-foreground" strokeWidth={2.25} aria-hidden />
                    </ControllerRingFace>
                ) : null}
            </div>
            <div className="flex min-h-[min(100%,17.5rem)] min-w-0 items-center justify-center self-stretch">
                {phase === 'waiting' ? (
                    <ControllerStartExamButton
                        contest={exam.contest != 0}
                        onStarted={session.refresh}
                    />
                ) : (
                    <div className="flex w-full max-w-sm justify-center lg:justify-start">
                        <ControllerTimerLegendPanel phase={phase} endMarks={endMarks} now={now} />
                    </div>
                )}
            </div>
        </div>
    )
}