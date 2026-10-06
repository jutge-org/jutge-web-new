'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { SubNav } from '@/components/general/SubNav'
import { useInstructorOwnsProblem } from '@/hooks/use-supervision-problem-shell'
import { computeProblemInstructorNavTabs } from '@/lib/data/instructorSharedResources'
import { isGameProblem } from '@/lib/problems'
import type { ProblemDetailData } from '@/lib/data/problemDetail'
import {
    supervisionProblemNavItems,
    supervisionProblemTabFromPathname,
    type SupervisionContext,
} from '@/lib/supervision'
import type { SubNavItem } from '@/store/SubNav'

type SupervisionProblemNavProps = {
    pageKey: string
    context: SupervisionContext
    problem_nm?: string | null
    driverId?: string | null
    shared_solutions?: number
    shared_testcases?: number
}

export function supervisionProblemNavPropsFromDetail(
    pageKey: string,
    context: SupervisionContext,
    detail: ProblemDetailData | null | undefined,
    problem_nm: string | null,
): SupervisionProblemNavProps {
    return {
        pageKey,
        context,
        problem_nm,
        driverId: detail?.problem.abstract_problem.driver_id,
        shared_solutions: detail?.problem.abstract_problem.shared_solutions ?? 0,
        shared_testcases: detail?.problem.abstract_problem.shared_testcases ?? 0,
    }
}

/** Registers supervision problem section links in the sticky header sub-nav. */
export function SupervisionProblemNav({
    pageKey,
    context,
    problem_nm = null,
    driverId = null,
    shared_solutions = 0,
    shared_testcases = 0,
}: SupervisionProblemNavProps) {
    const { user } = useAuth()
    const pathname = usePathname()
    const activeTab = supervisionProblemTabFromPathname(pathname, pageKey, context)
    const isInstructorOwner = useInstructorOwnsProblem(problem_nm)
    const isAdministrator = Boolean(user?.administrator)

    const instructorTabs = useMemo(() => {
        if (!problem_nm || isGameProblem(driverId)) {
            return { showSolutionsTab: false, showTestcasesTab: false }
        }

        return computeProblemInstructorNavTabs(
            isAdministrator,
            isInstructorOwner,
            shared_solutions,
            shared_testcases,
        )
    }, [driverId, isAdministrator, isInstructorOwner, problem_nm, shared_solutions, shared_testcases])

    const items = useMemo((): readonly SubNavItem[] => {
        return supervisionProblemNavItems(context, pageKey, instructorTabs).map(({ tab, label, href }) => ({
            key: tab,
            label,
            href,
        }))
    }, [context, instructorTabs, pageKey])

    return <SubNav ariaLabel="Problem sections" activeKey={activeTab} items={items} />
}
