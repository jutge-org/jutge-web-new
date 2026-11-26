export type SiteKind = 'normal' | 'exam' | 'contest'

export type SiteResolution = {
    kind: SiteKind
    /** Set only for exam and contest. Normal mode leaves the client URL alone. */
    apiUrl: string | null
}

export const NORMAL_API_URL = process.env.NEXT_PUBLIC_JUTGE_API_URL?.trim() || 'https://api.jutge.org/api'
export const EXAM_API_URL = process.env.NEXT_PUBLIC_JUTGE_EXAM_API_URL?.trim() || 'https://exam.api.jutge.org/api'
export const CONTEST_API_URL =
    process.env.NEXT_PUBLIC_JUTGE_CONTEST_API_URL?.trim() || 'https://contest.api.jutge.org/api'

const NORMAL_HOSTS = new Set(['www.jutge.net', 'jutge.net', 'www.jutge.org', 'jutge.org', 'new.jutge.org'])

const EXAM_HOSTS = new Set(['exam.jutge.net', 'exam.jutge.org', 'exambach.jutge.net'])

const CONTEST_HOSTS = new Set(['contest.jutge.net', 'contest.jutge.org', 'contestbach.jutge.net'])

const API_URL_BY_KIND: Record<SiteKind, string | null> = {
    normal: null,
    exam: EXAM_API_URL,
    contest: CONTEST_API_URL,
}

type HostOverride = Partial<Record<string, SiteKind>>

function hostOverrides(): HostOverride {
    const raw = process.env.NEXT_PUBLIC_SITE_MODE_HOSTS
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>
        const overrides: HostOverride = {}
        for (const [host, kind] of Object.entries(parsed)) {
            if (kind === 'normal' || kind === 'exam' || kind === 'contest') {
                overrides[hostnameOf(host)] = kind
            }
        }
        return overrides
    } catch {
        return {}
    }
}

const OVERRIDES = hostOverrides()

export function hostnameOf(value: string | null | undefined): string {
    if (!value) return ''
    const trimmed = value.trim().toLowerCase()
    if (trimmed.startsWith('[')) {
        const end = trimmed.indexOf(']')
        return end === -1 ? trimmed : trimmed.slice(1, end)
    }
    return trimmed.split(':')[0] ?? ''
}

export function isLiveKind(kind: SiteKind): kind is 'exam' | 'contest' {
    return kind === 'exam' || kind === 'contest'
}

/** Exam and contest APIs do not expose `student.settings.get` / `student.settings.set`. */
export function supportsStudentSettingsApi(kind: SiteKind): boolean {
    return !isLiveKind(kind)
}

export function isStudentSettingsApiAvailable(hostname?: string): boolean {
    if (typeof window === 'undefined') {
        return false
    }
    const host = hostname ?? window.location.hostname
    return supportsStudentSettingsApi(resolveSiteMode(host).kind)
}

/** Internal prefix for the exam route tree. Public URLs never include it. */
export const EXAM_SITE_PREFIX = '/exam-site'

export function isExamSitePath(pathname: string): boolean {
    return pathname === EXAM_SITE_PREFIX || pathname.startsWith(`${EXAM_SITE_PREFIX}/`)
}

/** Browser path for a pathname that may still carry the internal exam prefix. */
export function toPublicPathname(pathname: string): string {
    if (pathname === EXAM_SITE_PREFIX) return '/'
    if (pathname.startsWith(`${EXAM_SITE_PREFIX}/`)) {
        const rest = pathname.slice(EXAM_SITE_PREFIX.length)
        return rest || '/'
    }
    return pathname
}

export function siteBrand(kind: SiteKind): string {
    if (kind === 'exam') return 'Jutge.org: Exam'
    if (kind === 'contest') return 'Jutge.org: Contest'
    return 'Jutge.org'
}

export function resolveSiteMode(hostname: string): SiteResolution {
    const host = hostnameOf(hostname)
    const overridden = OVERRIDES[host]
    if (overridden) {
        return { kind: overridden, apiUrl: API_URL_BY_KIND[overridden] }
    }
    if (EXAM_HOSTS.has(host)) return { kind: 'exam', apiUrl: EXAM_API_URL }
    if (CONTEST_HOSTS.has(host)) return { kind: 'contest', apiUrl: CONTEST_API_URL }
    if (NORMAL_HOSTS.has(host)) return { kind: 'normal', apiUrl: null }
    return { kind: 'normal', apiUrl: null }
}

export function isExplicitNormalHost(hostname: string): boolean {
    const host = hostnameOf(hostname)
    if (OVERRIDES[host] === 'normal') return true
    return NORMAL_HOSTS.has(host)
}

/**
 * Public site host for one deployment behind a proxy.
 * A recognized Host wins. An unrecognized Host (an internal proxy name) falls
 * through to the first x-forwarded-host value. The browser client does not
 * send that header to the API.
 */
export function resolveSiteModeFromRequest(hostHeader: string | null, forwardedHost: string | null): SiteResolution {
    const host = hostnameOf(hostHeader)
    const fromHost = resolveSiteMode(host)
    if (fromHost.kind !== 'normal' || isExplicitNormalHost(host)) return fromHost
    const forwarded = hostnameOf(forwardedHost?.split(',')[0] ?? null)
    if (!forwarded) return fromHost
    return resolveSiteMode(forwarded)
}

type ApiClientEndpoint = {
    JUTGE_API_URL: string
    headers: Record<string, string>
}

/** Point the browser client at the exam or contest API. Normal mode is a no-op. */
export function applyLiveApiClient(client: ApiClientEndpoint, site: SiteResolution): void {
    if (site.kind === 'normal' || site.apiUrl === null) return
    client.JUTGE_API_URL = site.apiUrl
    delete client.headers['x-forwarded-host']
}
