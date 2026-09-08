import { courseHref } from '@/lib/courses'

export type CourseDetailTab = 'lists' | 'students' | 'statistics' | 'ranking' | 'calendar'

export type CourseDetailNavItem = {
    tab: CourseDetailTab
    label: string
    href: string
}

const COURSE_DETAIL_TABS: readonly CourseDetailTab[] = [
    'lists',
    'students',
    'statistics',
    'ranking',
    'calendar',
]

const COURSE_DETAIL_LABELS: Record<CourseDetailTab, string> = {
    lists: 'Lists',
    students: 'Students',
    statistics: 'Statistics',
    ranking: 'Ranking',
    calendar: 'Calendar',
}

export function courseDetailNavItems(courseKey: string): CourseDetailNavItem[] {
    const base = courseHref(courseKey)
    return COURSE_DETAIL_TABS.map((tab) => ({
        tab,
        label: COURSE_DETAIL_LABELS[tab],
        href: tab === 'lists' ? base : `${base}/${tab}`,
    }))
}

export function courseDetailTabFromPathname(pathname: string, courseKey: string): CourseDetailTab {
    const base = courseHref(courseKey)

    for (const tab of COURSE_DETAIL_TABS) {
        if (tab === 'lists') {
            continue
        }
        if (pathname === `${base}/${tab}` || pathname.startsWith(`${base}/${tab}/`)) {
            return tab
        }
    }

    return 'lists'
}
