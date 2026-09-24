'use client'

import dayjs from 'dayjs'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import jutge, { invalidateCachedCall } from '@/lib/jutge'
import type { CredentialsIn, Profile } from '@/lib/jutge_api_client'
import { profileToSessionUser, type SessionUser } from '@/lib/session'

export type AuthContextValue = {
    user: SessionUser | null
    profile: Profile | null
    loading: boolean
    login(credentials: CredentialsIn): Promise<{ ok: true; userName: string } | { ok: false; error: string }>
    logout(): Promise<void>
    /** Re-read student.profile.get after a write. router.refresh() does not rerun this client fetch. */
    refreshProfile(): Promise<void>
}

function warmAbstractProblemsCache() {
    void jutge.problems.getAllAbstractProblems().catch(() => {})
}

function restoreStorageItem(key: string, value: string | null) {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    profile: null,
    loading: true,
    login: async () => ({ ok: false, error: 'Auth not initialized' }),
    logout: async () => {},
    refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    const restoreSession = useCallback(async () => {
        try {
            const token = localStorage.getItem('token')
            const expiration = localStorage.getItem('expiration')
            if (!token || !expiration) return false

            const now = dayjs()
            const expirationDate = dayjs(expiration)
            if (now.isAfter(expirationDate)) return false

            jutge.meta = { token, user_uid: localStorage.getItem('user_uid') ?? '' }
            warmAbstractProblemsCache()
            const fetchedProfile = await jutge.student.profile.get()
            setProfile(fetchedProfile)
            setUser(profileToSessionUser(fetchedProfile))
            return true
        } catch {
            localStorage.removeItem('token')
            localStorage.removeItem('expiration')
            localStorage.removeItem('user_uid')
            jutge.meta = null
            return false
        }
    }, [])

    useEffect(() => {
        restoreSession().finally(() => setLoading(false))
    }, [restoreSession])

    async function login(credentialsIn: CredentialsIn) {
        const previousMeta = jutge.meta
        const previousToken = localStorage.getItem('token')
        const previousExpiration = localStorage.getItem('expiration')
        const previousUserUid = localStorage.getItem('user_uid')

        function restorePreviousSession() {
            jutge.meta = previousMeta
            restoreStorageItem('token', previousToken)
            restoreStorageItem('expiration', previousExpiration)
            restoreStorageItem('user_uid', previousUserUid)
        }

        try {
            const credentialsOut = await jutge.login(credentialsIn)
            if (!credentialsOut.token) {
                restorePreviousSession()
                return { ok: false as const, error: 'Sign in failed.' }
            }
            // Cache keys omit the user, so a previous session's responses must not be reused.
            jutge.clearCache()
            warmAbstractProblemsCache()
            const fetchedProfile = await jutge.student.profile.get()
            localStorage.setItem('token', credentialsOut.token)
            localStorage.setItem('expiration', credentialsOut.expiration.toString())
            localStorage.setItem('user_uid', fetchedProfile.user_uid)
            setProfile(fetchedProfile)
            setUser(profileToSessionUser(fetchedProfile))
            return { ok: true as const, userName: fetchedProfile.name }
        } catch (e) {
            restorePreviousSession()
            const message = e instanceof Error ? e.message : 'Sign in failed.'
            return { ok: false as const, error: message }
        }
    }

    const refreshProfile = useCallback(async () => {
        invalidateCachedCall('student.profile.get')
        const fetchedProfile = await jutge.student.profile.get()
        setProfile(fetchedProfile)
        setUser(profileToSessionUser(fetchedProfile))
    }, [])

    async function logout() {
        try {
            localStorage.removeItem('token')
            localStorage.removeItem('expiration')
            localStorage.removeItem('user_uid')
            setUser(null)
            setProfile(null)
            await jutge.logout()
        } catch {
            jutge.meta = null
        } finally {
            jutge.clearCache()
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
