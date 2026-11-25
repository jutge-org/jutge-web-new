'use client'

import { usePublicPathname } from '@/hooks/usePublicPathname'

import { SubNav } from '@/components/general/SubNav'
import { instructorNavItems, instructorShowsMainSubNav, instructorTabFromPathname } from '@/lib/instructor'
import type { SubNavItem } from '@/store/SubNav'

const instructorSubNavItems: readonly SubNavItem[] = instructorNavItems.map(({ tab, label, href }) => ({
    key: tab,
    label,
    href,
}))

/** Registers main instructor section links in the sticky header sub-nav. */
export function InstructorNav() {
    const pathname = usePublicPathname()

    if (!instructorShowsMainSubNav(pathname)) {
        return null
    }

    const activeTab = instructorTabFromPathname(pathname)

    return <SubNav ariaLabel="Instructor sections" activeKey={activeTab} items={instructorSubNavItems} />
}
