import type { JutgeApiClient } from '@/lib/jutge_api_client'
import { decodeSolutionB64, extensionForProglang, solutionFilename } from '@/lib/solutions'

import {
    canAccessInstructorSharedResources,
    instructorCanAccessProblemSolutions,
    type InstructorProblemResourceAccess,
    type InstructorSharedFetchResult,
} from './instructorSharedResources'
import { fetchCompilers } from './tables'

export type ProblemSolutionContent = {
    code: string
    codeExtension: string | null
    codeFilename: string
}

export async function fetchProblemSolutionProglangs(
    client: JutgeApiClient,
    problem_id: string,
    access: InstructorProblemResourceAccess,
    shared_solutions: number,
): Promise<InstructorSharedFetchResult<string[]>> {
    if (!(await canAccessInstructorSharedResources())) {
        return { status: 'forbidden' }
    }

    if (!instructorCanAccessProblemSolutions(access, shared_solutions)) {
        return { status: 'not_shared' }
    }

    try {
        const proglangs = await client.problems.getSolutions(problem_id)
        const data = [...proglangs].sort((a, b) => a.localeCompare(b))
        return { status: 'ok', data }
    } catch {
        return { status: 'not_shared' }
    }
}

export async function fetchProblemSolutionContent(
    client: JutgeApiClient,
    problem_id: string,
    problem_nm: string,
    proglang: string,
    access: InstructorProblemResourceAccess,
    shared_solutions: number,
): Promise<InstructorSharedFetchResult<ProblemSolutionContent>> {
    if (!(await canAccessInstructorSharedResources())) {
        return { status: 'forbidden' }
    }

    if (!instructorCanAccessProblemSolutions(access, shared_solutions)) {
        return { status: 'not_shared' }
    }

    try {
        const [contentB64, compilers] = await Promise.all([
            client.problems.getSolutionAsB64({ problem_id, proglang }),
            fetchCompilers(),
        ])

        const codeExtension = extensionForProglang(proglang, compilers)

        return {
            status: 'ok',
            data: {
                code: decodeSolutionB64(contentB64),
                codeExtension,
                codeFilename: solutionFilename(problem_nm, proglang, codeExtension),
            },
        }
    } catch {
        return { status: 'not_shared' }
    }
}
