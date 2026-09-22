'use client'

import { useMemo } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { SubNav } from '@/components/general/SubNav'
import { profileNavItems, type ProfileTab } from '@/lib/profile'
import type { SubNavItem } from '@/store/SubNav'

type ProfileNavProps = {
    activeTab: ProfileTab
}

/** Registers profile section links in the sticky header sub-nav. */
export function ProfileNav({ activeTab }: ProfileNavProps) {
    const { user } = useAuth()
    const isInstructor = Boolean(user?.instructor)

    const items = useMemo((): readonly SubNavItem[] => {
        return profileNavItems
            .filter((item) => item.tab !== 'upgrade' || !isInstructor)
            .map(({ tab, label, href }) => ({
                key: tab,
                label,
                href,
            }))
    }, [isInstructor])

    if (!user) return null

    return <SubNav ariaLabel="Profile sections" activeKey={activeTab} items={items} />
}
