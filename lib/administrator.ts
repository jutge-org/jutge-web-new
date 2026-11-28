export type AdministratorTab =
    | 'dashboard'
    | 'queue'
    | 'exams'
    | 'users'
    | 'instructors'
    | 'courses'
    | 'statistics'
    | 'heatmaps'
    | 'ranking'

export type AdministratorNavItem = {
    tab: AdministratorTab
    label: string
    href: string
}

export const administratorNavItems: AdministratorNavItem[] = [
    { tab: 'dashboard', label: 'Dashboard', href: '/administrator' },
    { tab: 'queue', label: 'Queue', href: '/administrator/queue' },
    { tab: 'exams', label: 'Exams', href: '/administrator/exams' },
    { tab: 'users', label: 'Users', href: '/administrator/users' },
    { tab: 'instructors', label: 'Instructors', href: '/administrator/instructors' },
    { tab: 'courses', label: 'Courses', href: '/administrator/courses' },
    { tab: 'statistics', label: 'Statistics', href: '/administrator/statistics' },
    { tab: 'heatmaps', label: 'Heatmaps', href: '/administrator/heatmaps' },
    { tab: 'ranking', label: 'Ranking', href: '/administrator/ranking' },
]

export function administratorTabFromPathname(pathname: string): AdministratorTab {
    if (pathname === '/administrator' || pathname === '/administrator/') {
        return 'dashboard'
    }

    for (const item of administratorNavItems) {
        if (item.tab === 'dashboard') continue
        if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
            return item.tab
        }
    }

    return 'dashboard'
}

export const administratorIndexItems = [
    {
        href: '/administrator/queue',
        label: 'Queue',
        description: 'Live submission queue and bulk actions',
    },
    {
        href: '/administrator/exams',
        label: 'Exams',
        description: 'Upcoming exams and contests',
    },
    {
        href: '/administrator/users',
        label: 'Users',
        description: 'Search users, remove spam, change passwords',
    },
    {
        href: '/administrator/instructors',
        label: 'Instructors',
        description: 'Manage instructor accounts',
    },
    {
        href: '/administrator/courses',
        label: 'Courses',
        description: 'Set public and official flags for all courses',
    },
    {
        href: '/administrator/statistics',
        label: 'Statistics',
        description: 'Platform-wide distributions and counters',
    },
    {
        href: '/administrator/heatmaps',
        label: 'Heatmaps',
        description: 'Submission volume calendars',
    },
    {
        href: '/administrator/ranking',
        label: 'Ranking',
        description: 'Top users by problems solved',
    },
] as const

export const administratorUsersIndexItems = [
    {
        href: '/administrator/users/list',
        label: 'List users',
        description: 'Search and browse user profiles',
    },
    {
        href: '/administrator/users/spam',
        label: 'Find spam users',
        description: 'Detect and bulk-remove spam accounts',
    },
    {
        href: '/administrator/users/change-password',
        label: 'Change password',
        description: 'Set a password for a user account',
    },
] as const
