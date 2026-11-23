import { examHasStarted } from '@/lib/data/liveExam'
import { siteBrand, type SiteKind } from '@/lib/siteMode'
import type { MainBreadcrumbSegment } from '@/store/MainBreadcrumbs'

export type LiveNavItem = {
    href: string
    label: string
}

const LIVE_META_NAV: LiveNavItem[] = [
    { href: '/interpreters', label: 'Interpreters' },
    { href: '/utilities', label: 'Utilities' },
    { href: '/documentation', label: 'Documentation' },
    { href: '/about', label: 'About' },
]

function appendLiveMetaNav(items: LiveNavItem[]): LiveNavItem[] {
    return [...items, ...LIVE_META_NAV]
}

export function liveNavItems(
    kind: SiteKind,
    role: 'student' | 'tutor' | null,
    started: boolean,
): LiveNavItem[] {
    if (role === 'tutor') {
        return [
            { href: '/', label: 'Home' },
            { href: '/problems', label: 'Problems' },
            { href: '/students', label: 'Students' },
            { href: '/submissions', label: 'Submissions' },
            { href: '/ranking', label: 'Ranking' },
            { href: '/statistics', label: 'Statistics' },
            { href: '/logins', label: 'Logins' },
            ...LIVE_META_NAV,
        ]
    }
    if (role === 'student') {
        const items: LiveNavItem[] = [
            { href: '/', label: 'Home' },
            { href: '/problems', label: 'Problems' },
            { href: '/submissions', label: 'Submissions' },
        ]
        if (kind === 'contest' && started) items.push({ href: '/ranking', label: 'Ranking' })
        return appendLiveMetaNav(items)
    }
    const items: LiveNavItem[] = [{ href: '/', label: 'Home' }]
    if (kind === 'contest') items.push({ href: '/watch', label: 'Watch' })
    return appendLiveMetaNav(items)
}

export function navIsCurrent(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
}

/** Breadcrumb trail when the page has not registered segments via MainBreadcrumbs. */
export function liveFallbackBreadcrumbs(
    pathname: string,
    brand: string,
    items: readonly LiveNavItem[],
): readonly MainBreadcrumbSegment[] {
    const byLength = [...items].sort((a, b) => b.href.length - a.href.length)
    for (const item of byLength) {
        if (navIsCurrent(pathname, item.href)) {
            if (item.href === '/') return [{ title: brand, url: '/' }]
            return [{ title: item.label, url: item.href }]
        }
    }
    return [{ title: brand, url: '/' }]
}

export function liveNavItemsForSession(
    kind: SiteKind,
    role: 'student' | 'tutor' | null,
    exam: Parameters<typeof examHasStarted>[0],
): LiveNavItem[] {
    return liveNavItems(kind, role, examHasStarted(exam))
}

export function liveSiteBrand(kind: SiteKind): string {
    return siteBrand(kind)
}