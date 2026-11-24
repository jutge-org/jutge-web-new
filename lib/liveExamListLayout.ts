export type LiveExamListLayout = 'cards' | 'table'

export type LiveExamListLayoutScope = 'problems' | 'documents'

export const LIVE_EXAM_LIST_LAYOUT_PARAM = 'view'

const STORAGE_KEYS: Record<LiveExamListLayoutScope, string> = {
    problems: 'jutge:live:problems-layout',
    documents: 'jutge:live:documents-layout',
}

const PATH_BY_SCOPE: Record<LiveExamListLayoutScope, string> = {
    problems: '/problems',
    documents: '/documents',
}

export function parseLiveExamListLayout(value: string | null | undefined): LiveExamListLayout | null {
    if (value === 'cards' || value === 'table') return value
    return null
}

export function readLiveExamListLayout(scope: LiveExamListLayoutScope): LiveExamListLayout {
    if (typeof window === 'undefined') return 'cards'
    return parseLiveExamListLayout(localStorage.getItem(STORAGE_KEYS[scope])) ?? 'cards'
}

export function writeLiveExamListLayout(scope: LiveExamListLayoutScope, layout: LiveExamListLayout): void {
    try {
        localStorage.setItem(STORAGE_KEYS[scope], layout)
    } catch {
        // ignore quota / private mode
    }
}

export function liveExamListLayoutPath(scope: LiveExamListLayoutScope): string {
    return PATH_BY_SCOPE[scope]
}

export function shouldSyncLiveExamListLayoutUrl(scope: LiveExamListLayoutScope, pathname: string): boolean {
    const base = PATH_BY_SCOPE[scope]
    return pathname === base || pathname.startsWith(`${base}/`)
}

export function liveExamListLayoutSearchParams(
    current: URLSearchParams,
    layout: LiveExamListLayout,
): URLSearchParams {
    const next = new URLSearchParams(current.toString())
    if (layout === 'cards') {
        next.delete(LIVE_EXAM_LIST_LAYOUT_PARAM)
    } else {
        next.set(LIVE_EXAM_LIST_LAYOUT_PARAM, layout)
    }
    return next
}