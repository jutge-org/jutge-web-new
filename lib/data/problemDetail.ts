import { getCurrentClient, getPreferredLanguageId, getProblemsApiClient, tryGetCurrentUser } from '@/lib/data/auth'
import { isGraphicProblem, parseProblemCompilerIds, parseProblemKey } from '@/lib/problems'
import { resolveProblemIdFromAbstract } from '@/lib/problemVariants'
import {
    type JutgeApiClient,
    type AbstractProblem,
    type AbstractStatus,
    type Compiler,
    type Language,
    type Problem,
    type Testcase,
} from '@/lib/jutge_api_client'

import { fetchLanguages } from './problems'
import { fetchCompilers } from './tables'

export type DecodedTestcase = {
    name: string
    input: string
    output: string
    outputImageSrc?: string
}

export type LanguageVariant = {
    problem_id: string
    language_id: string
    title: string
}

export type ProblemDetailData = {
    problem: Problem
    shortHtmlStatement: string
    templates: string[]
    publicTestcases: DecodedTestcase[]
    languageVariants: LanguageVariant[]
    officialSolutions: string[]
    brokenOfficialSolutions: string[]
    userSolutions: string[]
    languages: Record<string, Language>
    compilers: Compiler[]
}

export type FetchProblemDetailOptions = {
    /**
     * When false, skip statement HTML, templates, and testcases.
     * Use on pages that hide those widgets (submission routes).
     */
    includeAssets?: boolean
}

export function decodeTestcase(testcase: Testcase, outputAsImage: boolean): DecodedTestcase {
    const decoded: DecodedTestcase = {
        name: testcase.name,
        input: Buffer.from(testcase.input_b64, 'base64').toString('utf-8'),
        output: '',
    }

    if (outputAsImage) {
        decoded.outputImageSrc = `data:image/png;base64,${testcase.correct_b64}`
        return decoded
    }

    decoded.output = Buffer.from(testcase.correct_b64, 'base64').toString('utf-8')
    return decoded
}

export async function fetchAbstractProblem(problem_nm: string): Promise<AbstractProblem | null> {
    try {
        const client = await getProblemsApiClient()
        return await client.problems.getAbstractProblem(problem_nm)
    } catch {
        return null
    }
}

export async function resolveProblemId(key: string): Promise<string | null> {
    const parsed = parseProblemKey(key)

    if (parsed.kind === 'problem_id') {
        return parsed.problem_id
    }

    if (parsed.kind === 'problem_nm') {
        const abstractProblem = await fetchAbstractProblem(parsed.problem_nm)
        if (!abstractProblem) {
            return null
        }

        const preferredLanguageId = await getPreferredLanguageId()
        return resolveProblemIdFromAbstract(abstractProblem, preferredLanguageId)
    }

    return null
}

export async function fetchProblemStatus(client: JutgeApiClient, problem_nm: string): Promise<AbstractStatus | null> {
    try {
        return await client.student.statuses.getForAbstractProblem(problem_nm)
    } catch {
        return null
    }
}

export async function fetchInstructorOwnsProblem(problem_nm: string): Promise<boolean> {
    const user = await tryGetCurrentUser()
    if (!user?.instructor) {
        return false
    }

    try {
        const client = await getCurrentClient()
        const ownProblems = await client.instructor.problems.getOwnProblems()
        return ownProblems.includes(problem_nm)
    } catch {
        return false
    }
}

/** Header and nav data only — skips statement, templates, and testcases. */
export async function fetchProblemShell(problemId: string): Promise<ProblemDetailData | null> {
    return fetchProblemDetail(problemId, { includeAssets: false })
}

export async function fetchProblemDetail(
    problemId: string,
    options?: FetchProblemDetailOptions,
): Promise<ProblemDetailData | null> {
    const includeAssets = options?.includeAssets ?? true

    try {
        const client = await getProblemsApiClient()
        const problem = await client.problems.getProblem(problemId)

        const [
            shortHtmlStatement,
            templates,
            sampleTestcases,
            publicTestcases,
            problemSuppl,
            abstractProblem,
            languages,
            allCompilers,
        ] = await Promise.all([
            includeAssets ? client.problems.getShortHtmlStatement(problemId) : Promise.resolve(''),
            includeAssets ? client.problems.getTemplates(problemId) : Promise.resolve([] as string[]),
            includeAssets ? client.problems.getSampleTestcases(problemId) : Promise.resolve([] as Testcase[]),
            includeAssets ? client.problems.getPublicTestcases(problemId) : Promise.resolve([] as Testcase[]),
            client.problems.getProblemSuppl(problemId),
            fetchAbstractProblem(problem.problem_nm),
            includeAssets ? fetchLanguages() : Promise.resolve({} as Record<string, Language>),
            fetchCompilers(),
        ])

        if (!abstractProblem) {
            return null
        }

        const allowedCompilerIds = parseProblemCompilerIds(problem.abstract_problem.compilers)
        const compilers =
            allowedCompilerIds.length > 0
                ? allCompilers.filter((compiler) => allowedCompilerIds.includes(compiler.compiler_id))
                : allCompilers

        const languageVariants = Object.values(abstractProblem.problems)
            .map((variant) => ({
                problem_id: variant.problem_id,
                language_id: variant.language_id,
                title: variant.title,
            }))
            .sort((a, b) => a.language_id.localeCompare(b.language_id))

        const officialSolutions = Object.entries(problemSuppl.official_solution_checks)
            .filter(([, checked]) => checked)
            .map(([proglang]) => proglang)
            .sort()

        const brokenOfficialSolutions = Object.entries(problemSuppl.official_solution_checks)
            .filter(([, checked]) => !checked)
            .map(([proglang]) => proglang)
            .sort()

        const userSolutions = [...problemSuppl.proglangs_with_ac].sort()

        return {
            problem,
            shortHtmlStatement,
            templates,
            publicTestcases: [...sampleTestcases, ...publicTestcases].map((testcase) =>
                decodeTestcase(testcase, isGraphicProblem(problem.abstract_problem.driver_id)),
            ),
            languageVariants,
            officialSolutions,
            brokenOfficialSolutions,
            userSolutions,
            languages,
            compilers,
        }
    } catch {
        return null
    }
}
