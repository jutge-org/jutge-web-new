'use client'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useClockFullscreen } from '@/store/clockFullscreen'
import { BinaryIcon, ClockIcon, FullscreenIcon, Minimize2Icon, TimerIcon, TimerOffIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactClock from 'react-clock'
import 'react-clock/dist/Clock.css'
import './analogClock.css'

type HourCycle = 'h12' | 'h23'
type ClockViewMode = 'analog' | 'digital'

type ClockPiece = {
    kind: 'time' | 'period'
    value: string
}

function clockPieces(date: Date, hourCycle: HourCycle, showSeconds: boolean): ClockPiece[] {
    const parts = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        ...(showSeconds ? { second: '2-digit' as const } : {}),
        hourCycle,
    }).formatToParts(date)

    const pieces: ClockPiece[] = []
    let time = ''

    function flushTime() {
        const value = time.trim()
        if (value) pieces.push({ kind: 'time', value })
        time = ''
    }

    for (const part of parts) {
        if (part.type === 'dayPeriod') {
            flushTime()
            const value = part.value.trim()
            if (value) pieces.push({ kind: 'period', value })
            continue
        }
        if (part.type === 'hour' || part.type === 'minute' || part.type === 'second' || part.type === 'literal') {
            time += part.value
        }
    }

    flushTime()
    return pieces
}

type ClockToolbarProps = {
    view: ClockViewMode
    hourCycle: HourCycle
    showSeconds: boolean
    fullscreen: boolean
    onViewChange: (view: ClockViewMode) => void
    onHourCycleChange: (hourCycle: HourCycle) => void
    onShowSecondsChange: (showSeconds: boolean) => void
    onFullscreenChange: () => void
}

function ClockToolbar({
    view,
    hourCycle,
    showSeconds,
    fullscreen,
    onViewChange,
    onHourCycleChange,
    onShowSecondsChange,
    onFullscreenChange,
}: ClockToolbarProps) {
    const viewLabel = view === 'analog' ? 'Digital clock' : 'Analog clock'
    const hourCycleLabel = hourCycle === 'h12' ? '24-hour clock' : '12-hour clock'
    const secondsLabel = showSeconds ? 'Hide seconds' : 'Show seconds'
    const fullscreenLabel = fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'

    return (
        <TooltipProvider>
            <div className="flex flex-row items-center justify-end gap-2">
                <ButtonGroup aria-label="Clock display">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label={viewLabel}
                                onClick={() => onViewChange(view === 'analog' ? 'digital' : 'analog')}
                            >
                                {view === 'analog' ? <BinaryIcon aria-hidden /> : <ClockIcon aria-hidden />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{viewLabel}</TooltipContent>
                    </Tooltip>
                    {view === 'digital' ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    aria-label={hourCycleLabel}
                                    className="tabular-nums"
                                    onClick={() => onHourCycleChange(hourCycle === 'h12' ? 'h23' : 'h12')}
                                >
                                    {hourCycle === 'h12' ? '24' : '12'}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">{hourCycleLabel}</TooltipContent>
                        </Tooltip>
                    ) : null}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label={secondsLabel}
                                aria-pressed={showSeconds}
                                className={cn(showSeconds && 'bg-muted')}
                                onClick={() => onShowSecondsChange(!showSeconds)}
                            >
                                {showSeconds ? <TimerIcon aria-hidden /> : <TimerOffIcon aria-hidden />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{secondsLabel}</TooltipContent>
                    </Tooltip>
                </ButtonGroup>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={fullscreenLabel}
                            aria-pressed={fullscreen}
                            className={cn(fullscreen && 'bg-muted')}
                            onClick={onFullscreenChange}
                        >
                            {fullscreen ? <Minimize2Icon aria-hidden /> : <FullscreenIcon aria-hidden />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{fullscreenLabel}</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}

export function ClockView() {
    const stageRef = useRef<HTMLDivElement>(null)
    const [now, setNow] = useState(() => new Date())
    const [view, setView] = useState<ClockViewMode>('analog')
    const [hourCycle, setHourCycle] = useState<HourCycle>('h23')
    const [showSeconds, setShowSeconds] = useState(true)
    const fullscreen = useClockFullscreen((state) => state.active)
    const setFullscreen = useClockFullscreen((state) => state.setActive)
    const pieces = clockPieces(now, hourCycle, showSeconds)

    useEffect(() => {
        let timeoutId = 0

        function tick() {
            setNow(new Date())
            timeoutId = window.setTimeout(tick, 1000 - (Date.now() % 1000))
        }

        function onVisibilityChange() {
            if (document.visibilityState === 'visible') setNow(new Date())
        }

        timeoutId = window.setTimeout(tick, 1000 - (Date.now() % 1000))
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => {
            window.clearTimeout(timeoutId)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [])

    useEffect(() => {
        return () => setFullscreen(false)
    }, [setFullscreen])

    useEffect(() => {
        if (!fullscreen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setFullscreen(false)
                return
            }
            if (event.key !== 'Tab') return

            const stage = stageRef.current
            if (!stage) return
            const focusable = [...stage.querySelectorAll<HTMLElement>('button:not([disabled])')].filter(
                (element) => element.tabIndex !== -1,
            )
            if (focusable.length === 0) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [fullscreen, setFullscreen])

    return (
        <div
            ref={stageRef}
            className={cn(
                'flex min-h-0 flex-1 flex-col',
                fullscreen && 'fixed inset-0 z-40 bg-background p-4 sm:p-6',
            )}
        >
            <h1 className="sr-only">Clock</h1>
            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
                <ClockToolbar
                    view={view}
                    hourCycle={hourCycle}
                    showSeconds={showSeconds}
                    fullscreen={fullscreen}
                    onViewChange={setView}
                    onHourCycleChange={setHourCycle}
                    onShowSecondsChange={setShowSeconds}
                    onFullscreenChange={() => setFullscreen(!fullscreen)}
                />
                <div className="@container flex w-full min-w-0 items-center justify-center">
                    {view === 'analog' ? (
                        <ReactClock
                            className="analog-clock"
                            value={now}
                            size={250}
                            renderSecondHand={showSeconds}
                            hourHandLength={60}
                            hourHandOppositeLength={20}
                            hourHandWidth={8}
                            hourMarksLength={20}
                            hourMarksWidth={8}
                            minuteHandLength={90}
                            minuteHandOppositeLength={20}
                            minuteHandWidth={6}
                            minuteMarksWidth={3}
                            secondHandLength={75}
                            secondHandOppositeLength={25}
                            secondHandWidth={3}
                        />
                    ) : (
                        <time
                            dateTime={now.toISOString()}
                            suppressHydrationWarning
                            className="flex max-w-full items-baseline justify-center gap-[0.12em] px-2 text-center text-[clamp(4rem,14cqw,11rem)] leading-none font-medium tracking-tight text-foreground tabular-nums"
                        >
                            {pieces.map((piece, index) =>
                                piece.kind === 'period' ? (
                                    <span
                                        key={`${piece.kind}-${index}`}
                                        suppressHydrationWarning
                                        className="text-[0.22em] font-semibold tracking-wide whitespace-nowrap text-muted-foreground"
                                    >
                                        {piece.value}
                                    </span>
                                ) : (
                                    <span
                                        key={`${piece.kind}-${index}`}
                                        suppressHydrationWarning
                                        className="whitespace-nowrap"
                                    >
                                        {piece.value}
                                    </span>
                                ),
                            )}
                        </time>
                    )}
                </div>
            </div>
        </div>
    )
}
