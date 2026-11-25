import jutge from '@/lib/jutge'
import type { ArenaContest, ArenaRankingIn, ColorMapping, InstructorExamProblem, Ranking } from '@/lib/jutge_api_client'

/** Contest identity used in watch URLs: `username:exam_nm`. */
export function contestExamKey(contest: Pick<ArenaContest, 'username' | 'exam_nm'>): string {
    return `${contest.username}:${contest.exam_nm}`
}

function decodedExamKey(examKey: string): string {
    if (examKey.includes(':') || !examKey.includes('%')) return examKey
    try {
        const decoded = decodeURIComponent(examKey)
        return decoded.includes(':') ? decoded : examKey
    } catch {
        return examKey
    }
}

export function parseContestExamKey(examKey: string): ArenaRankingIn | null {
    const key = decodedExamKey(examKey)
    const separator = key.indexOf(':')
    if (separator <= 0 || separator >= key.length - 1) return null
    return {
        username: key.slice(0, separator),
        exam_nm: key.slice(separator + 1),
    }
}

export async function fetchArenaContests(): Promise<ArenaContest[]> {
    return jutge.arena.getContests()
}

export async function fetchPublicContestRanking(examKey: string): Promise<Ranking> {
    const contest = parseContestExamKey(examKey)
    if (!contest) throw new Error('This contest key is not valid.')
    return jutge.arena.getRanking(contest)
}

export async function fetchPublicContestWatchColors(): Promise<ColorMapping> {
    return jutge.misc.getHexColors()
}

export function examProblemsFromRanking(ranking: Ranking): InstructorExamProblem[] {
    return (ranking[0]?.rankingResults ?? []).map((result, index) => ({
        problem_nm: result.problem_nm,
        weight: null,
        icon: null,
        caption: `P${index + 1}`,
    }))
}

/** Problem columns for a live ranking, preferring running-exam metadata when present. */
export function liveRankingExamProblems(
    ranking: Ranking,
    runningProblems?: { problem_nm: string; weight: number | null; icon: string | null; caption: string | null }[],
): InstructorExamProblem[] {
    const byNm = new Map((runningProblems ?? []).map((problem) => [problem.problem_nm, problem]))
    return (ranking[0]?.rankingResults ?? []).map((result, index) => {
        const fromExam = byNm.get(result.problem_nm)
        if (fromExam) return fromExam
        return {
            problem_nm: result.problem_nm,
            weight: null,
            icon: null,
            caption: `P${index + 1}`,
        }
    })
}
