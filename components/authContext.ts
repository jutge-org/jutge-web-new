'use client'

import { createContext } from 'react'

import type { CredentialsIn, Profile } from '@/lib/jutge_api_client'
import type { SessionUser } from '@/lib/session'

export type AuthContextValue = {
    user: SessionUser | null
    profile: Profile | null
    loading: boolean
    login(credentials: CredentialsIn): Promise<{ ok: true; userName: string } | { ok: false; error: string }>
    logout(): Promise<void>
    /** Re-read student.profile.get after a write. router.refresh() does not rerun this client fetch. */
    refreshProfile(): Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    profile: null,
    loading: true,
    login: async () => ({ ok: false, error: 'Auth not initialized' }),
    logout: async () => {},
    refreshProfile: async () => {},
})
