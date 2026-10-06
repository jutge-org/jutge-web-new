import type { JutgeApiClient } from '@/lib/jutge_api_client'
import { isGraphicProblem } from '@/lib/problems'

import {
    canAccessInstructorSharedResources,
    instructorCanAccessProblemTestcases,
    INSTRUCTOR_TESTCASES_NOT_SHARED_MESSAGE,
    type InstructorProblemResourceAccess,
    type InstructorSharedFetchResult,
} from './instructorSharedResources'
import { decodeTestcase, type DecodedTestcase } from './problemDetail'

async function ensureInstructorTestcaseAccess(
    access: InstructorProblemResourceAccess,
    shared_testcases: number,
): Promise<InstructorSharedFetchResult<never> | null> {
    if (!(await canAccessInstructorSharedResources())) {
        return { status: 'forbidden' }
    }

    if (!instructorCanAccessProblemTestcases(access, shared_testcases)) {
        return { status: 'not_shared' }
    }

    return null
}

export async function fetchProblemTestcaseNames(
    client: JutgeApiClient,
    problem_id: string,
    access: InstructorProblemResourceAccess,
    shared_testcases: number,
): Promise<InstructorSharedFetchResult<string[]>> {
    const denied = await ensureInstructorTestcaseAccess(access, shared_testcases)
    if (denied) {
        return denied
    }

    try {
        const names = await client.problems.getTestcases(problem_id)
        const data = [...names].sort((a, b) => a.localeCompare(b))
        return { status: 'ok', data }
    } catch {
        return { status: 'not_shared' }
    }
}

export async function fetchProblemTestcase(
    client: JutgeApiClient,
    problem_id: string,
    testcase: string,
    driverId: string | null | undefined,
    access: InstructorProblemResourceAccess,
    shared_testcases: number,
): Promise<InstructorSharedFetchResult<DecodedTestcase>> {
    const denied = await ensureInstructorTestcaseAccess(access, shared_testcases)
    if (denied) {
        return denied
    }

    try {
        const raw = await client.problems.getTestcase({ problem_id, testcase })
        const data = decodeTestcase(raw, isGraphicProblem(driverId))
        return { status: 'ok', data }
    } catch {
        return { status: 'not_shared' }
    }
}

export type ProblemTestcaseActionResult =
    | { ok: true; testcase: DecodedTestcase }
    | { ok: false; error: string }

export async function fetchProblemTestcaseAction(
    client: JutgeApiClient,
    data: {
        problem_id: string
        testcase: string
        driverId: string | null | undefined
        access: InstructorProblemResourceAccess
        shared_testcases: number
    },
): Promise<ProblemTestcaseActionResult> {
    const result = await fetchProblemTestcase(
        client,
        data.problem_id,
        data.testcase,
        data.driverId,
        data.access,
        data.shared_testcases,
    )

    if (result.status === 'ok') {
        return { ok: true, testcase: result.data }
    }

    if (result.status === 'forbidden') {
        return { ok: false, error: 'Forbidden' }
    }

    return { ok: false, error: INSTRUCTOR_TESTCASES_NOT_SHARED_MESSAGE }
}
