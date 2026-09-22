export type ProfileTab = 'index' | 'avatar' | 'password' | 'email' | 'downloads' | 'unregistration' | 'upgrade'

export type ProfileNavItem = {
    tab: ProfileTab
    label: string
    href: string
}

export const profileNavItems: ProfileNavItem[] = [
    { tab: 'index', label: 'Profile', href: '/profile' },
    { tab: 'avatar', label: 'Avatar', href: '/profile/avatar' },
    { tab: 'password', label: 'Change password', href: '/profile/password' },
    { tab: 'email', label: 'Change email', href: '/profile/email' },
    { tab: 'upgrade', label: 'Upgrade', href: '/request-instructor-account' },
    { tab: 'downloads', label: 'Downloads', href: '/profile/downloads' },
    { tab: 'unregistration', label: 'Unregistration', href: '/profile/unregistration' },
]

export function profileTabFromPathname(pathname: string): ProfileTab {
    if (pathname === '/profile/avatar') return 'avatar'
    if (pathname === '/profile/password') return 'password'
    if (pathname === '/profile/email') return 'email'
    if (pathname === '/profile/downloads') return 'downloads'
    if (pathname === '/profile/unregistration') return 'unregistration'
    if (pathname === '/request-instructor-account') return 'upgrade'
    return 'index'
}
