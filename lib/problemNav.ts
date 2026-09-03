export type ProblemTab = 'statement' | 'submissions' | 'solutions' | 'testcases' | 'properties'

export type ProblemNavItem = {
    tab: ProblemTab
    label: string
    href: string
}

export function showInstructorProblemTabs(isInstructorOwner: boolean, isAdministrator = false): boolean {
    return isInstructorOwner || isAdministrator
}

export function problemNavItems(
    pageKey: string,
    showInstructorTabs: boolean,
    problem_nm?: string | null,
    isInstructorOwner = false,
): ProblemNavItem[] {
    const items: ProblemNavItem[] = [
        { tab: 'statement', label: 'Statement', href: `/problems/${pageKey}` },
        { tab: 'submissions', label: 'Submissions', href: `/problems/${pageKey}/submissions` },
    ]

    if (showInstructorTabs) {
        items.push(
            { tab: 'solutions', label: 'Solutions', href: `/problems/${pageKey}/solutions` },
            { tab: 'testcases', label: 'Test cases', href: `/problems/${pageKey}/testcases` },
        )
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
