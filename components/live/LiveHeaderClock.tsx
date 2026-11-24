'use client'

import { ClockIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
    headerToolbarIconButtonClassName,
    headerToolbarOutlineButtonClassName,
} from '@/components/layout/headerToolbarClasses'
import ArcadePixel from '@/components/smoothui/arcade-pixel'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ClockDisplayMode = 'seconds' | 'minutes' | 'icon'

function pad2(value: number): string {
    return String(value).padStart(2, '0')
}

function formatWallTime(date: Date, mode: Exclude<ClockDisplayMode, 'icon'>): string {
    const hours = pad2(date.getHours())
    const minutes = pad2(date.getMinutes())
    if (mode === 'minutes') return `${hours}:${minutes}`
    return `${hours}:${minutes}:${pad2(date.getSeconds())}`
}

function nextDisplayMode(mode: ClockDisplayMode): ClockDisplayMode {
    if (mode === 'seconds') return 'minutes'
    if (mode === 'minutes') return 'icon'
    return 'seconds'
}

const ARCADE_PIXEL_SIZE = 1.5
const ARCADE_GAP = 0.5

export function LiveHeaderClock() {
    const [displayMode, setDisplayMode] = useState<ClockDisplayMode>('seconds')
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        if (displayMode === 'icon') return
        setNow(new Date())
        const id = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(id)
    }, [displayMode])

    const timeLabel =
        displayMode === 'icon' ? 'Clock hidden' : formatWallTime(now, displayMode)

    const tooltip =
        displayMode === 'seconds'
            ? `${timeLabel} — click for hours and minutes`
            : displayMode === 'minutes'
                ? `${timeLabel} — click to collapse`
                : 'Show clock with seconds'

    function handleClick() {
        setDisplayMode((current) => nextDisplayMode(current))
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {displayMode === 'icon' ? (
                        <SmoothButton
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className={headerToolbarIconButtonClassName}
                            aria-label="Show clock"
                            onClick={handleClick}
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
                            aria-label={`Current time ${timeLabel}. Click to change display.`}
                            onClick={handleClick}
                        >
                            <ArcadePixel
                                animate="none"
                                text={timeLabel}
                                pixelSize={ARCADE_PIXEL_SIZE}
                                gap={ARCADE_GAP}
                                glow={0.15}
                                className="translate-y-px"
                            />
                        </SmoothButton>
                    )}
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}