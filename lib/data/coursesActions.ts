import { getCurrentClient } from '@/lib/data/auth'
import { isCourseOwnedByUser } from '@/lib/courses'
import { archiveCourse, enrollInCourse, unarchiveCourse, unenrollFromCourse } from '@/lib/data/coursesMutations'
import { fetchCourse } from '@/lib/data/courses'

type CourseActionResult = { ok: true } | { ok: false; error: string }

export async function enrollCourseAction(courseKey: string): Promise<CourseActionResult> {
    const trimmed = courseKey.trim()
    if (!trimmed) {
        return { ok: false, error: 'Course key is required.' }
    }

    try {
        const client = await getCurrentClient()
        await enrollInCourse(client, trimmed)
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to enroll in course.'
        return { ok: false, error: message }
    }
}

export async function unenrollCourseAction(courseKey: string): Promise<CourseActionResult> {
    const trimmed = courseKey.trim()
    if (!trimmed) {
        return { ok: false, error: 'Course key is required.' }
    }

    try {
        const client = await getCurrentClient()
        const [result, profile] = await Promise.all([fetchCourse(client, trimmed), client.student.profile.get()])
        if (result && isCourseOwnedByUser(result.course.owner, profile)) {
            return { ok: false, error: 'You cannot unenroll from a course you own.' }
        }

        await unenrollFromCourse(client, trimmed)
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to unenroll from course.'
        return { ok: false, error: message }
    }
}

export async function archiveCourseAction(courseKey: string): Promise<CourseActionResult> {
    const trimmed = courseKey.trim()
    if (!trimmed) {
        return { ok: false, error: 'Course key is required.' }
    }

    try {
        const client = await getCurrentClient()
        await archiveCourse(client, trimmed)
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to archive course.'
        return { ok: false, error: message }
    }
}

export async function archiveAllCoursesAction(courseKeys: string[]): Promise<CourseActionResult> {
    const keys = [...new Set(courseKeys.map((key) => key.trim()).filter(Boolean))]
    if (keys.length === 0) {
        return { ok: false, error: 'No courses to archive.' }
    }

    try {
        const client = await getCurrentClient()
        const results = await Promise.allSettled(keys.map((key) => archiveCourse(client, key)))
        const failed = results.filter((result) => result.status === 'rejected').length
        if (failed > 0) {
            return { ok: false, error: `Failed to archive ${failed} of ${keys.length} courses.` }
        }
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to archive courses.'
        return { ok: false, error: message }
    }
}

export async function unarchiveCourseAction(courseKey: string): Promise<CourseActionResult> {
    const trimmed = courseKey.trim()
    if (!trimmed) {
        return { ok: false, error: 'Course key is required.' }
    }

    try {
        const client = await getCurrentClient()
        await unarchiveCourse(client, trimmed)
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to unarchive course.'
        return { ok: false, error: message }
    }
}
