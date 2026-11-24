'use client'

import { useRouter } from 'next/navigation'
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
    finishLiveExam,
    isLiveAuthFailure,
    liveErrorMessage,
    probeLiveRole,
    type LiveTutorStatus,
} from '@/lib/data/liveExam'
import type { CredentialsOut, Profile, ReadyExam, RunningExam } from '@/lib/jutge_api_client'
import { profileToSessionUser } from '@/lib/session'
import { closeExamFloatingWidget } from '@/lib/openExamFloatingWidget'
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
    name: string | null
    instructor: boolean
    administrator: boolean
    readyExams: ReadyExam[] | null
    exam: RunningExam | null
    examKey: string | null
    tutorStatus: LiveTutorStatus | null
    error: string | null
    refresh(): Promise<void>
    continueSignIn(credentials: { email: string; password: string }, contest: boolean): Promise<ContinueSignInResult>
    reloadReadyExams(contest: boolean): Promise<ContinueSignInResult>
    enterExam(input: { exam: string; exam_password: string }): Promise<SignInResult>
    cancelPreExam(): void
    logout(): Promise<void>
    finishExamAndSignOut(): Promise<void>
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
    localStorage.removeItem(LIVE_SESSION_STORAGE.examKey)
}

function persistSignedInExam(credentials: CredentialsOut, email: string, examKey: string) {
    localStorage.setItem(LIVE_SESSION_STORAGE.token, credentials.token)
    localStorage.setItem(LIVE_SESSION_STORAGE.expiration, String(credentials.expiration))
    localStorage.setItem(LIVE_SESSION_STORAGE.userUid, credentials.user_uid)
    localStorage.setItem(LIVE_SESSION_STORAGE.email, email)
    localStorage.setItem(LIVE_SESSION_STORAGE.examKey, examKey)
}

export function LiveSessionProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const site = useSiteMode()
    const [loading, setLoading] = useState(true)
    const [phase, setPhase] = useState<LiveAuthPhase>('signed-out')
    const [role, setRole] = useState<LiveRole | null>(null)
    const [email, setEmail] = useState<string | null>(null)
    const [name, setName] = useState<string | null>(null)
    const [instructor, setInstructor] = useState(false)
    const [administrator, setAdministrator] = useState(false)
    const [readyExams, setReadyExams] = useState<ReadyExam[] | null>(null)
    const [exam, setExam] = useState<RunningExam | null>(null)
    const [examKey, setExamKey] = useState<string | null>(() =>
        typeof window !== 'undefined' ? localStorage.getItem(LIVE_SESSION_STORAGE.examKey) : null,
    )
    const [tutorStatus, setTutorStatus] = useState<LiveTutorStatus | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [error, setError] = useState<string | null>(null)

    const preExamCredentialsRef = useRef<{ email: string; password: string } | null>(null)

    useEffect(() => {
        applyLiveApiClient(jutge, site)
    }, [site])

    const clearLiveRoleState = useCallback(() => {
        setRole(null)
        setExam(null)
        setExamKey(null)
        setTutorStatus(null)
        setProfile(null)
    }, [])

    const clearPreExam = useCallback(() => {
        preExamCredentialsRef.current = null
        setReadyExams(null)
        setName(null)
        setInstructor(false)
        setAdministrator(false)
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
                setName(null)
                setInstructor(false)
                setAdministrator(false)
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
                if (cancelled) return
                setProfile(await jutge.student.profile.get())
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
                const {
                    exams: ready,
                    name: userName,
                    instructor: isInstructor,
                    administrator: isAdministrator,
                } = await fetchReadyExamsUnauthenticated(trimmedEmail, credentials.password)
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
                setName(userName.trim() || null)
                setInstructor(isInstructor)
                setAdministrator(isAdministrator)
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
                persistSignedInExam(credentials, cached.email, input.exam)
                setExamKey(input.exam.trim() || null)
                setEmail(cached.email)
                await applyProbe()
                setProfile(await jutge.student.profile.get())
                return { ok: true }
            } catch (loginError) {
                jutge.meta = null
                clearLiveRoleState()
                return { ok: false, error: liveErrorMessage(loginError, 'Sign in failed.') }
            }
        },
        [applyProbe, clearLiveRoleState],
    )

    const cancelPreExam = useCallback(() => {
        clearPreExam()
        setError(null)
    }, [clearPreExam])

    const logout = useCallback(async () => {
        const token = jutge.meta?.token
        const userUid = jutge.meta?.user_uid ?? ''

        closeExamFloatingWidget()
        clearStoredSession()
        jutge.meta = null
        jutge.clearCache()
        clearLiveRoleState()
        setEmail(null)
        setName(null)
        clearPreExam()
        setError(null)

        try {
            if (token) {
                jutge.meta = { token, user_uid: userUid }
                await jutge.logout()
            }
        } catch {
            jutge.meta = null
        } finally {
            jutge.meta = null
            router.replace('/')
        }
    }, [clearLiveRoleState, clearPreExam, router])

    const finishExamAndSignOut = useCallback(async () => {
        await finishLiveExam()
        await logout()
    }, [logout])

    const value = useMemo<LiveSessionValue>(
        () => ({
            loading,
            phase,
            authenticated: role !== null,
            role,
            email,
            name,
            instructor,
            administrator,
            readyExams,
            exam,
            examKey,
            tutorStatus,
            error,
            refresh,
            continueSignIn,
            reloadReadyExams,
            enterExam,
            cancelPreExam,
            logout,
            finishExamAndSignOut,
        }),
        [
            loading,
            phase,
            role,
            email,
            name,
            instructor,
            administrator,
            readyExams,
            exam,
            examKey,
            tutorStatus,
            error,
            refresh,
            continueSignIn,
            reloadReadyExams,
            enterExam,
            cancelPreExam,
            logout,
            finishExamAndSignOut,
        ],
    )

    const refreshProfile = useCallback(async () => {
        const fetched = await jutge.student.profile.get()
        setProfile(fetched)
    }, [])

    const authValue = useMemo(
        () => ({
            user: profile ? profileToSessionUser(profile) : null,
            profile,
            loading,
            login: async () => ({ ok: false as const, error: 'Sign in from the exam or contest home page.' }),
            logout,
            refreshProfile,
        }),
        [loading, logout, profile, refreshProfile],
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