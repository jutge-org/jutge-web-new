import type { ReactNode } from 'react'
import { create } from 'zustand'

/** One link in the sticky header sub-nav (GitHub-style section tabs). */
export type SubNavItem = Readonly<{
    key: string
    label: string
    href: string
    external?: boolean
    /** Optional leading icon (e.g. live controller sub-nav). */
    icon?: ReactNode
    /** Optional count/status chip shown after the label (e.g. course list badges). */
    badge?: ReactNode
}>

export type SubNavConfig = Readonly<{
    items: readonly SubNavItem[]
    activeKey: string
    ariaLabel: string
}>

type SubNavStore = {
    items: readonly SubNavItem[]
    activeKey: string | null
    ariaLabel: string
    /** Which `<SubNav />` instance last wrote; used to avoid clear-on-unmount races. */
    ownerId: string | null
    setSubNav: (ownerId: string, config: SubNavConfig) => void
    clearSubNav: (ownerId: string) => void
}

export const useSubNav = create<SubNavStore>((set) => ({
    items: [],
    activeKey: null,
    ariaLabel: '',
    ownerId: null,
    setSubNav: (ownerId, { items, activeKey, ariaLabel }) =>
        set({
            ownerId,
            items: [...items],
            activeKey,
            ariaLabel,
        }),
    clearSubNav: (ownerId) =>
        set((state) => {
            if (state.ownerId !== ownerId) return state
            return {
                items: [],
                activeKey: null,
                ariaLabel: '',
                ownerId: null,
            }
        }),
}))
