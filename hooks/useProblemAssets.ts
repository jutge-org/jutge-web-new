'use client'

import { useEffect, useState } from 'react'

import { fetchProblemAssets, type ProblemDetailAssets } from '@/lib/data/problemDetail'
import { isQuizProblem } from '@/lib/problems'

type UseProblemAssetsResult = {
    /** Merged asset fields when loaded; undefined while loading or when problemId is unset. */
    assets: ProblemDetailAssets | undefined
    assetsLoading: boolean
}

export function useProblemAssets(
    problemId: string | undefined,
    driverId: string | null | undefined,
): UseProblemAssetsResult {
    const [assets, setAssets] = useState<ProblemDetailAssets | undefined>(undefined)

    useEffect(() => {
        if (!problemId || isQuizProblem(driverId)) {
            setAssets(undefined)
            return
        }

        let cancelled = false
        setAssets(undefined)

        void fetchProblemAssets(problemId, driverId ?? null).then((result) => {
            if (cancelled) return
            setAssets(
                result ?? {
                    shortHtmlStatement: '',
                    templates: [],
                    publicTestcases: [],
                    languages: {},
                },
            )
        })

        return () => {
            cancelled = true
        }
    }, [driverId, problemId])

    const assetsLoading = Boolean(problemId && !isQuizProblem(driverId) && assets === undefined)

    return { assets, assetsLoading }
}
