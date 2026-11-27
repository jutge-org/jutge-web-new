'use client'

import { useMemo } from 'react'

import { SubNav } from '@/components/general/SubNav'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { usePublicPathname } from '@/hooks/usePublicPathname'
import { liveTutorHomeNavItems, navIsCurrent } from '@/lib/liveNav'
import type { SubNavItem } from '@/store/SubNav'

/** Registers controller section links in the sticky header sub-nav. */
export function LiveTutorSubNav() {
    const site = useSiteMode()
    const session = useLiveSession()
    const pathname = usePublicPathname()

    const items = useMemo((): readonly SubNavItem[] => {
        return liveTutorHomeNavItems(site.kind).map(({ href, label }) => ({
            key: href,
            label,
            href,
        }))
    }, [site.kind])

    const activeKey = useMemo(() => {
        const byLength = [...items].sort((a, b) => b.href.length - a.href.length)
        for (const item of byLength) {
            if (navIsCurrent(pathname, item.href)) return item.key
        }
        return ''
    }, [items, pathname])

    if (session.loading || session.role !== 'tutor') return null

    const ariaLabel = site.kind === 'contest' ? 'Contest sections' : 'Exam sections'

    return <SubNav activeKey={activeKey} ariaLabel={ariaLabel} items={items} />
}