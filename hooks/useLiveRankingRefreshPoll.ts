'use client'

import { useEffect, useRef } from 'react'

/** Polls every second; refreshes when tick count is divisible by `speed` (seconds). `0` pauses. */
export function useLiveRankingRefreshPoll(
    enabled: boolean,
    speed: string,
    onRefresh: () => void | Promise<void>,
): void {
    const pollTickRef = useRef(0)

    useEffect(() => {
        if (!enabled) return

        const interval = window.setInterval(() => {
            pollTickRef.current += 1
            const ispeed = parseInt(speed, 10)
            if (ispeed === 0) return
            if (pollTickRef.current % ispeed !== 0) return
            void onRefresh()
        }, 1000)

        return () => window.clearInterval(interval)
    }, [enabled, speed, onRefresh])
}