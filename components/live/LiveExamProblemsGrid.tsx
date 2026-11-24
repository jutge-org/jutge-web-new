'use client'

import { useEffect, useMemo, useState } from 'react'

import { LiveExamProblemCard } from '@/components/live/LiveExamProblemCard'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getPreferredLanguageId } from '@/lib/data/auth'
import {
    fetchAllAbstractProblems,
    fetchStudentProblemStatuses,
    type ProblemRow,
} from '@/lib/data/problems'
import jutge from '@/lib/jutge'
import type { AbstractStatus, RunningExam, RunningExamProblem } from '@/lib/jutge_api_client'
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

export function LiveExamProblemsCards({ exam }: { exam: RunningExam }) {
    const [problems, setProblems] = useState<ProblemRow[] | null>(null)
    const [statuses, setStatuses] = useState<Record<string, AbstractStatus> | undefined>(undefined)
    const [preferredLanguageId, setPreferredLanguageId] = useState<string | null>(null)

    const examProblemsByNm = useMemo(() => {
        const map = new Map<string, RunningExamProblem>()
        for (const problem of exam.problems) {
            map.set(problem.problem_nm, problem)
        }
        return map
    }, [exam.problems])

    const problemOrder = useMemo(() => exam.problems.map((problem) => problem.problem_nm), [exam.problems])
    const problemNms = useMemo(() => new Set(problemOrder), [problemOrder])

    useEffect(() => {
        void getPreferredLanguageId().then(setPreferredLanguageId)
        void fetchStudentProblemStatuses(jutge).then(setStatuses)
    }, [])

    useEffect(() => {
        void fetchAllAbstractProblems(preferredLanguageId).then((rows) => {
            const examRows = rows.filter((row) => problemNms.has(row.problem_nm))
            setProblems(orderProblemsForExam(examRows, problemOrder))
        })
    }, [preferredLanguageId, problemNms, problemOrder])

    return (
        <LiveExamProblemsGrid
            problems={problems ?? []}
            statuses={statuses}
            examProblemsByNm={examProblemsByNm}
            loading={problems === null}
        />
    )
}