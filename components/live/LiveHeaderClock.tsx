'use client'

import { ClockIcon } from 'lucide-react'
import { useState } from 'react'

import { LIVE_WALL_CLOCK_PLACEHOLDER, useLiveWallClockMs } from '@/hooks/use-live-wall-clock'

import {
    headerToolbarIconButtonClassName,
    headerToolbarOutlineButtonClassName,
} from '@/components/layout/headerToolbarClasses'
import { SmoothDropdownMenuContent } from '@/components/smoothui/dropdown-menu/animated-content'
import ArcadePixel from '@/components/smoothui/arcade-pixel'
import SmoothButton from '@/components/smoothui/smooth-button'
import {
    DropdownMenu,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ClockDisplayMode = 'seconds' | 'minutes' | 'icon'
type ClockColor = 'blue' | 'green' | 'red' | 'white' | 'black'

const CLOCK_PHOSPHOR: Record<ClockColor, string> = {
    blue: 'var(--color-brand)',
    green: 'oklch(0.72 0.19 145)',
    red: 'oklch(0.63 0.24 25)',
    white: 'white',
    black: 'black',
}

function pad2(value: number): string {
    return String(value).padStart(2, '0')
}

function formatWallTime(date: Date, mode: Exclude<ClockDisplayMode, 'icon'>): string {
    const hours = pad2(date.getHours())
    const minutes = pad2(date.getMinutes())
    if (mode === 'minutes') return `${hours}:${minutes}`
    return `${hours}:${minutes}:${pad2(date.getSeconds())}`
}

/** Stable SSR / pre-mount label so server HTML matches the first client paint. */
function placeholderWallTime(mode: Exclude<ClockDisplayMode, 'icon'>): string {
    return mode === 'minutes' ? LIVE_WALL_CLOCK_PLACEHOLDER.slice(0, 5) : LIVE_WALL_CLOCK_PLACEHOLDER
}

const ARCADE_PIXEL_SIZE = 1.5
const ARCADE_GAP = 0.5

export function LiveHeaderClock() {
    const [displayMode, setDisplayMode] = useState<ClockDisplayMode>('seconds')
    const [color, setColor] = useState<ClockColor>('blue')
    const nowMs = useLiveWallClockMs()
    const clockReady = nowMs > 0
    const now = clockReady ? new Date(nowMs) : null

    const timeLabel =
        displayMode === 'icon'
            ? 'Clock hidden'
            : now
                ? formatWallTime(now, displayMode)
                : placeholderWallTime(displayMode)

    const phosphor = CLOCK_PHOSPHOR[color]
    const arcadePalette = ['transparent', phosphor] as const

    const tooltip =
        displayMode === 'icon'
            ? 'Clock hidden — open settings'
            : `${timeLabel} — open clock settings`

    return (
        <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            {displayMode === 'icon' ? (
                                <SmoothButton
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    className={headerToolbarIconButtonClassName}
                                    aria-label="Clock settings"
                                >
                                    <ClockIcon aria-hidden />
                                </SmoothButton>
                            ) : (
                                <SmoothButton
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        headerToolbarOutlineButtonClassName,
                                        'h-8 px-1.5 py-0',
                                    )}
                                    aria-label={`Current time ${timeLabel}. Open clock settings.`}
                                >
                                    <ArcadePixel
                                        animate="none"
                                        text={timeLabel}
                                        pixelSize={ARCADE_PIXEL_SIZE}
                                        gap={ARCADE_GAP}
                                        glow={0.15}
                                        palette={[...arcadePalette]}
                                        className="translate-y-px"
                                    />
                                </SmoothButton>
                            )}
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{tooltip}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <SmoothDropdownMenuContent
                align="end"
                className="w-64 **:data-[slot=dropdown-menu-item]:py-1.5 **:data-[slot=dropdown-menu-item]:text-base"
            >
                <DropdownMenuLabel>Format</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={displayMode}
                    onValueChange={(value) => setDisplayMode(value as ClockDisplayMode)}
                >
                    <DropdownMenuRadioItem value="seconds">hh:mm:ss</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="minutes">hh:mm</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="icon">Icon</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Color</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={color}
                    onValueChange={(value) => setColor(value as ClockColor)}
                >
                    <DropdownMenuRadioItem value="blue">Blue</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="green">Green</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="red">Red</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="white">White</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="black">Black</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </SmoothDropdownMenuContent>
        </DropdownMenu>
    )
}