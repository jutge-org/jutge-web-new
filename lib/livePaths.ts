import type { SiteKind } from '@/lib/siteMode'

const EXACT_PATHS = new Set([
    '/',
    '/problems',
    '/submissions',
    '/finish',
    '/ranking',
    '/students',
    '/logins',
    '/statistics',
])

function isProblemPath(pathname: string): boolean {
    return pathname === '/problems' || pathname.startsWith('/problems/')
}

/** Routes the live shell is allowed to mount. Anything else is not rendered, so it does not call the API. */
export function isLivePath(pathname: string, kind: SiteKind): boolean {
    if (EXACT_PATHS.has(pathname)) return true
    if (pathname.startsWith('/documentation') || pathname.startsWith('/about')) return true
    if (pathname.startsWith('/students/')) return true
    if (kind === 'contest' && (pathname === '/watch' || pathname.startsWith('/watch/'))) return true
    return isProblemPath(pathname)
}
