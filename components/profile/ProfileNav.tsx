'use client'

import { SubNav } from '@/components/general/SubNav'
import { profileNavItems, type ProfileTab } from '@/lib/profile'
import type { SubNavItem } from '@/store/SubNav'

const profileSubNavItems: readonly SubNavItem[] = profileNavItems.map(({ tab, label, href }) => ({
    key: tab,
    label,
    href,
}))

type ProfileNavProps = {
    activeTab: ProfileTab
}

/** Registers profile section links in the sticky header sub-nav. */
export function ProfileNav({ activeTab }: ProfileNavProps) {
    return <SubNav ariaLabel="Profile sections" activeKey={activeTab} items={profileSubNavItems} />
}
