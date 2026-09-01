import {
    buildCourseKey,
    buildCourseRow,
    buildCoursesNavItems,
    buildGuestCourseRow,
    isCourseOwnedByUser,
    normalizeCourseKeyParam,
    sortCourseRows,
    sortGuestCourseRows,
    type CourseStatus,
    type CoursesData,
    type CoursesNavItem,
    type GuestCourseRow,
} from '@/lib/courses'
import jutge from '@/lib/jutge'
import { JutgeApiClient, type Course, type PublicCourse, type PublicCourses } from '@/lib/jutge_api_client'

async function resolveEnrolledCourseKey(client: JutgeApiClient, courseKeyParam: string): Promise<string | null> {
    const normalized = normalizeCourseKeyParam(courseKeyParam)
    const enrolledMap = await client.student.courses.indexEnrolled()

    if (enrolledMap[normalized]) {
        return normalized
    }

    const caseMatch = Object.keys(enrolledMap).find((key) => key.toLowerCase() === normalized.toLowerCase())
    if (caseMatch) {
        return caseMatch
    }

    for (const [apiKey, course] of Object.entries(enrolledMap)) {
        if (buildCourseKey(course.owner, course.course_nm) === normalized) {
            return apiKey
        }
    }

    return null
}

function normalizeCourseKeyForMatch(key: string): string {
    try {
        return normalizeCourseKeyParam(key).toLowerCase()
    } catch {
        return key.trim().toLowerCase()
    }
}

/**
 * Enrolled index keys and archived keys are not guaranteed to use the same spelling
 * (username vs email, casing, encoding). Treat a course as archived if any known alias matches.
 */
function isArchivedEnrolledCourse(
    archivedKeys: readonly string[],
    apiKey: string,
    course: { owner: { username: string | null; email: string }; course_nm: string },
): boolean {
    const aliases = new Set(
        [apiKey, buildCourseKey(course.owner, course.course_nm), `${course.owner.email}:${course.course_nm}`].map(
            normalizeCourseKeyForMatch,
        ),
    )

    return archivedKeys.some((archivedKey) => aliases.has(normalizeCourseKeyForMatch(archivedKey)))
}

async function resolveAvailableCourseKey(client: JutgeApiClient, courseKeyParam: string): Promise<string | null> {
    const normalized = normalizeCourseKeyParam(courseKeyParam)
    const availableMap = await client.student.courses.indexAvailable()

    if (availableMap[normalized]) {
        return normalized
    }

    const caseMatch = Object.keys(availableMap).find((key) => key.toLowerCase() === normalized.toLowerCase())
    if (caseMatch) {
        return caseMatch
    }

    for (const [apiKey, course] of Object.entries(availableMap)) {
        if (buildCourseKey(course.owner, course.course_nm) === normalized) {
            return apiKey
        }
    }

    return null
}

/**
 * Problem counts of every public course, keyed both by index key and by owner:course_nm,
 * since the public and available indexes are not guaranteed to agree on the key.
 */
async function fetchPublicProblemCounts(): Promise<Map<string, number>> {
    const publicCourses = await loadPublicCoursesIndex()
    const counts = new Map<string, number>()

    for (const [apiKey, course] of Object.entries(publicCourses)) {
        counts.set(apiKey, course.problem_count)
        counts.set(buildCourseKey(course.owner, course.course_nm), course.problem_count)
    }

    return counts
}

export async function fetchCoursesData(client: JutgeApiClient): Promise<CoursesData> {
    const [enrolledMap, availableMap, archivedKeys, profile, publicProblemCounts] = await Promise.all([
        client.student.courses.indexEnrolled(),
        client.student.courses.indexAvailable(),
        client.student.courses.getArchivedKeys(),
        client.student.profile.get(),
        fetchPublicProblemCounts(),
    ])

    const enrolledRows: ReturnType<typeof buildCourseRow>[] = []
    const archivedRows: ReturnType<typeof buildCourseRow>[] = []

    for (const [apiKey, course] of Object.entries(enrolledMap)) {
        const archived = isArchivedEnrolledCourse(archivedKeys, apiKey, course)
        const row = buildCourseRow(
            course,
            archived ? 'archived' : 'enrolled',
            apiKey,
            isCourseOwnedByUser(course.owner, profile),
        )
        if (archived) {
            archivedRows.push(row)
        } else {
            enrolledRows.push(row)
        }
    }

    const enrolled = sortCourseRows(enrolledRows)
    const archived = sortCourseRows(archivedRows)
    const available = sortCourseRows(
        Object.entries(availableMap).map(([apiKey, course]) => {
            const row = buildCourseRow(course, 'available', apiKey, isCourseOwnedByUser(course.owner, profile))
            return { ...row, problemCount: publicProblemCounts.get(row.course_key) }
        }),
    )

    return { enrolled, available, archived }
}

export async function fetchEnrolledCoursesNavItems(client: JutgeApiClient): Promise<CoursesNavItem[]> {
    const data = await fetchCoursesData(client)
    return buildCoursesNavItems(data.enrolled)
}

export type FetchedCourse = {
    courseKey: string
    course: Course
    status: CourseStatus
}

export async function fetchCourse(client: JutgeApiClient, courseKeyParam: string): Promise<FetchedCourse | null> {
    const enrolledKey = await resolveEnrolledCourseKey(client, courseKeyParam)
    if (enrolledKey) {
        try {
            const [course, archivedKeys] = await Promise.all([
                client.student.courses.getEnrolled(enrolledKey),
                client.student.courses.getArchivedKeys(),
            ])
            const status: CourseStatus = isArchivedEnrolledCourse(archivedKeys, enrolledKey, course)
                ? 'archived'
                : 'enrolled'
            return { courseKey: enrolledKey, course, status }
        } catch {
            const enrolledMap = await client.student.courses.indexEnrolled()
            const brief = enrolledMap[enrolledKey]
            if (brief) {
                const archivedKeys = await client.student.courses.getArchivedKeys()
                const status: CourseStatus = isArchivedEnrolledCourse(archivedKeys, enrolledKey, brief)
                    ? 'archived'
                    : 'enrolled'
                return { courseKey: enrolledKey, course: { ...brief, lists: [] }, status }
            }
        }
    }

    const availableKey = await resolveAvailableCourseKey(client, courseKeyParam)
    if (!availableKey) {
        return null
    }

    try {
        const course = await client.student.courses.getAvailable(availableKey)
        return { courseKey: availableKey, course, status: 'available' }
    } catch {
        const availableMap = await client.student.courses.indexAvailable()
        const brief = availableMap[availableKey]
        if (!brief) {
            return null
        }

        return { courseKey: availableKey, course: { ...brief, lists: [] }, status: 'available' }
    }
}

async function loadPublicCoursesIndex(): Promise<PublicCourses> {
    try {
        const client = jutge
        return await client.courses.indexPublic()
    } catch {
        return {}
    }
}

export const fetchPublicCoursesIndex = loadPublicCoursesIndex

async function resolvePublicCourse(
    courseKeyParam: string,
): Promise<{ courseKey: string; course: PublicCourse } | null> {
    const normalized = normalizeCourseKeyParam(courseKeyParam)
    const courses = await loadPublicCoursesIndex()

    if (courses[normalized]) {
        return { courseKey: normalized, course: courses[normalized] }
    }

    const caseMatch = Object.keys(courses).find((key) => key.toLowerCase() === normalized.toLowerCase())
    if (caseMatch) {
        return { courseKey: caseMatch, course: courses[caseMatch] }
    }

    for (const [apiKey, course] of Object.entries(courses)) {
        if (buildCourseKey(course.owner, course.course_nm) === normalized) {
            return { courseKey: apiKey, course }
        }
    }

    return null
}

export type FetchedPublicCourse = {
    courseKey: string
    course: PublicCourse
}

export async function fetchPublicCourse(courseKeyParam: string): Promise<FetchedPublicCourse | null> {
    return resolvePublicCourse(courseKeyParam)
}

async function loadPublicCourses(): Promise<GuestCourseRow[]> {
    const courses = await loadPublicCoursesIndex()
    return sortGuestCourseRows(
        Object.entries(courses).map(([courseKey, course]) => buildGuestCourseRow(course, courseKey)),
    )
}

export const fetchPublicCourses = loadPublicCourses
