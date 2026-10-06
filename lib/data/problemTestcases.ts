import { tryGetCurrentUser } from '@/lib/data/auth'
import type { JutgeApiClient } from '@/lib/jutge_api_client'
import { isGraphicProblem } from '@/lib/problems'

import { decodeTestcase, fetchInstructorOwnsProblem, type DecodedTestcase } from './problemDetail'

async function canAccessProblemTestcases(problem_nm: string): Promise<boolean> {
    const user = await tryGetCurrentUser()
    if (!user) {
        return false
    }

    if (user.administrator) {
        return true
    }

    return fetchInstructorOwnsProblem(problem_nm)
}

export async function fetchAllProblemTestcases(
    client: JutgeApiClient,
    problem_id: string,
    problem_nm: string,
    driverId: string | null | undefined,
): Promise<DecodedTestcase[] | null> {
    if (!(await canAccessProblemTestcases(problem_nm))) {
        return null
    }

    try {
        const testcases = await client.problems.getAllTestcases(problem_id)
        const outputAsImage = isGraphicProblem(driverId)

        return [...testcases]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((testcase) => decodeTestcase(testcase, outputAsImage))
    } catch {
        return null
    }
}
