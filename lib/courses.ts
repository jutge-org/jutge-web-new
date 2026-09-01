import type { AbstractStatus, BriefCourse, Profile, PublicCourse, PublicProfile } from '@/lib/jutge_api_client'
import { includesForSearch } from '@/lib/utils'

export type CourseStatus = 'enrolled' | 'available' | 'archived'

/** How many problems of a set have been accepted, partially scored or rejected. */
export type ProblemStatusCounts = {
    total: number
    ok: number
    scored: number
    ko: number
}

/**
 * Tallies problem statuses. `problemNms` may repeat — a problem can belong to several
 * lists of the same course — so it is deduplicated before counting.
 */
export function tallyProblemStatuses(
    problemNms: Iterable<string>,
    statuses?: Record<string, AbstractStatus>,
): ProblemStatusCounts {
    const distinct = new Set(problemNms)
    let ok = 0
    let scored = 0
    let ko = 0

    if (statuses) {
        for (const problemNm of distinct) {
            const status = statuses[problemNm]?.status
            if (status === 'accepted') {
                ok++
            } else if (status === 'scored') {
                scored++
            } else if (status === 'rejected') {
                ko++
            }
        }
    }

    return { total: distinct.size, ok, scored, ko }
}

const DEFAULT_COURSE_ICON_URL = 'https://jutge.org/img/courses-icons/default/jutge-neon.webp'

export function courseIconUrl(icon: string | null | undefined): string {
    if (!icon) {
        return DEFAULT_COURSE_ICON_URL
    }

    return `https://jutge.org/img/courses-icons/${icon}.webp`
}

export function resolveCourseIconUrl(
    courseKey: string,
    iconByKey: ReadonlyMap<string, string>,
    storedIconUrl?: string,
): string {
    return storedIconUrl ?? iconByKey.get(courseKey) ?? courseIconUrl(null)
}

export type CourseEnrollment = 'student' | 'tutor'

export type CourseRow = {
    course_key: string
    title: string
    description: string
    ownerName: string
    iconUrl: string
    isOfficial: boolean
    isPublic: boolean
    isOwner: boolean
    isTutor: boolean
    status: CourseStatus
    /** Only known for public courses, which expose it through the public index. */
    problemCount?: number
}

export type CoursesData = {
    enrolled: CourseRow[]
    available: CourseRow[]
    archived: CourseRow[]
}

export type CoursesTab = 'enrolled' | 'available' | 'archived'

export const DEFAULT_COURSES_TAB: CoursesTab = 'enrolled'

const coursesTabs: CoursesTab[] = ['enrolled', 'available', 'archived']

export const coursesPageTitles: Record<CoursesTab, string> = {
    enrolled: 'Enrolled courses',
    archived: 'Archived courses',
    available: 'Available courses',
}

export function coursesTabHref(tab: CoursesTab): string {
    return tab === DEFAULT_COURSES_TAB ? '/courses' : `/courses?tab=${tab}`
}

export function parseCoursesTab(value: string | string[] | undefined): CoursesTab {
    const raw = Array.isArray(value) ? value[0] : value
    if (raw && coursesTabs.includes(raw as CoursesTab)) {
        return raw as CoursesTab
    }
    return DEFAULT_COURSES_TAB
}

export const coursesNavItems: { tab: CoursesTab; label: string; href: string }[] = [
    { tab: 'enrolled', label: 'Enrolled', href: coursesTabHref('enrolled') },
    { tab: 'archived', label: 'Archived', href: coursesTabHref('archived') },
    { tab: 'available', label: 'Available', href: coursesTabHref('available') },
]

export type GuestCourseRow = {
    course_key: string
    title: string
    description: string
    ownerName: string
    iconUrl: string
    isOfficial: boolean
    isPublic: boolean
    problemCount: number
    lists: string[]
}

function displayText(value: string | null): string {
    return value?.trim() ?? ''
}

function ownerDisplayName(owner: PublicProfile): string {
    return displayText(owner.name) || displayText(owner.username) || owner.email
}

export function buildCourseKey(owner: PublicProfile, course_nm: string): string {
    return `${displayText(owner.username)}:${course_nm}`
}

export function courseNmFromKey(courseKey: string): string | null {
    const colonIndex = courseKey.indexOf(':')
    return colonIndex >= 0 ? courseKey.slice(colonIndex + 1) : null
}

export function instructorCoursePropertiesHref(courseKey: string): string {
    const courseNm = courseNmFromKey(courseKey)
    return courseNm ? `/instructor/courses/${courseNm}/properties` : '/instructor/courses'
}

export function readCourseEnrollment(enrollment: string): CourseEnrollment {
    return enrollment === 'tutor' ? 'tutor' : 'student'
}

export function isCourseTutor(course: Pick<BriefCourse, 'enrollment'>, isOwner: boolean): boolean {
    return !isOwner && readCourseEnrollment(course.enrollment) === 'tutor'
}

export function canSuperviseCourse(course: Pick<CourseRow, 'isOwner' | 'isTutor'>): boolean {
    return course.isOwner || course.isTutor
}

export function isCourseOwnedByUser(owner: PublicProfile, user: Pick<Profile, 'email' | 'username'>): boolean {
    if (owner.email.toLowerCase() === user.email.toLowerCase()) {
        return true
    }

    const ownerUsername = owner.username?.trim()
    const userUsername = user.username?.trim()
    if (ownerUsername && userUsername) {
        return ownerUsername.toLowerCase() === userUsername.toLowerCase()
    }

    return false
}

function readCourseIcon(course: object): string | null {
    if (!('icon' in course)) {
        return null
    }

    const icon = course.icon
    return typeof icon === 'string' || icon === null ? icon : null
}

export function buildCourseRow(
    course: BriefCourse,
    status: CourseStatus,
    courseKey?: string,
    isOwner = false,
): CourseRow {
    return {
        course_key: courseKey ?? buildCourseKey(course.owner, course.course_nm),
        title: displayText(course.title) || course.course_nm,
        description: displayText(course.description),
        ownerName: ownerDisplayName(course.owner),
        iconUrl: courseIconUrl(readCourseIcon(course)),
        isOfficial: course.official !== 0,
        isPublic: course.public !== 0,
        isOwner,
        isTutor: isCourseTutor(course, isOwner),
        status,
    }
}

export function sortCourseRows(rows: CourseRow[]): CourseRow[] {
    return [...rows].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
}

export function publicCourseHref(courseKey?: string): string {
    return courseKey ? `/courses/public#${courseKey}` : '/courses/public'
}

export function listTitleFromKey(listKey: string): string {
    const colonIndex = listKey.indexOf(':')
    return colonIndex >= 0 ? listKey.slice(colonIndex + 1) : listKey
}

export function instructorListPropertiesHref(listKey: string): string {
    return `/instructor/lists/${listTitleFromKey(listKey)}/properties`
}

export function buildGuestCourseRow(course: PublicCourse, courseKey?: string): GuestCourseRow {
    return {
        course_key: courseKey ?? buildCourseKey(course.owner, course.course_nm),
        title: displayText(course.title) || course.course_nm,
        description: displayText(course.description),
        ownerName: displayText(course.owner.name) || displayText(course.owner.username) || course.owner.email,
        iconUrl: courseIconUrl(readCourseIcon(course)),
        isOfficial: course.official !== 0,
        isPublic: course.public !== 0,
        problemCount: course.problem_count,
        lists: course.lists,
    }
}

export function sortGuestCourseRows(rows: GuestCourseRow[]): GuestCourseRow[] {
    return [...rows].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
}

export type CoursesSortField = 'title' | 'author'
export type CoursesOfficialFilter = 'all' | 'official' | 'unofficial'
export type CoursesInstructorFilter = 'all' | 'instructor' | 'non-instructor'

export type SearchableCourseRow = {
    title: string
    ownerName: string
    description: string
    isOfficial: boolean
    isOwner?: boolean
}

function matchesCourseSearch(course: SearchableCourseRow, query: string): boolean {
    if (!query) {
        return true
    }

    const haystack = [course.title, course.ownerName, course.description].join(' ')
    return includesForSearch(haystack, query)
}

function matchesCourseOfficialFilter(course: SearchableCourseRow, filter: CoursesOfficialFilter): boolean {
    switch (filter) {
        case 'all':
            return true
        case 'official':
            return course.isOfficial
        case 'unofficial':
            return !course.isOfficial
    }
}

function matchesCourseInstructorFilter(course: SearchableCourseRow, filter: CoursesInstructorFilter): boolean {
    switch (filter) {
        case 'all':
            return true
        case 'instructor':
            return course.isOwner === true
        case 'non-instructor':
            return course.isOwner !== true
    }
}

function compareCourseRows(a: SearchableCourseRow, b: SearchableCourseRow, sortField: CoursesSortField): number {
    switch (sortField) {
        case 'author':
            return a.ownerName.localeCompare(b.ownerName, undefined, { sensitivity: 'base' })
        case 'title':
            return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    }
}

export function filterAndSortCourses<T extends SearchableCourseRow>(
    courses: T[],
    searchQuery: string,
    officialFilter: CoursesOfficialFilter,
    sortField: CoursesSortField,
    instructorFilter: CoursesInstructorFilter = 'all',
): T[] {
    const query = searchQuery.trim()
    return courses
        .filter(
            (course) =>
                matchesCourseSearch(course, query) &&
                matchesCourseOfficialFilter(course, officialFilter) &&
                matchesCourseInstructorFilter(course, instructorFilter),
        )
        .sort((a, b) => compareCourseRows(a, b, sortField))
}

export type CourseStudentAction = 'enroll' | 'unenroll' | 'archive' | 'unarchive'

export function courseActionSuccessMessage(action: CourseStudentAction, title: string, ownerName: string): string {
    const course = `“${title}” by ${ownerName}`
    switch (action) {
        case 'enroll':
            return `Enrolled in ${course}`
        case 'unenroll':
            return `Unenrolled from ${course}`
        case 'archive':
            return `Archived ${course}`
        case 'unarchive':
            return `Unarchived ${course}`
    }
}

export function courseHref(courseKey: string): string {
    return `/courses/${courseKey}`
}

export function normalizeCourseKeyParam(raw: string): string {
    return decodeURIComponent(raw.trim())
}

export type CoursesNavItem = {
    href: string
    label: string
    iconUrl: string
}

export function buildCoursesNavItems(rows: CourseRow[]): CoursesNavItem[] {
    return rows.map((row) => ({
        href: courseHref(row.course_key),
        label: row.title,
        iconUrl: row.iconUrl,
    }))
}

const COURSE_LIST_ACCORDION_STORAGE_PREFIX = 'course-list-accordion:'

export function courseListAccordionStorageKey(courseKey: string): string {
    return `${COURSE_LIST_ACCORDION_STORAGE_PREFIX}${courseKey}`
}

export function parseCourseListAccordionOpenItems(
    stored: string | null,
    validListNames: string[],
    defaultOpen: string[],
): string[] {
    if (!stored) {
        return defaultOpen
    }

    try {
        const parsed: unknown = JSON.parse(stored)
        if (!Array.isArray(parsed)) {
            return defaultOpen
        }

        const validSet = new Set(validListNames)
        const filtered = parsed.filter((item): item is string => typeof item === 'string' && validSet.has(item))
        if (parsed.length === 0) {
            return []
        }
        return filtered.length > 0 ? filtered : defaultOpen
    } catch {
        return defaultOpen
    }
}
