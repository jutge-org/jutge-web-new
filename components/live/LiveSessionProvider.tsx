'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

import { AuthContext } from '@/components/authContext'
import { useSiteMode } from '@/components/SiteModeProvider'
import jutge from '@/lib/jutge'
import {
    fetchReadyExamsUnauthenticated,
    LIVE_SESSION_STORAGE,
    loginLiveExam,
    validateLiveSessionToken,
    type LiveAuthPhase,
} from '@/lib/data/liveAuth'
import {
    filterReadyExams,
    isLiveAuthFailure,
    liveErrorMessage,
    probeLiveRole,
    type LiveTutorStatus,
} from '@/lib/data/liveExam'
import type { CredentialsOut, ReadyExam, RunningExam } from '@/lib/jutge_api_client'
import { applyLiveApiClient } from '@/lib/siteMode'

export type LiveRole = 'student' | 'tutor'

type SignInResult = { ok: true } | { ok: false; error: string }

type ContinueSignInResult = { ok: true; exams: ReadyExam[] } | { ok: false; error: string }

export type LiveSessionValue = {
    loading: boolean
    phase: LiveAuthPhase
    authenticated: boolean
    role: LiveRole | null
    email: string | null
    readyExams: ReadyExam[] | null
    exam: RunningExam | null
    tutorStatus: LiveTutorStatus | null
    error: string | null
    refresh(): Promise<void>
    continueSignIn(credentials: { email: string; password: string }, contest: boolean): Promise<ContinueSignInResult>
    reloadReadyExams(contest: boolean): Promise<ContinueSignInResult>
    enterExam(input: { exam: string; exam_password: string }): Promise<SignInResult>
    cancelPreExam(): void
    logout(): Promise<void>
}

const LiveSessionContext = createContext<LiveSessionValue | null>(null)

function readStoredSession(): { token: string; userUid: string; email: string | null } | null {
    const token = localStorage.getItem(LIVE_SESSION_STORAGE.token)
    if (!token) return null
    return {
        token,
        userUid: localStorage.getItem(LIVE_SESSION_STORAGE.userUid) ?? '',
        email: localStorage.getItem(LIVE_SESSION_STORAGE.email),
    }
}

function clearStoredSession() {
    localStorage.removeItem(LIVE_SESSION_STORAGE.token)
    localStorage.removeItem(LIVE_SESSION_STORAGE.expiration)
    localStorage.removeItem(LIVE_SESSION_STORAGE.userUid)
    localStorage.removeItem(LIVE_SESSION_STORAGE.email)
}

function persistSignedInExam(credentials: CredentialsOut, email: string) {
    localStorage.setItem(LIVE_SESSION_STORAGE.token, credentials.token)
    localStorage.setItem(LIVE_SESSION_STORAGE.expiration, String(credentials.expiration))
    localStorage.setItem(LIVE_SESSION_STORAGE.userUid, credentials.user_uid)
    localStorage.setItem(LIVE_SESSION_STORAGE.email, email)
}

export function LiveSessionProvider({ children }: { children: ReactNode }) {
    const site = useSiteMode()
    const [loading, setLoading] = useState(true)
    const [phase, setPhase] = useState<LiveAuthPhase>('signed-out')
    const [role, setRole] = useState<LiveRole | null>(null)
    const [email, setEmail] = useState<string | null>(null)
    const [readyExams, setReadyExams] = useState<ReadyExam[] | null>(null)
    const [exam, setExam] = useState<RunningExam | null>(null)
    const [tutorStatus, setTutorStatus] = useState<LiveTutorStatus | null>(null)
    const [error, setError] = useState<string | null>(null)

    const preExamCredentialsRef = useRef<{ email: string; password: string } | null>(null)

    useEffect(() => {
        applyLiveApiClient(jutge, site)
    }, [site])

    const clearLiveRoleState = useCallback(() => {
        setRole(null)
        setExam(null)
        setTutorStatus(null)
    }, [])

    const clearPreExam = useCallback(() => {
        preExamCredentialsRef.current = null
        setReadyExams(null)
        setPhase('signed-out')
    }, [])

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
        setPhase('signed-in-exam')
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
                clearLiveRoleState()
                setEmail(null)
                clearPreExam()
            }
            setError(liveErrorMessage(probeError, 'Could not refresh the session.'))
        }
    }, [applyProbe, clearLiveRoleState, clearPreExam])

    useEffect(() => {
        let cancelled = false
        async function restore() {
            try {
                const stored = readStoredSession()
                if (!stored) {
                    setPhase('signed-out')
                    return
                }
                jutge.meta = { token: stored.token, user_uid: stored.userUid }
                if (!cancelled) setEmail(stored.email)
                await validateLiveSessionToken()
                await applyProbe()
            } catch (probeError) {
                if (cancelled) return
                clearStoredSession()
                jutge.meta = null
                clearLiveRoleState()
                setEmail(null)
                setPhase('signed-out')
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
    }, [applyProbe, clearLiveRoleState])

    const continueSignIn = useCallback(
        async (
            credentials: { email: string; password: string },
            contest: boolean,
        ): Promise<ContinueSignInResult> => {
            const trimmedEmail = credentials.email.trim()
            try {
                const ready = await fetchReadyExamsUnauthenticated(trimmedEmail, credentials.password)
                const filtered = filterReadyExams(ready, contest)
                if (filtered.length === 0) {
                    return {
                        ok: false,
                        error: contest
                            ? 'No contest is ready for this account.'
                            : 'No exam is ready for this account.',
                    }
                }
                preExamCredentialsRef.current = { email: trimmedEmail, password: credentials.password }
                setEmail(trimmedEmail)
                setReadyExams(filtered)
                setPhase('pre-exam')
                setError(null)
                return { ok: true, exams: filtered }
            } catch (loadError) {
                return { ok: false, error: liveErrorMessage(loadError, 'Could not look up exams.') }
            }
        },
        [],
    )

    const reloadReadyExams = useCallback(
        async (contest: boolean): Promise<ContinueSignInResult> => {
            const cached = preExamCredentialsRef.current
            if (!cached) {
                return { ok: false, error: 'Sign in again to reload the list.' }
            }
            return continueSignIn(cached, contest)
        },
        [continueSignIn],
    )

    const enterExam = useCallback(
        async (input: { exam: string; exam_password: string }): Promise<SignInResult> => {
            const cached = preExamCredentialsRef.current
            if (!cached) {
                return { ok: false, error: 'Sign in again before entering the exam.' }
            }
            try {
                const credentials = await loginLiveExam({
                    email: cached.email,
                    password: cached.password,
                    exam: input.exam,
                    exam_password: input.exam_password,
                })
                preExamCredentialsRef.current = null
                setReadyExams(null)
                jutge.clearCache()
                persistSignedInExam(credentials, cached.email)
                setEmail(cached.email)
                await applyProbe()
                return { ok: true }
            } catch (loginError) {
                jutge.meta = null
                return { ok: false, error: liveErrorMessage(loginError, 'Sign in failed.') }
            }
        },
        [applyProbe],
    )

    const cancelPreExam = useCallback(() => {
        clearPreExam()
        setError(null)
    }, [clearPreExam])

    const logout = useCallback(async () => {
        try {
            if (jutge.meta?.token) await jutge.logout()
        } catch {
            jutge.meta = null
        } finally {
            clearStoredSession()
            jutge.meta = null
            jutge.clearCache()
            clearLiveRoleState()
            setEmail(null)
            clearPreExam()
            setError(null)
        }
    }, [clearLiveRoleState, clearPreExam])

    const value = useMemo<LiveSessionValue>(
        () => ({
            loading,
            phase,
            authenticated: role !== null,
            role,
            email,
            readyExams,
            exam,
            tutorStatus,
            error,
            refresh,
            continueSignIn,
            reloadReadyExams,
            enterExam,
            cancelPreExam,
            logout,
        }),
        [
            loading,
            phase,
            role,
            email,
            readyExams,
            exam,
            tutorStatus,
            error,
            refresh,
            continueSignIn,
            reloadReadyExams,
            enterExam,
            cancelPreExam,
            logout,
        ],
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