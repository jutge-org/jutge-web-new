export type ProblemTab = 'statement' | 'submissions' | 'solutions' | 'testcases' | 'properties'

export type ProblemNavItem = {
    tab: ProblemTab
    label: string
    href: string
}

export type ProblemInstructorNavTabs = {
    showSolutionsTab: boolean
    showTestcasesTab: boolean
}

export function problemInstructorNavTabs({
    isAdministrator,
    isInstructorOwner,
    sharedSolutions,
    sharedTestcases,
}: {
    isAdministrator: boolean
    isInstructorOwner: boolean
    sharedSolutions: boolean
    sharedTestcases: boolean
}): ProblemInstructorNavTabs {
    const unrestricted = isAdministrator || isInstructorOwner

    return {
        showSolutionsTab: unrestricted || sharedSolutions,
        showTestcasesTab: unrestricted || sharedTestcases,
    }
}

export function problemNavItems(
    pageKey: string,
    instructorTabs: ProblemInstructorNavTabs,
    problem_nm?: string | null,
    isInstructorOwner = false,
): ProblemNavItem[] {
    const items: ProblemNavItem[] = [
        { tab: 'statement', label: 'Statement', href: `/problems/${pageKey}` },
        { tab: 'submissions', label: 'Submissions', href: `/problems/${pageKey}/submissions` },
    ]

    if (instructorTabs.showSolutionsTab) {
        items.push({ tab: 'solutions', label: 'Solutions', href: `/problems/${pageKey}/solutions` })
    }

    if (instructorTabs.showTestcasesTab) {
        items.push({ tab: 'testcases', label: 'Test cases', href: `/problems/${pageKey}/testcases` })
    }

    if (isInstructorOwner && problem_nm) {
        items.push({
            tab: 'properties',
            label: 'Properties',
            href: `/instructor/problems/${problem_nm}`,
        })
    }

    return items
}

export function problemTabFromPathname(pathname: string, pageKey: string): ProblemTab {
    const base = `/problems/${pageKey}`

    if (pathname.startsWith(`${base}/submissions`)) {
        return 'submissions'
    }

    if (pathname === `${base}/solutions` || pathname.startsWith(`${base}/solutions/`)) {
        return 'solutions'
    }

    if (pathname === `${base}/testcases` || pathname.startsWith(`${base}/testcases/`)) {
        return 'testcases'
    }

    return 'statement'
}
