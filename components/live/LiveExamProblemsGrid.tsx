'use client'

import { LiveExamProblemCard } from '@/components/live/LiveExamProblemCard'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { ProblemRow } from '@/lib/data/problems'
import type { AbstractStatus, RunningExamProblem } from '@/lib/jutge_api_client'
import { DEFAULT_PROBLEMS_COLUMN_VISIBILITY, type ProblemsColumnVisibility } from '@/lib/problems'

export function orderProblemsForExam(problems: ProblemRow[], problemOrder: readonly string[]): ProblemRow[] {
    if (!problemOrder.length) return problems
    const orderIndex = new Map(problemOrder.map((problem_nm, index) => [problem_nm, index]))
    return [...problems].sort((a, b) => {
        const aIndex = orderIndex.get(a.problem_nm) ?? Number.MAX_SAFE_INTEGER
        const bIndex = orderIndex.get(b.problem_nm) ?? Number.MAX_SAFE_INTEGER
        if (aIndex !== bIndex) return aIndex - bIndex
        return a.problem_nm.localeCompare(b.problem_nm)
    })
}

type LiveExamProblemsGridProps = {
    problems: ProblemRow[]
    statuses?: Record<string, AbstractStatus>
    examProblemsByNm?: ReadonlyMap<string, RunningExamProblem>
    columnVisibility?: ProblemsColumnVisibility
    loading?: boolean
}

export function LiveExamProblemsGrid({
    problems,
    statuses,
    examProblemsByNm,
    columnVisibility = DEFAULT_PROBLEMS_COLUMN_VISIBILITY,
    loading = false,
}: LiveExamProblemsGridProps) {
    if (loading) {
        return (
            <div
                aria-busy="true"
                aria-label="Loading problems"
                className="grid min-h-64 grid-cols-1 gap-4 sm:grid-cols-2"
            >
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="h-44 animate-pulse rounded-2xl border border-border bg-muted/30" />
                ))}
            </div>
        )
    }

    return (
        <TooltipProvider>
            <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2" aria-label="Exam problems">
                {problems.map((problem) => (
                    <li key={problem.problem_nm} className="min-w-0">
                        <LiveExamProblemCard
                            problem={problem}
                            examProblem={examProblemsByNm?.get(problem.problem_nm)}
                            status={statuses?.[problem.problem_nm]}
                            columnVisibility={columnVisibility}
                        />
                    </li>
                ))}
            </ul>
        </TooltipProvider>
    )
}