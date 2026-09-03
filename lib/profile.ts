export type ProfileTab = 'index' | 'update' | 'avatar' | 'password' | 'email'

export type ProfileNavItem = {
    tab: ProfileTab
    label: string
    href: string
}

export const profileNavItems: ProfileNavItem[] = [
    { tab: 'index', label: 'Profile', href: '/profile' },
    { tab: 'update', label: 'Update', href: '/profile/update' },
    { tab: 'avatar', label: 'Avatar', href: '/profile/avatar' },
    { tab: 'password', label: 'Change password', href: '/profile/password' },
    { tab: 'email', label: 'Change email', href: '/profile/email' },
]

export function profileTabFromPathname(pathname: string): ProfileTab {
    if (pathname === '/profile/update') return 'update'
    if (pathname === '/profile/avatar') return 'avatar'
    if (pathname === '/profile/password') return 'password'
    if (pathname === '/profile/email') return 'email'
    return 'index'
}
