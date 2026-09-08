import { fetchSupervisionCourseStudents } from '@/lib/data/supervisionActions'
import {
    fetchInstructorCourse,
    fetchInstructorCourseStudentProfiles,
} from '@/lib/instructor/client'

export type CourseStudentRow = {
    email: string
    name: string
    state: string
}

function sortStudentRows(rows: CourseStudentRow[]): CourseStudentRow[] {
    return [...rows].sort((a, b) => a.email.localeCompare(b.email))
}

async function fetchOwnerStudentRows(courseNm: string): Promise<CourseStudentRow[]> {
    const [course, profiles] = await Promise.all([
        fetchInstructorCourse(courseNm),
        fetchInstructorCourseStudentProfiles(courseNm),
    ])

    const rows: CourseStudentRow[] = []
    for (const email of course.students.invited) {
        const profile = profiles[email]
        if (profile) {
            rows.push({
                email,
                name: profile.name || '',
                state: 'enrolled',
            })
        } else {
            rows.push({
                email,
                name: '',
                state: 'invited',
            })
        }
    }

    return sortStudentRows(rows)
}

async function fetchTutorStudentRows(courseKey: string): Promise<CourseStudentRow[]> {
    const students = await fetchSupervisionCourseStudents(courseKey)
    return sortStudentRows(
        students.map((student) => ({
            email: student.email,
            name: student.name || '',
            state: 'enrolled',
        })),
    )
}

/** Students for the course manage `/courses/[course_key]/students` tab. */
export async function fetchCourseManageStudents(data: {
    courseKey: string
    courseNm: string
    isOwner: boolean
}): Promise<CourseStudentRow[]> {
    if (data.isOwner) {
        return fetchOwnerStudentRows(data.courseNm)
    }
    return fetchTutorStudentRows(data.courseKey)
}
