export type SiteNavLink = {
    href: string
    label: string
    match: (pathname: string) => boolean
}

export const homeLink: SiteNavLink = {
    href: '/',
    label: 'Home',
    match: (pathname) => pathname === '/',
}

const problemsLink: SiteNavLink = {
    href: '/problems',
    label: 'Problems',
    match: (pathname) => pathname === '/problems' || pathname.startsWith('/problems/'),
}

const submissionsLink: SiteNavLink = {
    href: '/submissions',
    label: 'Submissions',
    match: (pathname) => pathname === '/submissions' || pathname.startsWith('/submissions/'),
}

const examsLink: SiteNavLink = {
    href: '/exams',
    label: 'Exams',
    match: (pathname) => pathname === '/exams' || pathname.startsWith('/exams/'),
}

const coursesLink: SiteNavLink = {
    href: '/courses',
    label: 'Courses',
    match: (pathname) => pathname === '/courses' || pathname.startsWith('/courses/'),
}

const activityLink: SiteNavLink = {
    href: '/activity',
    label: 'Activity',
    match: (pathname) => pathname === '/activity',
}

const collectibleCardsLink: SiteNavLink = {
    href: '/collectible-cards',
    label: 'Collectible cards',
    match: (pathname) => pathname === '/collectible-cards' || pathname.startsWith('/collectible-cards/'),
}

/** Kept for rewiring; not included in `authenticatedLinks`. */
export const awardsLink: SiteNavLink = {
    href: '/awards',
    label: 'Awards',
    match: (pathname) => pathname === '/awards' || pathname.startsWith('/awards/'),
}

const profileLink: SiteNavLink = {
    href: '/profile',
    label: 'Profile',
    match: (pathname) => pathname === '/profile' || pathname.startsWith('/profile/'),
}

const supervisionLink: SiteNavLink = {
    href: '/supervision',
    label: 'Supervision',
    match: (pathname) => pathname === '/supervision' || pathname.startsWith('/supervision/'),
}

const instructorLink: SiteNavLink = {
    href: '/instructor',
    label: 'Instructor',
    match: (pathname) => pathname === '/instructor' || pathname.startsWith('/instructor/'),
}

const administratorLink: SiteNavLink = {
    href: '/administrator',
    label: 'Administrator',
    match: (pathname) => pathname === '/administrator' || pathname.startsWith('/administrator/'),
}

const utilitiesLink: SiteNavLink = {
    href: '/utilities',
    label: 'Utilities',
    match: (pathname) => pathname === '/utilities' || pathname.startsWith('/utilities/'),
}

const documentationLink: SiteNavLink = {
    href: '/documentation',
    label: 'Documentation',
    match: (pathname) => pathname === '/documentation' || pathname.startsWith('/documentation/'),
}

const aboutLink: SiteNavLink = {
    href: '/about',
    label: 'About',
    match: (pathname) => pathname === '/about' || pathname.startsWith('/about/'),
}

/** Compare hrefs loosely (trailing slashes) for matching menu anchors to crumbs. */
export function pathsHrefEqual(a: string, b: string): boolean {
    const norm = (p: string) => {
        if (p === '/') return '/'
        const t = p.replace(/\/+$/, '')
        return t === '' ? '/' : t
    }
    return norm(a) === norm(b)
}

const guestCoursesLink: SiteNavLink = {
    href: '/courses/public',
    label: 'Courses',
    match: (pathname) => pathname === '/courses/public' || pathname.startsWith('/courses/public'),
}

const guestProblemsLink: SiteNavLink = {
    href: '/problems/public',
    label: 'Problems',
    match: (pathname) => pathname.startsWith('/problems/'),
}

const guestLinks: readonly SiteNavLink[] = [guestCoursesLink, guestProblemsLink, documentationLink, aboutLink]

const authenticatedLinks: readonly SiteNavLink[] = [
    coursesLink,
    problemsLink,
    submissionsLink,
    examsLink,
    activityLink,
    collectibleCardsLink,
    // awardsLink, // Awards temporarily unwired
    profileLink,
    utilitiesLink,
    documentationLink,
    aboutLink,
]

export type SiteNavLinksContext = {
    authenticated: boolean
    instructor?: boolean
    tutor?: boolean
    administrator?: boolean
}

export const authenticatedNavLinkDescriptions: Record<string, string> = {
    '/': 'Return to the home page',
    '/problems': 'Browse and solve programming problems',
    '/submissions': 'Track your submissions and verdicts',
    '/exams': 'View past and upcoming exams',
    '/courses': 'Browse your courses and assignments',
    '/activity': 'Check your activity and progress',
    '/collectible-cards': 'Browse your collectible cards',
    '/awards': 'Badges and achievements you have earned',
    '/profile': 'See and update your Jutge.org profile',
    '/utilities': 'Translate text and other tools',
    '/supervision': 'Supervise a student in a course you teach',
    '/instructor': 'Manage courses, exams, and teaching tools',
    '/administrator': 'Site administration and configuration',
    '/documentation': 'Learn how to use Jutge.org',
    '/about': 'What is this site and who made it?',
}

export const guestNavLinkDescriptions: Record<string, string> = {
    '/': 'Return to the home page',
    '/problems/public': 'Browse public programming problems',
    '/courses/public': 'Browse public courses',
    '/documentation': 'Documentation for Jutge.org',
    '/about': 'Find more about this site',
}

export function getSiteNavLinkDescription(href: string, context: SiteNavLinksContext): string {
    const descriptions = context.authenticated ? authenticatedNavLinkDescriptions : guestNavLinkDescriptions
    return descriptions[href] ?? ''
}

export function getSiteNavLinks(context: SiteNavLinksContext): readonly SiteNavLink[] {
    if (!context.authenticated) return guestLinks

    const roleLinks: SiteNavLink[] = []
    if (context.instructor || context.tutor) {
        roleLinks.push(supervisionLink)
    }
    if (context.instructor) {
        roleLinks.push(instructorLink)
    }
    if (context.administrator) roleLinks.push(administratorLink)

    const profileIndex = authenticatedLinks.indexOf(profileLink)
    return [
        ...authenticatedLinks.slice(0, profileIndex + 1),
        ...roleLinks,
        ...authenticatedLinks.slice(profileIndex + 1),
    ]
}
