'use client'

import { PageSpinner } from '@/components/ClientGates'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import ReactClock from 'react-clock'
import 'react-clock/dist/Clock.css'
import '@/components/utilities/analogClock.css'

function useSyncedNow(): Date | null {
    const [now, setNow] = useState<Date | null>(null)

    useEffect(() => {
        let timeoutId = 0

        function tick() {
            setNow(new Date())
            timeoutId = window.setTimeout(tick, 1000 - (Date.now() % 1000))
        }

        function onVisibilityChange() {
            if (document.visibilityState === 'visible') setNow(new Date())
        }

        tick()
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => {
            window.clearTimeout(timeoutId)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [])

    return now
}

type CompactClockProps = {
    size?: number
    className?: string
}

/** Analog clock face without controls — for compact embeds such as the exam floating widget. */
export function CompactClock({ size = 160, className }: CompactClockProps) {
    const now = useSyncedNow()

    return (
        <div
            className={cn('flex items-center justify-center', className)}
            style={now ? undefined : { width: size, height: size }}
        >
            {!now ? (
                <PageSpinner />
            ) : (
            <ReactClock
                className="analog-clock"
                value={now}
                size={size}
                renderSecondHand
                hourHandLength={60}
                hourHandOppositeLength={20}
                hourHandWidth={8}
                hourMarksLength={20}
                hourMarksWidth={8}
                minuteHandLength={90}
                minuteHandOppositeLength={20}
                minuteHandWidth={6}
                minuteMarksWidth={3}
                secondHandLength={88}
                secondHandOppositeLength={25}
                secondHandWidth={4}
            />
            )}
        </div>
    )
}