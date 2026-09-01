'use client'

import { useEffect, useState } from 'react'

import jutge from '@/lib/jutge'
import { isGameProblem, parseProblemKey } from '@/lib/problems'
import {
    fetchInstructorOwnsProblem,
    fetchProblemDetail,
    fetchProblemStatus,
    resolveProblemId,
    type ProblemDetailData,
} from '@/lib/data/problemDetail'
import type { AbstractStatus } from '@/lib/jutge_api_client'

export type ProblemShellState = {
    /** undefined = still loading, null = not found */
    detail: ProblemDetailData | null | undefined
    status: AbstractStatus | null | undefined
    defaultCompilerId: string | null | undefined
    isInstructorOwner: boolean | undefined
    problem_nm: string | null
}

type UseProblemShellOptions = {
    key: string
    isAuthenticated: boolean
    /**
     * When false, skip statement HTML, templates, and testcases.
     * Use on pages that hide those widgets (submission routes).
     */
    includeAssets?: boolean
}

export function useProblemShell({
    key,
    isAuthenticated,
    includeAssets = true,
}: UseProblemShellOptions): ProblemShellState {
    const [detail, setDetail] = useState<ProblemDetailData | null | undefined>(undefined)
    const [status, setStatus] = useState<AbstractStatus | null | undefined>(undefined)
    const [defaultCompilerId, setDefaultCompilerId] = useState<string | null | undefined>(undefined)
    const [isInstructorOwner, setIsInstructorOwner] = useState<boolean | undefined>(undefined)
    const [problem_nm, setProblemNm] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        setDetail(undefined)
        setStatus(undefined)
        setDefaultCompilerId(undefined)
        setIsInstructorOwner(undefined)
        setProblemNm(null)

        void (async () => {
            const problemId = await resolveProblemId(key)
            if (cancelled) return
            if (!problemId) {
                setDetail(null)
                return
            }

            const data = await fetchProblemDetail(problemId, { includeAssets })
            if (cancelled) return
            if (!data) {
                setDetail(null)
                return
            }

            const parsed = parseProblemKey(problemId)
            const nm = parsed.kind === 'problem_id' ? parsed.problem_nm : data.problem.problem_nm
            setProblemNm(nm)
            setDetail(data)

            const isGame = isGameProblem(data.problem.abstract_problem.driver_id)

            void fetchInstructorOwnsProblem(nm).then((owns) => {
                if (!cancelled) setIsInstructorOwner(owns)
            })

            if (isAuthenticated && !isGame) {
                void fetchProblemStatus(jutge, nm).then((result) => {
                    if (!cancelled) setStatus(result)
                })
                void jutge.student.profile.get().then((profile) => {
                    if (!cancelled) setDefaultCompilerId(profile.compiler_id)
                })
            } else {
                // Leave status undefined when logged out so ProblemDetail hides submit actions.
                setDefaultCompilerId(null)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [includeAssets, isAuthenticated, key])

    return { detail, status, defaultCompilerId, isInstructorOwner, problem_nm }
}

export function hasInstructorProblemAccess(
    isInstructorOwner: boolean | undefined,
    isAdministrator: boolean,
): boolean | undefined {
    if (isInstructorOwner === undefined) {
        return undefined
    }

    return isInstructorOwner || isAdministrator
}
