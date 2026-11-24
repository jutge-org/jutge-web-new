'use client'

import dayjs from 'dayjs'
import { CheckIcon, ClockIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { examElapsedProgress, examStartedAtMs, formatClock, formatRemainingHuman } from '@/lib/data/liveExam'
import {
    DEFAULT_REDUCED_MOTION,
    isMotionReduced,
    parseReducedMotion,
    REDUCED_MOTION_STORAGE_KEY,
    systemPrefersReducedMotion,
} from '@/lib/reducedMotion'
import type { RunningExam } from '@/lib/jutge_api_client'
import { useOpenWebSettingsStore } from '@/store/openWebSettings'
import { cn } from '@/lib/utils'

type TimerPhase = 'waiting' | 'running' | 'finished'

const HURRY_REMAINING_MS = 5 * 60 * 1000
const HUMAN_REMAINING_MS = 15 * 60 * 1000
const RING_SIZE = 136
const RING_STROKE = 8
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export type ExamTimerAction = { href: string } | { onClick: () => void }

function useTimerReducedMotion(): boolean {
    const storePreference = useOpenWebSettingsStore((state) => state.settings.appearance.reducedMotion)
    const storeReady = useOpenWebSettingsStore((state) => state.ready)
    const [systemReduced, setSystemReduced] = useState(systemPrefersReducedMotion)

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)')
        const onChange = () => setSystemReduced(media.matches)
        onChange()
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [])

    const preference = storeReady
        ? storePreference
        : (parseReducedMotion(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)) ?? DEFAULT_REDUCED_MOTION)

    return isMotionReduced(preference, systemReduced)
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

/** Wall-clock labels: date iff not today; seconds iff within five minutes of `now`. */
function formatInstantMark(ms: number, now: number): string {
    if (!Number.isFinite(ms)) return '—'
    const date = dayjs(ms)
    const nearNow = Math.abs(ms - now) < HURRY_REMAINING_MS
    const time = date.format(nearNow ? 'HH:mm:ss' : 'HH:mm')
    if (date.isSame(dayjs(now), 'day')) return time
    return `${date.format('YYYY-MM-DD')}, ${time}`
}

function PhaseTrack({ phase }: { phase: TimerPhase }) {
    const filled = phase === 'finished' ? 3 : phase === 'running' ? 2 : 1
    return (
        <div className="flex gap-1.5 px-4 pt-3" aria-hidden>
            {[0, 1, 2].map((index) => (
                <span
                    key={index}
                    className={cn(
                        'h-1 flex-1 rounded-full',
                        index < filled
                            ? phase === 'finished'
                                ? 'bg-blue-500'
                                : phase === 'running'
                                  ? 'bg-emerald-500'
                                  : 'bg-foreground/40'
                            : 'bg-foreground/10',
                    )}
                />
            ))}
        </div>
    )
}

function TimerStatusPill({ phase, urgent }: { phase: TimerPhase; urgent: boolean }) {
    if (phase === 'waiting') {
        return (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <ClockIcon className="size-3.5 shrink-0" aria-hidden />
                Waiting to start
            </p>
        )
    }
    if (phase === 'finished') {
        return (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <CheckIcon className="size-3.5 shrink-0" aria-hidden />
                Finished
            </p>
        )
    }
    return (
        <p
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                urgent
                    ? 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                    : 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
            )}
        >
            <span
                className={cn(
                    'size-1.5 shrink-0 animate-pulse rounded-full',
                    urgent ? 'bg-amber-400' : 'bg-emerald-400',
                )}
                aria-hidden
            />
            in progress
        </p>
    )
}

function TimerRing({
    variant,
    progress = 0,
    arcAmber = false,
    dashedPulse = false,
}: {
    variant: 'dashed' | 'drain' | 'full'
    progress?: number
    arcAmber?: boolean
    dashedPulse?: boolean
}) {
    const center = RING_SIZE / 2
    const circle = { cx: center, cy: center, r: RING_RADIUS, fill: 'none' as const }
    const dotGap = RING_CIRCUMFERENCE / 28

    return (
        <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="shrink-0"
            aria-hidden
        >
            {variant === 'dashed' ? (
                <circle
                    {...circle}
                    stroke="currentColor"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={`1 ${dotGap - 1}`}
                    className={cn('text-zinc-400', dashedPulse && 'animate-pulse')}
                />
            ) : null}
            {variant === 'drain' ? (
                <>
                    <circle
                        {...circle}
                        fill="none"
                        stroke="var(--border)"
                        strokeOpacity={0.8}
                        strokeWidth={RING_STROKE}
                    />
                    {(() => {
                        const elapsed = Math.max(0, Math.min(1, progress))
                        const arcLength = elapsed * RING_CIRCUMFERENCE
                        if (arcLength <= 0) return null
                        return (
                            <circle
                                {...circle}
                                fill="none"
                                stroke={arcAmber ? 'var(--color-amber-400, #fbbf24)' : 'var(--color-emerald-500, #10b981)'}
                                strokeWidth={RING_STROKE}
                                strokeLinecap={elapsed > 0.985 ? 'butt' : 'round'}
                                strokeDasharray={`${arcLength} ${RING_CIRCUMFERENCE}`}
                                transform={`rotate(-90 ${center} ${center})`}
                            />
                        )
                    })()}
                </>
            ) : null}
            {variant === 'full' ? (
                <circle {...circle} stroke="currentColor" strokeWidth={RING_STROKE} className="text-blue-500" />
            ) : null}
        </svg>
    )
}

function TimerFace({
    variant,
    progress,
    arcAmber,
    dashedPulse,
    children,
}: {
    variant: 'dashed' | 'drain' | 'full'
    progress?: number
    arcAmber?: boolean
    dashedPulse?: boolean
    children: ReactNode
}) {
    return (
        <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
            <TimerRing variant={variant} progress={progress} arcAmber={arcAmber} dashedPulse={dashedPulse} />
            <div className="absolute inset-0 flex items-center justify-center px-3 text-center">{children}</div>
        </div>
    )
}

function TimeReadout({
    value,
    spoken,
    caption,
    captionClassName,
    valueClassName,
}: {
    value: string
    spoken: string
    caption: string
    captionClassName?: string
    valueClassName?: string
}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <p
                className={cn(
                    'font-bold leading-none tracking-tight text-foreground',
                    valueClassName ? valueClassName : 'text-[1.65rem] tabular-nums',
                )}
                role="timer"
                aria-label={spoken}
            >
                <span aria-hidden>{value}</span>
            </p>
            <p className={cn('text-xs font-medium tracking-tight whitespace-nowrap', captionClassName)}>{caption}</p>
        </div>
    )
}

function FooterTimeMark({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex min-w-0 flex-col items-center gap-0.5 text-center">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <span className="text-xs font-medium whitespace-nowrap tabular-nums text-foreground sm:text-sm">{value}</span>
        </div>
    )
}

function ViewConfirmationControl({ action }: { action: ExamTimerAction }) {
    const className =
        'text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-blue-400'
    if ('href' in action) {
        return (
            <Link href={action.href} className={className}>
                View confirmation
            </Link>
        )
    }
    return (
        <button type="button" className={className} onClick={action.onClick}>
            View confirmation
        </button>
    )
}

export function ExamTimerCard({
    exam,
    now,
    started,
    finished,
    finishMs,
    submittedAtMs,
    continueExam,
    viewConfirmation,
    className,
}: {
    exam: RunningExam
    now: number
    started: boolean
    finished: boolean
    finishMs: number
    submittedAtMs: number | null
    continueExam: ExamTimerAction
    viewConfirmation: ExamTimerAction
    className?: string
}) {
    const phase: TimerPhase = finished ? 'finished' : started ? 'running' : 'waiting'
    const opensAtMs = new Date(exam.exp_time_start).getTime()
    const untilStartMs = Math.max(0, opensAtMs - now)
    const remainingMs = Math.max(0, finishMs - now)
    const urgent = phase === 'running' && remainingMs <= HURRY_REMAINING_MS
    const elapsedProgress = examElapsedProgress(exam, finishMs, now)
    const ringArcAmber = phase === 'running' && remainingMs <= HUMAN_REMAINING_MS
    const proofMs = submittedAtMs ?? finishMs
    const proofLabel = formatInstantMark(proofMs, now)
    const expectedStartLabel = formatInstantMark(opensAtMs, now)
    const startDelayed = phase === 'waiting' && now > opensAtMs
    const motionReduced = useTimerReducedMotion()
    const waitingDotsPulse = phase === 'waiting' && !motionReduced
    const showHumanRemaining = phase === 'running' && remainingMs > HUMAN_REMAINING_MS
    const runningDisplay = showHumanRemaining ? formatRemainingHuman(remainingMs) : formatClock(remainingMs)
    const runningSpoken = showHumanRemaining ? `${runningDisplay} remaining` : speakDuration(remainingMs)
    const startedAtMs = examStartedAtMs(exam)
    const runningStartLabel = formatInstantMark(startedAtMs, now)
    const runningEndLabel = formatInstantMark(finishMs, now)

    return (
        <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
            <PhaseTrack phase={phase} />
            <div className="flex justify-center px-3 pt-3">
                <TimerStatusPill phase={phase} urgent={urgent} />
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center">
                {phase === 'waiting' ? (
                    <TimerFace variant="dashed" dashedPulse={waitingDotsPulse}>
                        {startDelayed ? (
                            <div
                                className="flex flex-col items-center gap-1"
                                role="status"
                                aria-label="Delayed. Please hold."
                            >
                                <p className="text-lg font-bold leading-none tracking-tight text-foreground">Delayed</p>
                                <p className="text-xs font-medium tracking-tight text-muted-foreground">Please hold</p>
                            </div>
                        ) : (
                            <TimeReadout
                                value={formatClock(untilStartMs)}
                                spoken={speakDuration(untilStartMs)}
                                caption="until start"
                                captionClassName="text-muted-foreground"
                            />
                        )}
                    </TimerFace>
                ) : null}
                {phase === 'running' ? (
                    <TimerFace variant="drain" progress={elapsedProgress} arcAmber={ringArcAmber}>
                        <TimeReadout
                            value={runningDisplay}
                            spoken={runningSpoken}
                            caption={urgent ? 'left, hurry up' : 'remaining'}
                            captionClassName={
                                urgent ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                            }
                            valueClassName={showHumanRemaining ? 'max-w-[7.5rem] text-lg' : undefined}
                        />
                    </TimerFace>
                ) : null}
                {phase === 'finished' ? (
                    <TimerFace variant="full">
                        <div className="flex flex-col items-center gap-1">
                            <CheckIcon className="size-7 text-blue-500" strokeWidth={2.25} aria-hidden />
                            <p className="sr-only">Submitted at {proofLabel}</p>
                            <p
                                className={cn(
                                    'font-bold leading-none tracking-tight text-foreground tabular-nums',
                                    proofLabel.length > 5 ? 'text-sm' : 'text-xl',
                                )}
                                aria-hidden
                            >
                                {proofLabel}
                            </p>
                            <p className="text-xs font-medium text-foreground" aria-hidden>
                                Submitted
                            </p>
                        </div>
                    </TimerFace>
                ) : null}
            </div>
            <div
                className={cn(
                    'flex shrink-0 items-center justify-center px-3 pb-2',
                    phase === 'running' || phase === 'waiting' ? 'pt-0' : 'h-11',
                )}
            >
                {phase === 'waiting' ? (
                    <div className="flex w-full justify-center" aria-label={`Expected start time ${expectedStartLabel}`}>
                        <FooterTimeMark label="Expected start time" value={expectedStartLabel} />
                    </div>
                ) : null}
                {phase === 'running' ? (
                    <div
                        className="flex w-full justify-center gap-6 sm:gap-10"
                        role="group"
                        aria-label={`Start time ${runningStartLabel}, end time ${runningEndLabel}`}
                    >
                        <FooterTimeMark label="Start time" value={runningStartLabel} />
                        <FooterTimeMark label="End time" value={runningEndLabel} />
                    </div>
                ) : null}
                {phase === 'finished' ? <ViewConfirmationControl action={viewConfirmation} /> : null}
            </div>
        </div>
    )
}
