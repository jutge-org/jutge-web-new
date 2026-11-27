'use client'

import { useMemo } from 'react'

import { SubNav } from '@/components/general/SubNav'
import { LiveNavMenuItemIcon } from '@/components/live/LiveNavMenuItemIcon'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { usePublicPathname } from '@/hooks/usePublicPathname'
import { isLiveKind } from '@/lib/siteMode'
import { liveStudentLiveNavItems, navIsCurrent } from '@/lib/liveNav'
import type { SubNavItem } from '@/store/SubNav'

/** Registers participant section links in the sticky header sub-nav on exam and contest hosts. */
export function LiveStudentSubNav() {
    const site = useSiteMode()
    const session = useLiveSession()
    const pathname = usePublicPathname()

    const items = useMemo((): readonly SubNavItem[] => {
        return liveStudentLiveNavItems(site.kind, session.exam).map(({ href, label }) => ({
            key: href,
            label,
            href,
            icon: <LiveNavMenuItemIcon href={href} className="size-4 shrink-0" />,
        }))
    }, [site.kind, session.exam])

    const activeKey = useMemo(() => {
        const byLength = [...items].sort((a, b) => b.href.length - a.href.length)
        for (const item of byLength) {
            if (navIsCurrent(pathname, item.href)) return item.key
        }
        return ''
    }, [items, pathname])

    if (session.loading || session.role !== 'student' || !isLiveKind(site.kind)) return null

    const ariaLabel = site.kind === 'contest' ? 'Contest sections' : 'Exam sections'

    return <SubNav activeKey={activeKey} ariaLabel={ariaLabel} items={items} />
}