import type { CodeMetrics, CodeMetricsResult, Submission } from '@/lib/jutge_api_client'

const HIDDEN_COMPILER_IDS = new Set(['quiz', 'MakePRO2'])
const HIDDEN_VERDICTS = new Set(['CE', 'IE', 'FE', 'Pending'])

const GAUGE_GREEN = '#22c55e'
const GAUGE_YELLOW = '#f59e0b'
const GAUGE_RED = '#ef4444'

export const CCN_GAUGE_INTERVALS = [
    { minimum: 0, maximum: 9, color: GAUGE_GREEN },
    { minimum: 9, maximum: 14, color: GAUGE_YELLOW },
    { minimum: 14, maximum: 18, color: GAUGE_RED },
] as const

export const HALSTEAD_DIFFICULTY_GAUGE_INTERVALS = [
    { minimum: 0, maximum: 10, color: GAUGE_GREEN },
    { minimum: 10, maximum: 20, color: GAUGE_YELLOW },
    { minimum: 20, maximum: 30, color: GAUGE_RED },
] as const

export const MAINTAINABILITY_GAUGE_INTERVALS = [
    { minimum: 0, maximum: 20, color: GAUGE_RED },
    { minimum: 20, maximum: 80, color: GAUGE_YELLOW },
    { minimum: 80, maximum: 100, color: GAUGE_GREEN },
] as const

export const DOCUMENTATION_GAUGE_INTERVALS = [
    { minimum: 0, maximum: 10, color: GAUGE_RED },
    { minimum: 10, maximum: 20, color: GAUGE_YELLOW },
    { minimum: 20, maximum: 40, color: GAUGE_GREEN },
    { minimum: 40, maximum: 100, color: GAUGE_RED },
] as const

export const RATIO_GAUGE_INTERVALS = [
    { minimum: 0, maximum: 1.5, color: GAUGE_GREEN },
    { minimum: 1.5, maximum: 2.25, color: GAUGE_YELLOW },
    { minimum: 2.25, maximum: 3, color: GAUGE_RED },
] as const

export type CodeMetricId = 'ccn' | 'dif' | 'mnt' | 'com'

export const CODE_METRICS: Record<CodeMetricId, { acronym: string; name: string; help: string }> = {
    ccn: {
        acronym: 'CCN',
        name: 'Cyclomatic complexity',
        help: "McCabe's Cyclomatic complexity indicates the complexity of a program measuring the number of linearly independent paths through a program's source code. It is considered that cyclomatic complexities up to 9 are all right, up to 14 are difficult, and above 14 are too much complicated.",
    },
    dif: {
        acronym: 'DIF',
        name: "Halstead's difficulty",
        help: 'Halstead complexity measures vocabulary, program length, volume, difficulty, and effort by a static inspection of the code. In particular, difficulty relates to the difficulty of understanding the program when reading or writing it.',
    },
    mnt: {
        acronym: 'MI',
        name: 'Maintainability index',
        help: 'The maintainability index is a composite metric calculated from cyclomatic complexity, Halstead volume, and lines of code. It estimates how easy a codebase is to maintain, with higher values indicating better maintainability.',
    },
    com: {
        acronym: 'DI',
        name: 'Documentation index',
        help: 'The ratio of comment lines to total lines of code, giving an indication of how well the code is documented. Quite crude!',
    },
}

export const CODE_METRICS_RATIO_HELP =
    "Jutge.org also provides a comparison between your code metrics and those of the official solution. The ratio between both can be quite revealing: if your metrics are consistently much higher than the solution's, it is worth stopping to reflect on what is happening — your code may be more complex, longer, harder to read, or harder to maintain than it can be."

export type CodeMetricsTableRow = {
    metric: string
    acronym: string
    value: string
    ref: string
    ratio: string
}

export type SubmissionCodeMetricsData = {
    rows: CodeMetricsTableRow[]
    cyclomaticComplexity: number | null
    halsteadDifficulty: number | null
    maintainabilityIndex: number | null
    documentationIndex: number | null
    ccnRatio: number | null
    difRatio: number | null
}

export function shouldShowCodeMetrics({
    submission,
    verdict,
    isAdministrator,
    isExamOrContest,
}: {
    submission: Submission
    verdict: string
    isAdministrator: boolean
    isExamOrContest: boolean
}): boolean {
    if (isExamOrContest) {
        return false
    }

    if (HIDDEN_COMPILER_IDS.has(submission.compiler_id)) {
        return false
    }

    if (HIDDEN_VERDICTS.has(verdict)) {
        return false
    }

    if (!isAdministrator && verdict !== 'AC') {
        return false
    }

    return submission.state === 'done'
}

function isFiniteNumber(value: number | undefined | null): value is number {
    return typeof value === 'number' && Number.isFinite(value)
}

function finiteOrNull(value: number | undefined | null): number | null {
    return isFiniteNumber(value) ? value : null
}

function formatDecimal(value: number): string {
    return value.toFixed(1)
}

function formatMetric(value: number | undefined | null, formatter: (value: number) => string): string {
    if (!isFiniteNumber(value)) {
        return '-'
    }

    return formatter(value)
}

function computeRatio(numerator: number | undefined | null, denominator: number | undefined | null): number | null {
    if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator) || denominator === 0) {
        return null
    }

    const ratio = numerator / denominator
    if (!Number.isFinite(ratio)) {
        return null
    }

    return ratio
}

function formatRatio(numerator: number | undefined | null, denominator: number | undefined | null): string {
    const ratio = computeRatio(numerator, denominator)
    if (ratio === null) {
        return '–'
    }

    return ratio.toFixed(1)
}

function isCodeMetricsResult(raw: CodeMetricsResult | CodeMetrics): raw is CodeMetricsResult {
    return 'userMetrics' in raw || 'solutionMetrics' in raw
}

export function parseCodeMetricsResponse(raw: CodeMetricsResult | CodeMetrics | null): CodeMetricsResult {
    if (!raw) {
        return { userMetrics: null, solutionMetrics: null }
    }

    if (isCodeMetricsResult(raw)) {
        return {
            userMetrics: raw.userMetrics ?? null,
            solutionMetrics: raw.solutionMetrics ?? null,
        }
    }

    if (typeof raw.cyclomatic_complexity === 'number') {
        return { userMetrics: raw, solutionMetrics: null }
    }

    return { userMetrics: null, solutionMetrics: null }
}

export function buildSubmissionCodeMetricsData(
    userMetrics: CodeMetrics | null,
    solutionMetrics: CodeMetrics | null,
): SubmissionCodeMetricsData {
    const rows: CodeMetricsTableRow[] = [
        {
            metric: CODE_METRICS.ccn.name,
            acronym: CODE_METRICS.ccn.acronym,
            value: formatMetric(userMetrics?.cyclomatic_complexity, formatDecimal),
            ref: formatMetric(solutionMetrics?.cyclomatic_complexity, formatDecimal),
            ratio: formatRatio(userMetrics?.cyclomatic_complexity, solutionMetrics?.cyclomatic_complexity),
        },
        {
            metric: CODE_METRICS.dif.name,
            acronym: CODE_METRICS.dif.acronym,
            value: formatMetric(userMetrics?.halstead_difficulty, formatDecimal),
            ref: formatMetric(solutionMetrics?.halstead_difficulty, formatDecimal),
            ratio: formatRatio(userMetrics?.halstead_difficulty, solutionMetrics?.halstead_difficulty),
        },
        {
            metric: CODE_METRICS.mnt.name,
            acronym: CODE_METRICS.mnt.acronym,
            value: formatMetric(userMetrics?.maintainability_index, formatDecimal),
            ref: formatMetric(solutionMetrics?.maintainability_index, formatDecimal),
            ratio: formatRatio(userMetrics?.maintainability_index, solutionMetrics?.maintainability_index),
        },
        {
            metric: CODE_METRICS.com.name,
            acronym: CODE_METRICS.com.acronym,
            value: formatMetric(userMetrics?.comment_ratio, formatDecimal),
            ref: formatMetric(solutionMetrics?.comment_ratio, formatDecimal),
            ratio: formatRatio(userMetrics?.comment_ratio, solutionMetrics?.comment_ratio),
        },
    ]

    return {
        rows,
        cyclomaticComplexity: finiteOrNull(userMetrics?.cyclomatic_complexity),
        halsteadDifficulty: finiteOrNull(userMetrics?.halstead_difficulty),
        maintainabilityIndex: finiteOrNull(userMetrics?.maintainability_index),
        documentationIndex: finiteOrNull(userMetrics?.comment_ratio),
        ccnRatio: computeRatio(userMetrics?.cyclomatic_complexity, solutionMetrics?.cyclomatic_complexity),
        difRatio: computeRatio(userMetrics?.halstead_difficulty, solutionMetrics?.halstead_difficulty),
    }
}
