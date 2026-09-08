import { courseHref } from '@/lib/courses'

export type CourseDetailTab = 'lists' | 'students' | 'statistics' | 'submissions'

export type CourseDetailNavItem = {
    tab: CourseDetailTab
    label: string
    href: string
}

const COURSE_DETAIL_TABS: readonly CourseDetailTab[] = ['lists', 'students', 'submissions', 'statistics']

const COURSE_DETAIL_LABELS: Record<CourseDetailTab, string> = {
    lists: 'Problems',
    students: 'Students',
    submissions: 'Submissions',
    statistics: 'Statistics',
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
