export const LIVE_RANKING_REFRESH_SPEED_STORAGE_KEY = 'jutge:live-ranking-refresh-speed'

export const LIVE_RANKING_REFRESH_SPEEDS = ['30', '10', '0'] as const

export type LiveRankingRefreshSpeed = (typeof LIVE_RANKING_REFRESH_SPEEDS)[number]

export function parseLiveRankingRefreshSpeed(value: string | null | undefined): LiveRankingRefreshSpeed {
    if (value === '10' || value === '0' || value === '30') return value
    return '30'
}

export function readLiveRankingRefreshSpeed(): LiveRankingRefreshSpeed {
    if (typeof window === 'undefined') return '30'
    return parseLiveRankingRefreshSpeed(localStorage.getItem(LIVE_RANKING_REFRESH_SPEED_STORAGE_KEY))
}

export function writeLiveRankingRefreshSpeed(speed: LiveRankingRefreshSpeed): void {
    try {
        localStorage.setItem(LIVE_RANKING_REFRESH_SPEED_STORAGE_KEY, speed)
    } catch {
        // ignore quota / private mode
    }
}