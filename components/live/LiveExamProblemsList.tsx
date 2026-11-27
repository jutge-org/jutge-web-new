'use client'

import { useEffect, useMemo, useState } from 'react'

import { LiveExamProblemsGrid, orderProblemsForExam } from '@/components/live/LiveExamProblemsGrid'
import { ProblemsListTable } from '@/components/problems/ProblemsListTable'
import { Spinner } from '@/components/ui/spinner'
import { getPreferredLanguageId } from '@/lib/data/auth'
import { fetchAllAbstractProblems, fetchLanguages, type ProblemRow } from '@/lib/data/problems'
import type { Language, RunningExam } from '@/lib/jutge_api_client'
import type { LiveExamListLayout } from '@/lib/liveExamListLayout'
import { DEFAULT_PROBLEMS_COLUMN_VISIBILITY } from '@/lib/problems'

type LiveExamProblemsListProps = {
    exam: RunningExam
    layout: LiveExamListLayout
}

export function LiveExamProblemsList({ exam, layout }: LiveExamProblemsListProps) {
    const [problems, setProblems] = useState<ProblemRow[] | null>(null)
    const [languages, setLanguages] = useState<Record<string, Language>>({})
    const [preferredLanguageId, setPreferredLanguageId] = useState<string | null>(null)

    const examProblemsByNm = useMemo(() => {
        const map = new Map<string, RunningExam['problems'][number]>()
        for (const problem of exam.problems) {
            map.set(problem.problem_nm, problem)
        }
        return map
    }, [exam.problems])

    const problemOrder = useMemo(() => exam.problems.map((problem) => problem.problem_nm), [exam.problems])
    const problemNms = useMemo(() => new Set(problemOrder), [problemOrder])

    useEffect(() => {
        void getPreferredLanguageId().then(setPreferredLanguageId)
        void fetchLanguages().then(setLanguages)
    }, [])

    useEffect(() => {
        void fetchAllAbstractProblems(preferredLanguageId).then((rows) => {
            const examRows = rows.filter((row) => problemNms.has(row.problem_nm))
            setProblems(orderProblemsForExam(examRows, problemOrder))
        })
    }, [preferredLanguageId, problemNms, problemOrder])

    const loading = problems === null

    if (layout === 'cards') {
        return (
            <LiveExamProblemsGrid
                problems={problems ?? []}
                examProblemsByNm={examProblemsByNm}
                loading={loading}
            />
        )
    }

    if (loading) {
        return (
            <div
                aria-busy="true"
                aria-label="Loading problems"
                className="flex items-center justify-center border border-dashed border-border bg-muted/20 py-8"
            >
                <Spinner className="size-8 text-muted-foreground" />
            </div>
        )
    }

    return (
        <ProblemsListTable
            problems={problems}
            languages={languages}
            preferredLanguageId={preferredLanguageId}
            columnVisibility={DEFAULT_PROBLEMS_COLUMN_VISIBILITY}
            autoHeight
        />
    )
}