'use client'

import { usePublicPathname } from '@/hooks/usePublicPathname'

import { SubNav } from '@/components/general/SubNav'
import { administratorNavItems, administratorTabFromPathname } from '@/lib/administrator'
import type { SubNavItem } from '@/store/SubNav'

const administratorSubNavItems: readonly SubNavItem[] = administratorNavItems.map(({ tab, label, href }) => ({
    key: tab,
    label,
    href,
}))

/** Registers administrator section links in the sticky header sub-nav. */
export function AdministratorNav() {
    const pathname = usePublicPathname()
    const activeTab = administratorTabFromPathname(pathname)

    return <SubNav ariaLabel="Administrator sections" activeKey={activeTab} items={administratorSubNavItems} />
}
