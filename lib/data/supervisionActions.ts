import { courseNmFromKey } from '@/lib/courses'
import { withSupervisorClient } from '@/lib/supervisor/client'
import type { CourseSubmission } from '@/lib/jutge_api_client'
import type { SupervisionStudentOption } from '@/lib/supervision'

/**
 * Map a URL / enrolled-index course key to the spelling returned by `tutor.courses.getCoursesKeys`.
 * Tutor endpoints 404 when the key alias does not match that list exactly.
 */
export async function resolveCanonicalTutorCourseKey(courseKey: string): Promise<string | null> {
    const trimmed = courseKey.trim()
    if (!trimmed) {
        return null
    }

    const keys = await withSupervisorClient((client) => client.tutor.courses.getCoursesKeys())
    if (keys.includes(trimmed)) {
        return trimmed
    }

    const lower = trimmed.toLowerCase()
    const caseMatch = keys.find((key) => key.toLowerCase() === lower)
    if (caseMatch) {
        return caseMatch
    }

    const targetNm = courseNmFromKey(trimmed) ?? trimmed
    const byNm = keys.filter((key) => courseNmFromKey(key) === targetNm || key === targetNm)
    if (byNm.length === 1) {
        return byNm[0]!
    }

    if (byNm.length > 1) {
        const ownerPrefix = trimmed.includes(':') ? trimmed.slice(0, trimmed.indexOf(':')) : null
        if (ownerPrefix) {
            const ownerMatch = byNm.find((key) => key.toLowerCase().startsWith(`${ownerPrefix.toLowerCase()}:`))
            if (ownerMatch) {
                return ownerMatch
            }
        }
    }

    return null
}

async function withCanonicalTutorCourseKey<T>(courseKey: string, fn: (canonicalKey: string) => Promise<T>): Promise<T> {
    const canonical = (await resolveCanonicalTutorCourseKey(courseKey)) ?? courseKey.trim()
    return fn(canonical)
}

export async function fetchSupervisionCourseStudents(courseKey: string): Promise<SupervisionStudentOption[]> {
    if (!courseKey.trim()) {
        return []
    }

    const students = await withCanonicalTutorCourseKey(courseKey, (canonicalKey) =>
        withSupervisorClient((client) => client.tutor.courses.getEnrolledStudents(canonicalKey)),
    )

    return [...students].sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        return nameCompare !== 0 ? nameCompare : a.email.localeCompare(b.email, undefined, { sensitivity: 'base' })
    })
}

/** All student submissions for a course the user can tutorize. */
export async function fetchTutorCourseSubmissions(courseKey: string): Promise<CourseSubmission[]> {
    return withCanonicalTutorCourseKey(courseKey, (canonicalKey) =>
        withSupervisorClient((client) => client.tutor.courses.getCourseSubmissions(canonicalKey)),
    )
}

/** Resolve a tutor course key for an owned/tutorized `course_nm` (e.g. instructor routes). */
export async function resolveTutorCourseKey(course_nm: string): Promise<string | null> {
    return resolveCanonicalTutorCourseKey(course_nm)
}
