'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { resolveSiteMode, type SiteResolution } from '@/lib/siteMode'

const NORMAL_SITE: SiteResolution = { kind: 'normal', apiUrl: null }

const SiteModeContext = createContext<SiteResolution>(NORMAL_SITE)

export function SiteModeProvider({ value, children }: { value: SiteResolution; children: ReactNode }) {
    const [site, setSite] = useState(value)

    // Match the API client (`lib/jutge.ts`): hostname is authoritative in the browser.
    useEffect(() => {
        setSite(resolveSiteMode(window.location.hostname))
    }, [value])

    return <SiteModeContext.Provider value={site}>{children}</SiteModeContext.Provider>
}

export function useSiteMode(): SiteResolution {
    return useContext(SiteModeContext)
}
