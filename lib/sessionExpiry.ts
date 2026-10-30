import dayjs from 'dayjs'

export const SESSION_EXPIRED_EVENT = 'jutge:session-expired'

let sessionExpiredDispatched = false

export function isStoredSessionExpired(): boolean {
    if (typeof window === 'undefined') return false
    const expiration = localStorage.getItem('expiration')
    if (!expiration) return false
    return dayjs().isAfter(dayjs(expiration))
}

export function dispatchSessionExpired(): void {
    if (typeof window === 'undefined') return
    if (sessionExpiredDispatched) return
    sessionExpiredDispatched = true
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}
