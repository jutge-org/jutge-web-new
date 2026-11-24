'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/** Shared tick interval so header arcade clock and exam info stay in sync. */
const LIVE_WALL_CLOCK_TICK_MS = 100

const LiveWallClockContext = createContext<number>(0)

/** Shown for live clock fields until the client wall clock has mounted. */
export const LIVE_WALL_CLOCK_PLACEHOLDER = '--:--:--'

function msUntilNextTick(): number {
    const remainder = Date.now() % LIVE_WALL_CLOCK_TICK_MS
    return remainder === 0 ? LIVE_WALL_CLOCK_TICK_MS : LIVE_WALL_CLOCK_TICK_MS - remainder
}

export function LiveWallClockProvider({ children }: { children: ReactNode }) {
    /** 0 until mount — avoids SSR/client `Date.now()` mismatches. */
    const [now, setNow] = useState(0)

    useEffect(() => {
        setNow(Date.now())
        let intervalId = 0
        const timeoutId = window.setTimeout(() => {
            setNow(Date.now())
            intervalId = window.setInterval(() => setNow(Date.now()), LIVE_WALL_CLOCK_TICK_MS)
        }, msUntilNextTick())
        return () => {
            window.clearTimeout(timeoutId)
            if (intervalId) window.clearInterval(intervalId)
        }
    }, [])

    return <LiveWallClockContext.Provider value={now}>{children}</LiveWallClockContext.Provider>
}

export function useLiveWallClockMs(): number {
    return useContext(LiveWallClockContext)
}

export function useLiveWallClockReady(): boolean {
    return useLiveWallClockMs() > 0
}