import { tryGetCurrentUser } from '@/lib/data/auth'
import { problemInstructorNavTabs, type ProblemInstructorNavTabs } from '@/lib/problemNav'

export type InstructorSharedFetchResult<T> =
    | { status: 'ok'; data: T }
    | { status: 'not_shared' }
    | { status: 'forbidden' }

export const INSTRUCTOR_TESTCASES_NOT_SHARED_MESSAGE = 'You cannot access the test cases of this problem.'

export const INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE = 'You cannot access the solutions of this problem.'

export type InstructorProblemResourceAccess = {
    isAdministrator: boolean
    isInstructorOwner: boolean
}

export function abstractSharingFlagEnabled(value: number): boolean {
    return value !== 0
}

export function instructorCanAccessProblemSolutions(
    access: InstructorProblemResourceAccess,
    shared_solutions: number,
): boolean {
    return (
        access.isAdministrator ||
        access.isInstructorOwner ||
        abstractSharingFlagEnabled(shared_solutions)
    )
}

export function instructorCanAccessProblemTestcases(
    access: InstructorProblemResourceAccess,
    shared_testcases: number,
): boolean {
    return (
        access.isAdministrator ||
        access.isInstructorOwner ||
        abstractSharingFlagEnabled(shared_testcases)
    )
}

export function computeProblemInstructorNavTabs(
    isAdministrator: boolean,
    isInstructorOwner: boolean | undefined,
    shared_solutions: number,
    shared_testcases: number,
): ProblemInstructorNavTabs {
    if (isAdministrator) {
        return { showSolutionsTab: true, showTestcasesTab: true }
    }

    const sharedSolutions = abstractSharingFlagEnabled(shared_solutions)
    const sharedTestcases = abstractSharingFlagEnabled(shared_testcases)

    if (isInstructorOwner === true) {
        return { showSolutionsTab: true, showTestcasesTab: true }
    }

    if (isInstructorOwner === false) {
        return problemInstructorNavTabs({
            isAdministrator: false,
            isInstructorOwner: false,
            sharedSolutions,
            sharedTestcases,
        })
    }

    return {
        showSolutionsTab: sharedSolutions,
        showTestcasesTab: sharedTestcases,
    }
}

/** Whether to load resources, wait for owner check, or show not-shared (no API call). */
export function instructorResourceAccessState(
    isAdministrator: boolean,
    isInstructorOwner: boolean | undefined,
    sharedFlag: number,
): 'pending' | 'not_shared' | 'allowed' {
    if (isAdministrator) {
        return 'allowed'
    }

    if (abstractSharingFlagEnabled(sharedFlag)) {
        return 'allowed'
    }

    if (isInstructorOwner === true) {
        return 'allowed'
    }

    if (isInstructorOwner === undefined) {
        return 'pending'
    }

    return 'not_shared'
}

export async function canAccessInstructorSharedResources(): Promise<boolean> {
    const user = await tryGetCurrentUser()
    if (!user) {
        return false
    }

    return user.administrator || user.instructor
}
