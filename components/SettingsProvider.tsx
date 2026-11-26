'use client'

import { useAuth } from '@/components/AuthProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { supportsStudentSettingsApi } from '@/lib/siteMode'
import {
    hydrateLocalOpenWebSettings,
    hydrateOpenWebSettingsFromApi,
    resetOpenWebSettingsPersistence,
    teardownOpenWebSettingsPersistence,
} from '@/lib/settingsPersistence'
import { syncReducedMotionDataset } from '@/lib/reducedMotion'
import { useOpenWebSettingsStore } from '@/store/openWebSettings'
import { useTheme } from 'next-themes'
import { useEffect, useRef, type ReactNode } from 'react'

function syncLayoutWidthDataset(layoutWidth: string) {
    document.documentElement.dataset.layoutWidth = layoutWidth
}

type SettingsProviderProps = {
    children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const { user, loading } = useAuth()
    const site = useSiteMode()
    const settingsViaApi = supportsStudentSettingsApi(site.kind)
    const { setTheme } = useTheme()
    const setThemeRef = useRef(setTheme)
    const previousUserIdRef = useRef<string | null>(null)
    const initializedRef = useRef(false)

    const ready = useOpenWebSettingsStore((state) => state.ready)
    const appearance = useOpenWebSettingsStore((state) => state.settings.appearance)

    setThemeRef.current = setTheme

    useEffect(() => {
        if (loading) {
            return
        }

        const currentUserId = user?.id ?? null
        const previousUserId = previousUserIdRef.current

        const hydrateForUser = () => {
            if (currentUserId && settingsViaApi) {
                void hydrateOpenWebSettingsFromApi()
            } else {
                hydrateLocalOpenWebSettings()
            }
        }

        if (!initializedRef.current) {
            initializedRef.current = true
            if (currentUserId) {
                hydrateForUser()
            } else {
                hydrateLocalOpenWebSettings()
            }
            previousUserIdRef.current = currentUserId
            return
        }

        if (currentUserId === previousUserId) {
            return
        }

        if (currentUserId) {
            hydrateForUser()
        } else {
            resetOpenWebSettingsPersistence()
            hydrateLocalOpenWebSettings()
        }

        previousUserIdRef.current = currentUserId
    }, [loading, settingsViaApi, user?.id])

    useEffect(() => {
        return () => {
            teardownOpenWebSettingsPersistence()
        }
    }, [])

    // Keep next-themes in sync with our settings store. Do not depend on
    // `setTheme` — next-themes recreates it on every theme change, which would
    // re-run this effect and fight in-flight theme updates.
    useEffect(() => {
        if (!ready) {
            return
        }

        setThemeRef.current(appearance.theme)
        syncLayoutWidthDataset(appearance.layoutWidth)
        syncReducedMotionDataset(appearance.reducedMotion)
    }, [appearance.layoutWidth, appearance.reducedMotion, appearance.theme, ready])

    return children
}
