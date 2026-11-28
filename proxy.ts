import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { EXAM_SITE_PREFIX, isExamSitePath, isLiveKind, resolveSiteModeFromRequest } from '@/lib/siteMode'

const REWRITE_HEADER = 'x-exam-site-rewrite'
const MISSING_PATH = '/__missing'

function skipPath(pathname: string): boolean {
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return true
    return pathname.includes('.')
}

function missing(request: NextRequest) {
    const url = request.nextUrl.clone()
    url.pathname = MISSING_PATH
    return NextResponse.rewrite(url)
}

function rewriteExamSite(request: NextRequest) {
    const url = request.nextUrl.clone()
    const { pathname } = url
    url.pathname = pathname === '/' ? EXAM_SITE_PREFIX : `${EXAM_SITE_PREFIX}${pathname}`
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(REWRITE_HEADER, '1')
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    if (skipPath(pathname)) return NextResponse.next()

    if (request.headers.get(REWRITE_HEADER) === '1' && isExamSitePath(pathname)) {
        return NextResponse.next()
    }

    const site = resolveSiteModeFromRequest(request.headers.get('host'), request.headers.get('x-forwarded-host'))
    const live = isLiveKind(site.kind)

    if (pathname === MISSING_PATH) return NextResponse.next()

    if (!live) {
        if (isExamSitePath(pathname)) return missing(request)
        return NextResponse.next()
    }

    // Ranking is allowed on exam hosts (controllers); participants are gated in LiveRankingPage.
    if (site.kind === 'exam' && (pathname === '/watch' || pathname.startsWith('/watch/'))) {
        return missing(request)
    }

    if (isExamSitePath(pathname)) return missing(request)

    return rewriteExamSite(request)
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
