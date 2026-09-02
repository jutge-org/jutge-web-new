'use client'

import dayjs from 'dayjs'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import jutge from '@/lib/jutge'
import type { CredentialsIn, Profile } from '@/lib/jutge_api_client'
import { profileToSessionUser, type SessionUser } from '@/lib/session'

export type AuthContextValue = {
    user: SessionUser | null
    profile: Profile | null
    loading: boolean
    login(credentials: CredentialsIn): Promise<{ ok: true; userName: string } | { ok: false; error: string }>
    logout(): Promise<void>
}

function warmAbstractProblemsCache() {
    void jutge.problems.getAllAbstractProblems().catch(() => {})
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    profile: null,
    loading: true,
    login: async () => ({ ok: false, error: 'Auth not initialized' }),
    logout: async () => {},
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
        try {
            const credentialsOut = await jutge.login(credentialsIn)
            if (!jutge.meta?.token) {
                return { ok: false as const, error: 'Sign in failed.' }
            }
            warmAbstractProblemsCache()
            const fetchedProfile = await jutge.student.profile.get()
            setProfile(fetchedProfile)
            setUser(profileToSessionUser(fetchedProfile))
            localStorage.setItem('token', credentialsOut.token)
            localStorage.setItem('expiration', credentialsOut.expiration.toString())
            localStorage.setItem('user_uid', fetchedProfile.user_uid)
            return { ok: true as const, userName: fetchedProfile.name }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Sign in failed.'
            return { ok: false as const, error: message }
        }
    }

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
        }
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
