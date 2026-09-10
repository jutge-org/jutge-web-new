'use client'

import { useEffect, useState } from 'react'

import { fetchSupervisionProblemStatus } from '@/lib/data/supervisionSubmissions'
import {
    fetchInstructorOwnsProblem,
    fetchProblemDetail,
    fetchProblemEnrichment,
    resolveProblemId,
    type ProblemDetailData,
} from '@/lib/data/problemDetail'
import { isGameProblem, parseProblemKey } from '@/lib/problems'
import type { SupervisionContext } from '@/lib/supervision'
import type { AbstractStatus } from '@/lib/jutge_api_client'

export type SupervisionProblemShellState = {
    detail: ProblemDetailData | null | undefined
    status: AbstractStatus | null | undefined
    problem_nm: string | null
}

type UseSupervisionProblemShellOptions = {
    key: string
    context: SupervisionContext
    /**
     * When false, skip statement HTML, templates, and testcases.
     * Use on pages that hide those widgets (submission routes).
     */
    includeAssets?: boolean
}

export function useSupervisionProblemShell({
    key,
    context,
    includeAssets = true,
}: UseSupervisionProblemShellOptions): SupervisionProblemShellState {
    const [detail, setDetail] = useState<ProblemDetailData | null | undefined>(undefined)
    const [status, setStatus] = useState<AbstractStatus | null | undefined>(undefined)
    const [problem_nm, setProblemNm] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        setDetail(undefined)
        setStatus(undefined)
        setProblemNm(null)

        void (async () => {
            const problemId = await resolveProblemId(key)
            if (cancelled) return
            if (!problemId) {
                setDetail(null)
                return
            }

            const data = await fetchProblemDetail(problemId, {
                includeAssets,
                includeEnrichment: includeAssets,
            })
            if (cancelled) return
            if (!data) {
                setDetail(null)
                return
            }

            const parsed = parseProblemKey(problemId)
            const nm = parsed.kind === 'problem_id' ? parsed.problem_nm : data.problem.problem_nm
            setProblemNm(nm)
            setDetail(data)

            if (!includeAssets) {
                void fetchProblemEnrichment(problemId, data.problem.abstract_problem.compilers).then((enrichment) => {
                    if (cancelled || !enrichment) return
                    setDetail((current) => (current ? { ...current, ...enrichment } : current))
                })
            }

            const isGame = isGameProblem(data.problem.abstract_problem.driver_id)
            if (isGame) {
                setStatus(null)
                return
            }

            void fetchSupervisionProblemStatus(context, nm).then((result) => {
                if (!cancelled) setStatus(result)
            })
        })()

        return () => {
            cancelled = true
        }
    }, [context, includeAssets, key])

    return { detail, status, problem_nm }
}

export function useInstructorOwnsProblem(problem_nm: string | null): boolean | undefined {
    const [isInstructorOwner, setIsInstructorOwner] = useState<boolean | undefined>(undefined)

    useEffect(() => {
        if (!problem_nm) {
            setIsInstructorOwner(undefined)
            return
        }

        let cancelled = false
        void fetchInstructorOwnsProblem(problem_nm).then((owns) => {
            if (!cancelled) setIsInstructorOwner(owns)
        })

        return () => {
            cancelled = true
        }
    }, [problem_nm])

    return isInstructorOwner
}
