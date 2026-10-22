import { invalidateCachedCall } from '@/lib/jutge'
import type { JutgeApiClient } from '@/lib/jutge_api_client'

function invalidateStudentCoursesClientCache(): void {
    invalidateCachedCall('student.courses.indexEnrolled')
    invalidateCachedCall('student.courses.indexAvailable')
    invalidateCachedCall('student.courses.getArchivedKeys')
    invalidateCachedCall('student.courses.getEnrolled')
    invalidateCachedCall('student.courses.getAvailable')
}

export async function enrollInCourse(client: JutgeApiClient, courseKey: string): Promise<void> {
    await client.student.courses.enroll(courseKey)
    invalidateStudentCoursesClientCache()
}

export async function unenrollFromCourse(client: JutgeApiClient, courseKey: string): Promise<void> {
    await client.student.courses.unenroll(courseKey)
    invalidateStudentCoursesClientCache()
}

export async function archiveCourse(client: JutgeApiClient, courseKey: string): Promise<void> {
    await client.student.courses.archive(courseKey)
    invalidateStudentCoursesClientCache()
}

export async function unarchiveCourse(client: JutgeApiClient, courseKey: string): Promise<void> {
    await client.student.courses.unArchive(courseKey)
    invalidateStudentCoursesClientCache()
}
