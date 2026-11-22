'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { AuthContext } from '@/components/authContext'
import jutge from '@/lib/jutge'
import {
    isLiveAuthFailure,
    liveErrorMessage,
    probeLiveRole,
    type LiveTutorStatus,
} from '@/lib/data/liveExam'
import type { RunningExam } from '@/lib/jutge_api_client'

const LIVE_EMAIL_KEY = 'live_email'

export type LiveRole = 'student' | 'tutor'

export type LiveSessionValue = {
    loading: boolean
    authenticated: boolean
    role: LiveRole | null
    email: string | null
    exam: RunningExam | null
    tutorStatus: LiveTutorStatus | null
    error: string | null
    refresh(): Promise<void>
    login(input: {
        email: string
        password: string
        exam: string
        exam_password: string
    }): Promise<{ ok: true } | { ok: false; error: string }>
    logout(): Promise<void>
}

const LiveSessionContext = createContext<LiveSessionValue | null>(null)

function readStoredSession(): { token: string; userUid: string; email: string | null } | null {
    const token = localStorage.getItem('token')
    if (!token) return null
    return {
        token,
        userUid: localStorage.getItem('user_uid') ?? '',
        email: localStorage.getItem(LIVE_EMAIL_KEY),
    }
}

function clearStoredSession() {
    localStorage.removeItem('token')
    localStorage.removeItem('expiration')
    localStorage.removeItem('user_uid')
    localStorage.removeItem(LIVE_EMAIL_KEY)
}

export function LiveSessionProvider({ children }: { children: ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState<LiveRole | null>(null)
    const [email, setEmail] = useState<string | null>(null)
    const [exam, setExam] = useState<RunningExam | null>(null)
    const [tutorStatus, setTutorStatus] = useState<LiveTutorStatus | null>(null)
    const [error, setError] = useState<string | null>(null)

    const applyProbe = useCallback(async () => {
        const probed = await probeLiveRole()
        if (probed.role === 'tutor') {
            setRole('tutor')
            setTutorStatus(probed.status)
            setExam(null)
        } else {
            setRole('student')
            setExam(probed.exam)
            setTutorStatus(null)
        }
        setError(null)
    }, [])

    const refresh = useCallback(async () => {
        if (!jutge.meta?.token) return
        try {
            await applyProbe()
        } catch (probeError) {
            if (isLiveAuthFailure(probeError)) {
                clearStoredSession()
                jutge.meta = null
                setRole(null)
                setExam(null)
                setTutorStatus(null)
                setEmail(null)
            }
            setError(liveErrorMessage(probeError, 'Could not refresh the session.'))
        }
    }, [applyProbe])

    useEffect(() => {
        let cancelled = false
        async function restore() {
            try {
                const stored = readStoredSession()
                if (!stored) return
                jutge.meta = { token: stored.token, user_uid: stored.userUid }
                if (!cancelled) setEmail(stored.email)
                await applyProbe()
            } catch (probeError) {
                if (cancelled) return
                clearStoredSession()
                jutge.meta = null
                setRole(null)
                setExam(null)
                setTutorStatus(null)
                setError(
                    isLiveAuthFailure(probeError)
                        ? null
                        : liveErrorMessage(probeError, 'Could not restore the session.'),
                )
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        void restore()
        return () => {
            cancelled = true
        }
    }, [applyProbe])

    const login = useCallback(
        async (input: { email: string; password: string; exam: string; exam_password: string }) => {
            try {
                const credentials = await jutge.loginExam(input)
                if (!credentials.token) {
                    jutge.meta = null
                    return { ok: false as const, error: 'Sign in failed.' }
                }
                jutge.clearCache()
                localStorage.setItem('token', credentials.token)
                localStorage.setItem('expiration', String(credentials.expiration))
                localStorage.setItem('user_uid', credentials.user_uid)
                localStorage.setItem(LIVE_EMAIL_KEY, input.email.trim())
                setEmail(input.email.trim())
                await applyProbe()
                return { ok: true as const }
            } catch (loginError) {
                jutge.meta = null
                clearStoredSession()
                setRole(null)
                setExam(null)
                setTutorStatus(null)
                return { ok: false as const, error: liveErrorMessage(loginError, 'Sign in failed.') }
            }
        },
        [applyProbe],
    )

    const logout = useCallback(async () => {
        try {
            if (jutge.meta?.token) await jutge.logout()
        } catch {
            jutge.meta = null
        } finally {
            clearStoredSession()
            jutge.meta = null
            jutge.clearCache()
            setRole(null)
            setEmail(null)
            setExam(null)
            setTutorStatus(null)
            setError(null)
        }
    }, [])

    const value = useMemo<LiveSessionValue>(
        () => ({
            loading,
            authenticated: role !== null,
            role,
            email,
            exam,
            tutorStatus,
            error,
            refresh,
            login,
            logout,
        }),
        [loading, role, email, exam, tutorStatus, error, refresh, login, logout],
    )

    const authValue = useMemo(
        () => ({
            user: null,
            profile: null,
            loading,
            login: async () => ({ ok: false as const, error: 'Sign in from the exam or contest home page.' }),
            logout,
            refreshProfile: async () => {},
        }),
        [loading, logout],
    )

    return (
        <AuthContext.Provider value={authValue}>
            <LiveSessionContext.Provider value={value}>{children}</LiveSessionContext.Provider>
        </AuthContext.Provider>
    )
}

export function useLiveSession(): LiveSessionValue {
    const value = useContext(LiveSessionContext)
    if (!value) {
        throw new Error('useLiveSession must be used inside LiveSessionProvider')
    }
    return value
}
