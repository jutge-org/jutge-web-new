import { getCurrentClient, tryGetCurrentUser } from '@/lib/data/auth'
import { decodeSolutionB64, extensionForProglang, solutionFilename } from '@/lib/solutions'
import { fetchCompilers } from '@/lib/data/tables'
import { fetchInstructorOwnsProblem } from '@/lib/data/problemDetail'

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
}): Promise<ProblemSolutionActionResult> {
    const user = await tryGetCurrentUser()
    if (!user) {
        return { ok: false, error: 'Forbidden' }
    }
    const isInstructorOwner = await fetchInstructorOwnsProblem(data.problem_nm)

    if (!isInstructorOwner && !user.administrator) {
        return { ok: false, error: 'Forbidden' }
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
        return { ok: false, error: 'Failed to load solution' }
    }
}
