'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { usePublicPathname } from '@/hooks/usePublicPathname'
import {
    LIVE_EXAM_LIST_LAYOUT_PARAM,
    type LiveExamListLayout,
    type LiveExamListLayoutScope,
    parseLiveExamListLayout,
    readLiveExamListLayout,
    shouldSyncLiveExamListLayoutUrl,
    liveExamListLayoutSearchParams,
    writeLiveExamListLayout,
} from '@/lib/liveExamListLayout'

export function useLiveExamListLayout(scope: LiveExamListLayoutScope) {
    const router = useRouter()
    const pathname = usePublicPathname()
    const searchParams = useSearchParams()
    const [layout, setLayoutState] = useState<LiveExamListLayout>(() => readLiveExamListLayout(scope))

    useEffect(() => {
        const fromUrl = parseLiveExamListLayout(searchParams.get(LIVE_EXAM_LIST_LAYOUT_PARAM))
        if (!fromUrl) return
        setLayoutState(fromUrl)
        writeLiveExamListLayout(scope, fromUrl)
    }, [scope, searchParams])

    const setLayout = useCallback(
        (next: LiveExamListLayout) => {
            setLayoutState(next)
            writeLiveExamListLayout(scope, next)

            if (!shouldSyncLiveExamListLayoutUrl(scope, pathname)) return

            const params = liveExamListLayoutSearchParams(searchParams, next)
            const qs = params.toString()
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        },
        [pathname, router, scope, searchParams],
    )

    const toggleLayout = useCallback(() => {
        setLayoutState((current) => {
            const next: LiveExamListLayout = current === 'cards' ? 'table' : 'cards'
            writeLiveExamListLayout(scope, next)
            if (shouldSyncLiveExamListLayoutUrl(scope, pathname)) {
                const params = liveExamListLayoutSearchParams(searchParams, next)
                const qs = params.toString()
                router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
            }
            return next
        })
    }, [pathname, router, scope, searchParams])

    return { layout, setLayout, toggleLayout }
}
