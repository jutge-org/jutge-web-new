'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { SiteResolution } from '@/lib/siteMode'

const NORMAL_SITE: SiteResolution = { kind: 'normal', apiUrl: null }

const SiteModeContext = createContext<SiteResolution>(NORMAL_SITE)

export function SiteModeProvider({ value, children }: { value: SiteResolution; children: ReactNode }) {
    return <SiteModeContext.Provider value={value}>{children}</SiteModeContext.Provider>
}

export function useSiteMode(): SiteResolution {
    return useContext(SiteModeContext)
}
