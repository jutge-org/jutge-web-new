'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import jutge from '@/lib/jutge'
import { isGameProblem, parseProblemKey } from '@/lib/problems'
import {
    fetchInstructorOwnsProblem,
    fetchProblemDetail,
    fetchProblemEnrichment,
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
    const { loading: authLoading } = useAuth()
    const [detail, setDetail] = useState<ProblemDetailData | null | undefined>(undefined)
    const [status, setStatus] = useState<AbstractStatus | null | undefined>(undefined)
    const [defaultCompilerId, setDefaultCompilerId] = useState<string | null | undefined>(undefined)
    const [isInstructorOwner, setIsInstructorOwner] = useState<boolean | undefined>(undefined)
    const [problem_nm, setProblemNm] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return

        let cancelled = false

        setDetail(undefined)
        setProblemNm(null)
        setStatus(undefined)
        setDefaultCompilerId(undefined)
        setIsInstructorOwner(undefined)

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
        })()

        return () => {
            cancelled = true
        }
    }, [authLoading, includeAssets, key])

    const problemId = detail?.problem.problem_id
    const problemNmForStatus = detail?.problem.problem_nm
    const driverId = detail?.problem.abstract_problem.driver_id

    useEffect(() => {
        if (!problemId || !problemNmForStatus) return

        let cancelled = false
        const isGame = isGameProblem(driverId)

        void fetchInstructorOwnsProblem(problemNmForStatus).then((owns) => {
            if (!cancelled) setIsInstructorOwner(owns)
        })

        if (isAuthenticated && !isGame) {
            void fetchProblemStatus(jutge, problemNmForStatus).then((result) => {
                if (!cancelled) setStatus(result)
            })
            void jutge.student.profile.get().then((profile) => {
                if (!cancelled) setDefaultCompilerId(profile.compiler_id)
            })
        } else {
            setStatus(undefined)
            setDefaultCompilerId(null)
        }

        return () => {
            cancelled = true
        }
    }, [driverId, isAuthenticated, problemId, problemNmForStatus])

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
