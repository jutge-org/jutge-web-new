import { getCurrentClient, tryGetCurrentUser } from '@/lib/data/auth'
import {
    INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE,
    instructorCanAccessProblemSolutions,
    type InstructorProblemResourceAccess,
} from '@/lib/data/instructorSharedResources'
import { decodeSolutionB64, extensionForProglang, solutionFilename } from '@/lib/solutions'
import { fetchCompilers } from '@/lib/data/tables'

export type ProblemSolutionActionResult =
    | {
          ok: true
          code: string
          codeExtension: string | null
          codeFilename: string
      }
    | { ok: false; error: string }

export async function fetchProblemSolutionAction(data: {
    problem_id: string
    problem_nm: string
    proglang: string
    access: InstructorProblemResourceAccess
    shared_solutions: number
}): Promise<ProblemSolutionActionResult> {
    const user = await tryGetCurrentUser()
    if (!user) {
        return { ok: false, error: 'Forbidden' }
    }

    if (!user.administrator && !user.instructor) {
        return { ok: false, error: 'Forbidden' }
    }

    if (!instructorCanAccessProblemSolutions(data.access, data.shared_solutions)) {
        return { ok: false, error: INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE }
    }

    try {
        const client = await getCurrentClient()
        const [contentB64, compilers] = await Promise.all([
            client.problems.getSolutionAsB64({
                problem_id: data.problem_id,
                proglang: data.proglang,
            }),
            fetchCompilers(),
        ])

        const codeExtension = extensionForProglang(data.proglang, compilers)

        return {
            ok: true,
            code: decodeSolutionB64(contentB64),
            codeExtension,
            codeFilename: solutionFilename(data.problem_nm, data.proglang, codeExtension),
        }
    } catch {
        return { ok: false, error: INSTRUCTOR_SOLUTIONS_NOT_SHARED_MESSAGE }
    }
}
