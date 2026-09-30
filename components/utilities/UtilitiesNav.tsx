'use client'

import { SubNav } from '@/components/general/SubNav'
import { utilitiesNavItems, type UtilitiesTab } from '@/lib/utilities'
import type { SubNavItem } from '@/store/SubNav'

const utilitiesSubNavItems: readonly SubNavItem[] = utilitiesNavItems.map(({ tab, label, href }) => ({
    key: tab,
    label,
    href,
}))

type UtilitiesNavProps = {
    activeTab: UtilitiesTab
}

/** Registers utilities section links in the sticky header sub-nav. */
export function UtilitiesNav({ activeTab }: UtilitiesNavProps) {
    return <SubNav ariaLabel="Utilities sections" activeKey={activeTab} items={utilitiesSubNavItems} />
}
