'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { SubNav } from '@/components/general/SubNav'
import { computeProblemInstructorNavTabs } from '@/lib/data/instructorSharedResources'
import { problemNavItems, problemTabFromPathname } from '@/lib/problemNav'
import { isGameProblem } from '@/lib/problems'
import type { SubNavItem } from '@/store/SubNav'

type ProblemNavProps = {
    pageKey: string
    problem_nm?: string | null
    driverId?: string | null
    shared_solutions?: number
    shared_testcases?: number
    isInstructorOwner?: boolean
}

/** Registers problem section links in the sticky header sub-nav. */
export function ProblemNav({
    pageKey,
    problem_nm = null,
    driverId = null,
    shared_solutions = 0,
    shared_testcases = 0,
    isInstructorOwner,
}: ProblemNavProps) {
    const { user } = useAuth()
    const pathname = usePathname()
    const activeTab = problemTabFromPathname(pathname, pageKey)
    const showSecondaryNav = Boolean(user?.instructor || user?.administrator)

    const isAdministrator = Boolean(user?.administrator)

    const instructorTabs = useMemo(() => {
        if (!showSecondaryNav || !problem_nm || isGameProblem(driverId)) {
            return { showSolutionsTab: false, showTestcasesTab: false }
        }

        return computeProblemInstructorNavTabs(
            isAdministrator,
            isInstructorOwner,
            shared_solutions,
            shared_testcases,
        )
    }, [
        driverId,
        isAdministrator,
        isInstructorOwner,
        problem_nm,
        shared_solutions,
        shared_testcases,
        showSecondaryNav,
    ])

    const items = useMemo((): readonly SubNavItem[] => {
        return problemNavItems(pageKey, instructorTabs, problem_nm, isInstructorOwner === true).map(
            ({ tab, label, href }) => ({
                key: tab,
                label,
                href,
            }),
        )
    }, [pageKey, instructorTabs, problem_nm, isInstructorOwner])

    if (!showSecondaryNav) {
        return null
    }

    return <SubNav ariaLabel="Problem sections" activeKey={activeTab} items={items} />
}
