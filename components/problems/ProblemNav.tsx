'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { SubNav } from '@/components/general/SubNav'
import { problemNavItems, problemTabFromPathname } from '@/lib/problemNav'
import type { SubNavItem } from '@/store/SubNav'

type ProblemNavProps = {
    pageKey: string
    showInstructorTabs: boolean
    problem_nm?: string | null
    isInstructorOwner?: boolean
}

/** Registers problem section links in the sticky header sub-nav. */
export function ProblemNav({
    pageKey,
    showInstructorTabs,
    problem_nm = null,
    isInstructorOwner = false,
}: ProblemNavProps) {
    const { user } = useAuth()
    const pathname = usePathname()
    const activeTab = problemTabFromPathname(pathname, pageKey)
    const showSecondaryNav = Boolean(user?.instructor || user?.administrator)

    const items = useMemo((): readonly SubNavItem[] => {
        return problemNavItems(pageKey, showInstructorTabs, problem_nm, isInstructorOwner).map(
            ({ tab, label, href }) => ({
                key: tab,
                label,
                href,
            }),
        )
    }, [pageKey, showInstructorTabs, problem_nm, isInstructorOwner])

    if (!showSecondaryNav) {
        return null
    }

    return <SubNav ariaLabel="Problem sections" activeKey={activeTab} items={items} />
}
