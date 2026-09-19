import type { JutgeApiClient } from '@/lib/jutge_api_client'
import { parseProblemKey } from '@/lib/problems'

export type ProblemTitleMap = Record<string, string>

export function uniqueProblemIds(submissions: { problem_id: string }[]): string[] {
    return [...new Set(submissions.map((sub) => sub.problem_id))]
}

/** Returns a trimmed title when known and meaningfully different from the problem id. */
export function resolveProblemTitle(
    problemId: string,
    titles: ProblemTitleMap | undefined,
): string | null {
    const title = titles?.[problemId]?.trim()
    if (!title || title === problemId) return null
    return title
}

/**
 * Batch-fetch human-readable titles for problem ids via abstract problems.
 * Falls back gracefully when a problem is missing.
 */
export async function fetchProblemTitles(
    client: JutgeApiClient,
    problemIds: string[],
): Promise<ProblemTitleMap> {
    const unique = uniqueProblemIds(problemIds.map((problem_id) => ({ problem_id })))
    if (unique.length === 0) return {}

    const problemNms = [
        ...new Set(
            unique.map((problemId) => {
                const parsed = parseProblemKey(problemId)
                return parsed.kind === 'problem_id' || parsed.kind === 'problem_nm'
                    ? parsed.problem_nm
                    : problemId
            }),
        ),
    ]

    const titles: ProblemTitleMap = {}

    // Chunk to keep request URLs reasonable.
    const CHUNK = 80
    for (let i = 0; i < problemNms.length; i += CHUNK) {
        const chunk = problemNms.slice(i, i + CHUNK)
        try {
            const abstracts = await client.problems.getAbstractProblems(chunk.join(','))
            for (const problemId of unique) {
                const parsed = parseProblemKey(problemId)
                const nm =
                    parsed.kind === 'problem_id' || parsed.kind === 'problem_nm'
                        ? parsed.problem_nm
                        : problemId
                const abstract = abstracts[nm]
                if (!abstract) continue

                const preferred =
                    (parsed.kind === 'problem_id'
                        ? abstract.problems[problemId]
                        : undefined) ??
                    Object.values(abstract.problems).find((p) => p.problem_id === problemId) ??
                    Object.values(abstract.problems)[0]

                const title = preferred?.title?.trim()
                if (title) titles[problemId] = title
            }
        } catch {
            // Skip failed chunks; titles remain optional.
        }
    }

    return titles
}
