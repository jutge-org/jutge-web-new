import { getCurrentClient, getPreferredLanguageId } from '@/lib/data/auth'
import { invalidateCachedCall } from '@/lib/jutge'
import type { ProblemSubmissionRow, SubmissionRow } from '@/lib/submissions'
import { fetchProblemSubmissionsData, fetchSubmissionsData } from '@/lib/data/submissions'
import { abstractProblemsToTitleMap } from '@/lib/data/problems'

export async function fetchSubmissionsRowsAction(): Promise<SubmissionRow[]> {
    const client = await getCurrentClient()
    return fetchSubmissionsData(client)
}

export async function fetchProblemSubmissionsRowsAction(problem_nm: string): Promise<ProblemSubmissionRow[]> {
    const client = await getCurrentClient()
    const [abstractProblems, preferredLanguageId] = await Promise.all([
        client.problems.getAbstractProblems(problem_nm),
        getPreferredLanguageId(),
    ])
    const languageTitles = abstractProblemsToTitleMap(abstractProblems, preferredLanguageId)
    return fetchProblemSubmissionsData(client, problem_nm, languageTitles)
}

export async function submitSolutionAction(data: {
    problem_id: string
    compiler_id: string
    annotation: string
    file: File
}): Promise<{ ok: true; submission_id: string } | { ok: false; error: string }> {
    try {
        const client = await getCurrentClient()
        const { submission_id } = await client.student.submissions.submitFull(
            {
                problem_id: data.problem_id,
                compiler_id: data.compiler_id,
                annotation: data.annotation,
                extraSubmissionInfo: {},
            },
            [data.file],
        )
        invalidateCachedCall('problems.getProblemSuppl', data.problem_id)
        return { ok: true, submission_id }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Submission failed.'
        return { ok: false, error: message }
    }
}
