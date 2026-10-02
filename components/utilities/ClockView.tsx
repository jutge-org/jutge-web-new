'use client'

import AnimatedTabs from '@/components/smoothui/animated-tabs'
import AnimatedToggle from '@/components/smoothui/animated-toggle'
import Scrubber from '@/components/smoothui/scrubber'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useClockFullscreen } from '@/store/clockFullscreen'
import { BinaryIcon, ClockIcon, FullscreenIcon, Minimize2Icon, RefreshCwIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import ReactClock from 'react-clock'
import 'react-clock/dist/Clock.css'
import './analogClock.css'

type HourCycle = 'h12' | 'h23'
type ClockViewMode = 'analog' | 'digital'

const BACKGROUND_REFRESH_MINUTES_DEFAULT = 5
const BACKGROUND_REFRESH_MINUTES_MAX = 15

function backgroundImageUrl(token: number, grayscale: boolean, blur: boolean) {
    const params = [`random=${token}`]
    if (grayscale) params.push('grayscale')
    if (blur) params.push('blur')
    return `https://picsum.photos/1920/1080?${params.join('&')}`
}

function formatBackgroundRefreshMinutes(minutes: number) {
    if (minutes === 0) return 'Off'
    if (minutes === 1) return '1 min'
    return `${minutes} min`
}

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

type SettingSectionProps = {
    title: string
    description: string
    children: ReactNode
}

function SettingSection({ title, description, children }: SettingSectionProps) {
    return (
        <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{title}</legend>
            <p className="text-sm text-muted-foreground">{description}</p>
            {children}
        </fieldset>
    )
}

type SettingRowProps = {
    label: string
    children: ReactNode
}

function SettingRow({ label, children }: SettingRowProps) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            {children}
        </div>
    )
}

type ClockPropertiesDialogProps = {
    open: boolean
    view: ClockViewMode
    hourCycle: HourCycle
    showSeconds: boolean
    showBackground: boolean
    backgroundRefreshMinutes: number
    backgroundGrayscale: boolean
    backgroundBlur: boolean
    announcement: string
    reloadingBackground: boolean
    onOpenChange: (open: boolean) => void
    onViewChange: (view: ClockViewMode) => void
    onHourCycleChange: (hourCycle: HourCycle) => void
    onShowSecondsChange: (showSeconds: boolean) => void
    onShowBackgroundChange: (showBackground: boolean) => void
    onBackgroundRefreshMinutesChange: (minutes: number) => void
    onBackgroundGrayscaleChange: (grayscale: boolean) => void
    onBackgroundBlurChange: (blur: boolean) => void
    onReloadBackground: () => void
    onAnnouncementChange: (announcement: string) => void
}

function ClockPropertiesDialog({
    open,
    view,
    hourCycle,
    showSeconds,
    showBackground,
    backgroundRefreshMinutes,
    backgroundGrayscale,
    backgroundBlur,
    announcement,
    reloadingBackground,
    onOpenChange,
    onViewChange,
    onHourCycleChange,
    onShowSecondsChange,
    onShowBackgroundChange,
    onBackgroundRefreshMinutesChange,
    onBackgroundGrayscaleChange,
    onBackgroundBlurChange,
    onReloadBackground,
    onAnnouncementChange,
}: ClockPropertiesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[80vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4">
                    <DialogTitle>Clock properties</DialogTitle>
                    <DialogDescription>Choose how the clock is displayed.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-8">
                        <SettingSection title="Display" description="Show an analog face or a digital readout.">
                            <AnimatedTabs
                                activeTab={view}
                                className="w-full"
                                onChange={(tabId) => onViewChange(tabId as ClockViewMode)}
                                tabs={[
                                    {
                                        id: 'analog',
                                        label: 'Analog',
                                        icon: <ClockIcon className="size-4" aria-hidden />,
                                    },
                                    {
                                        id: 'digital',
                                        label: 'Digital',
                                        icon: <BinaryIcon className="size-4" aria-hidden />,
                                    },
                                ]}
                                variant="segment"
                            />
                        </SettingSection>
                        <SettingSection
                            title="Hour format"
                            description="Choose 12-hour or 24-hour time. This applies to the digital clock."
                        >
                            <AnimatedTabs
                                activeTab={hourCycle}
                                className="w-full"
                                onChange={(tabId) => onHourCycleChange(tabId as HourCycle)}
                                tabs={[
                                    { id: 'h12', label: '12-hour' },
                                    { id: 'h23', label: '24-hour' },
                                ]}
                                variant="segment"
                            />
                        </SettingSection>
                        <SettingSection title="Seconds" description="Show the second hand and the seconds digits.">
                            <AnimatedTabs
                                activeTab={showSeconds ? 'yes' : 'no'}
                                className="w-full"
                                onChange={(tabId) => onShowSecondsChange(tabId === 'yes')}
                                tabs={[
                                    { id: 'yes', label: 'Yes' },
                                    { id: 'no', label: 'No' },
                                ]}
                                variant="segment"
                            />
                        </SettingSection>
                        <SettingSection
                            title="Background"
                            description="Show a photo behind the clock. Choose how often a new image is loaded, from 0 to 15 minutes. Zero means the image is not refreshed."
                        >
                            <AnimatedTabs
                                activeTab={showBackground ? 'yes' : 'no'}
                                className="w-full"
                                onChange={(tabId) => onShowBackgroundChange(tabId === 'yes')}
                                tabs={[
                                    { id: 'yes', label: 'Yes' },
                                    { id: 'no', label: 'No' },
                                ]}
                                variant="segment"
                            />
                            <Scrubber
                                decimals={0}
                                disabled={!showBackground}
                                formatValue={formatBackgroundRefreshMinutes}
                                label="Refresh"
                                max={BACKGROUND_REFRESH_MINUTES_MAX}
                                min={0}
                                onValueChange={onBackgroundRefreshMinutesChange}
                                step={1}
                                ticks={5}
                                value={backgroundRefreshMinutes}
                            />
                            <SettingRow label="Grayscale">
                                <AnimatedToggle
                                    checked={backgroundGrayscale}
                                    disabled={!showBackground}
                                    label="Grayscale"
                                    onChange={onBackgroundGrayscaleChange}
                                />
                            </SettingRow>
                            <SettingRow label="Blurred">
                                <AnimatedToggle
                                    checked={backgroundBlur}
                                    disabled={!showBackground}
                                    label="Blurred"
                                    onChange={onBackgroundBlurChange}
                                />
                            </SettingRow>
                            <SettingRow label="Reload image">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label="Reload background"
                                                    disabled={!showBackground || reloadingBackground}
                                                    onClick={onReloadBackground}
                                                >
                                                    <RefreshCwIcon
                                                        className={cn(reloadingBackground && 'animate-spin')}
                                                        aria-hidden
                                                    />
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Reload background</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </SettingRow>
                        </SettingSection>
                        <SettingSection title="Announcement" description="Show a message below the clock.">
                            <Textarea
                                value={announcement}
                                onChange={(event) => onAnnouncementChange(event.target.value)}
                                placeholder="Announcement"
                                rows={2}
                                aria-label="Announcement"
                            />
                        </SettingSection>
                    </div>
                </div>
                <div className="flex shrink-0 justify-end border-t border-border px-6 py-4">
                    <SmoothButton
                        type="button"
                        className="w-full md:w-auto"
                        onClick={() => onOpenChange(false)}
                        prefix={<XIcon aria-hidden />}
                    >
                        Close
                    </SmoothButton>
                </div>
            </DialogContent>
        </Dialog>
    )
}

type ClockToolbarProps = {
    propertiesOpen: boolean
    fullscreen: boolean
    elevated: boolean
    onPropertiesOpen: () => void
    onFullscreenChange: () => void
}

function ClockToolbar({ propertiesOpen, fullscreen, elevated, onPropertiesOpen, onFullscreenChange }: ClockToolbarProps) {
    const fullscreenLabel = fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'

    return (
        <TooltipProvider>
            <div className={cn('flex flex-row items-center justify-end gap-2', elevated && 'm-2')}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Properties"
                            aria-haspopup="dialog"
                            aria-expanded={propertiesOpen}
                            className={cn(elevated && 'shadow-md')}
                            onClick={onPropertiesOpen}
                        >
                            <SlidersHorizontalIcon aria-hidden />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Properties</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={fullscreenLabel}
                            aria-pressed={fullscreen}
                            className={cn(fullscreen && 'bg-muted', elevated && 'shadow-md')}
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
    const [showBackground, setShowBackground] = useState(false)
    const [backgroundRefreshMinutes, setBackgroundRefreshMinutes] = useState(BACKGROUND_REFRESH_MINUTES_DEFAULT)
    const [backgroundGrayscale, setBackgroundGrayscale] = useState(false)
    const [backgroundBlur, setBackgroundBlur] = useState(false)
    const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
    const [reloadingBackground, setReloadingBackground] = useState(false)
    const loadBackgroundRef = useRef<((manual: boolean) => void) | null>(null)
    const backgroundGrayscaleRef = useRef(backgroundGrayscale)
    const backgroundBlurRef = useRef(backgroundBlur)
    backgroundGrayscaleRef.current = backgroundGrayscale
    backgroundBlurRef.current = backgroundBlur
    const [announcement, setAnnouncement] = useState('')
    const [propertiesOpen, setPropertiesOpen] = useState(false)
    const propertiesOpenRef = useRef(false)
    propertiesOpenRef.current = propertiesOpen
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
        if (!showBackground) {
            loadBackgroundRef.current = null
            return
        }

        let cancelled = false
        let requestId = 0

        function loadNextImage(manual: boolean) {
            const id = ++requestId
            const url = backgroundImageUrl(Date.now(), backgroundGrayscaleRef.current, backgroundBlurRef.current)
            const image = new Image()
            if (manual) setReloadingBackground(true)
            function finish(loaded: boolean) {
                if (cancelled || id !== requestId) return
                if (loaded) setBackgroundUrl(url)
                setReloadingBackground(false)
            }
            image.onload = () => finish(true)
            image.onerror = () => finish(false)
            image.src = url
        }

        loadBackgroundRef.current = loadNextImage
        loadNextImage(false)
        return () => {
            cancelled = true
            loadBackgroundRef.current = null
            setReloadingBackground(false)
            setBackgroundUrl(null)
        }
    }, [showBackground])

    useEffect(() => {
        loadBackgroundRef.current?.(false)
    }, [backgroundGrayscale, backgroundBlur])

    useEffect(() => {
        if (!showBackground || backgroundRefreshMinutes <= 0) return
        const intervalId = window.setInterval(
            () => loadBackgroundRef.current?.(false),
            backgroundRefreshMinutes * 60 * 1000,
        )
        return () => window.clearInterval(intervalId)
    }, [showBackground, backgroundRefreshMinutes])

    function reloadBackground() {
        loadBackgroundRef.current?.(true)
    }

    useEffect(() => {
        return () => setFullscreen(false)
    }, [setFullscreen])

    useEffect(() => {
        if (!fullscreen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        function onKeyDown(event: KeyboardEvent) {
            if (propertiesOpenRef.current) return
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
                'relative flex min-h-0 flex-1 flex-col overflow-hidden',
                fullscreen && 'fixed inset-0 z-40 bg-background p-4 sm:p-6',
            )}
        >
            {backgroundUrl ? (
                <img
                    src={backgroundUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 size-full object-cover rounded-2xl"
                />
            ) : null}
            <h1 className="sr-only">Clock</h1>
            <div className="relative z-10 grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
                <ClockToolbar
                    propertiesOpen={propertiesOpen}
                    fullscreen={fullscreen}
                    elevated={backgroundUrl !== null}
                    onPropertiesOpen={() => setPropertiesOpen(true)}
                    onFullscreenChange={() => setFullscreen(!fullscreen)}
                />
                <div className="@container flex h-full min-h-0 w-full min-w-0 flex-col items-center">
                    <div className="clock-face-slot flex min-h-0 w-full flex-1 items-center justify-center">
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
                                className={cn(
                                    'flex max-h-full max-w-full items-baseline justify-center gap-[0.12em] px-2 text-center text-[clamp(4rem,14cqw,11rem)] leading-none font-medium tracking-tight text-foreground tabular-nums',
                                    backgroundUrl && 'rounded-[1.5rem] bg-background/80 px-[0.28em] py-[0.08em] shadow-lg backdrop-blur-md',
                                )}
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
                    {announcement.trim() ? (
                        <p
                            className={cn(
                                'max-w-3xl shrink-0 px-4 pt-4 pb-2 text-center text-[clamp(1.25rem,4cqw,2.25rem)] leading-snug font-medium text-balance whitespace-pre-wrap text-foreground',
                                backgroundUrl && 'rounded-2xl bg-background/80 shadow-lg backdrop-blur-md',
                            )}
                        >
                            {announcement}
                        </p>
                    ) : null}
                </div>
            </div>
            <ClockPropertiesDialog
                open={propertiesOpen}
                view={view}
                hourCycle={hourCycle}
                showSeconds={showSeconds}
                showBackground={showBackground}
                backgroundRefreshMinutes={backgroundRefreshMinutes}
                backgroundGrayscale={backgroundGrayscale}
                backgroundBlur={backgroundBlur}
                announcement={announcement}
                reloadingBackground={reloadingBackground}
                onOpenChange={setPropertiesOpen}
                onViewChange={setView}
                onHourCycleChange={setHourCycle}
                onShowSecondsChange={setShowSeconds}
                onShowBackgroundChange={setShowBackground}
                onBackgroundRefreshMinutesChange={setBackgroundRefreshMinutes}
                onBackgroundGrayscaleChange={setBackgroundGrayscale}
                onBackgroundBlurChange={setBackgroundBlur}
                onReloadBackground={reloadBackground}
                onAnnouncementChange={setAnnouncement}
            />
        </div>
    )
}
