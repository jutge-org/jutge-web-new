'use client'

import { SubNav } from '@/components/general/SubNav'
import { interpretersNavItems, type InterpretersTab } from '@/lib/interpreters'
import type { SubNavItem } from '@/store/SubNav'

const interpretersSubNavItems: readonly SubNavItem[] = interpretersNavItems.map(({ tab, label, href }) => ({
    key: tab,
    label,
    href,
}))

type InterpretersNavProps = {
    activeTab: InterpretersTab
}

/** Registers interpreters section links in the sticky header sub-nav. */
export function InterpretersNav({ activeTab }: InterpretersNavProps) {
    return <SubNav ariaLabel="Interpreters sections" activeKey={activeTab} items={interpretersSubNavItems} />
}
