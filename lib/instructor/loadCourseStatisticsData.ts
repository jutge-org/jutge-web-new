import { fetchCourse } from '@/lib/data/courses'
import { fetchListsMany, studentListToInstructorList } from '@/lib/data/lists'
import {
    fetchSupervisionCourseStudents,
    fetchTutorCourseSubmissions,
    resolveTutorCourseKey,
} from '@/lib/data/supervisionActions'
import { buildHeatmapSourceData, type HeatmapSourceData } from '@/lib/instructor/courseHeatmapSourceData'
import type { Dict } from '@/lib/instructor/utils'
import jutge from '@/lib/jutge'
import type {
    AbstractProblem,
    ColorMapping,
    Course,
    CourseSubmission,
    InstructorCourse,
    InstructorList,
    StudentProfile,
} from '@/lib/jutge_api_client'

export type CourseStatisticsPageData = {
    submissions: CourseSubmission[]
    colors: ColorMapping
    course: InstructorCourse
    profiles: Dict<StudentProfile>
    lists: InstructorList[]
    abstractProblems: Dict<AbstractProblem>
    heatmap: HeatmapSourceData
}

function emptyCourseMembers() {
    return { invited: [] as string[], enrolled: [] as string[], pending: [] as string[] }
}

/** View-model compatible with existing statistics widgets (ranking, heatmap, …). */
function toStatisticsInstructorCourse(course: Course, enrolledEmails: string[]): InstructorCourse {
    return {
        course_nm: course.course_nm,
        title: course.title ?? '',
        description: course.description ?? '',
        annotation: '',
        official: course.official,
        public: course.public,
        icon: course.icon,
        created_at: '',
        updated_at: '',
        lists: course.lists,
        students: { ...emptyCourseMembers(), enrolled: enrolledEmails },
        tutors: emptyCourseMembers(),
    }
}

function profilesFromStudents(
    students: Awaited<ReturnType<typeof fetchSupervisionCourseStudents>>,
): Dict<StudentProfile> {
    return Object.fromEntries(
        students.map((student) => [
            student.email,
            { email: student.email, name: student.name?.trim() || '' },
        ]),
    )
}

/**
 * Course statistics for owners and tutors.
 * Uses tutor/student APIs so tutors are not gated behind instructor-only endpoints.
 * Pass the already-loaded course from CourseManageShell — do not re-resolve via student index keys.
 */
export async function loadCourseStatisticsData(data: {
    courseKey: string
    course: Course
}): Promise<CourseStatisticsPageData> {
    const { courseKey, course: enrolledCourse } = data

    const [students, submissions, listsByKey, abstractProblems, colors] = await Promise.all([
        fetchSupervisionCourseStudents(courseKey),
        fetchTutorCourseSubmissions(courseKey),
        fetchListsMany(jutge, enrolledCourse.lists),
        jutge.problems.getAllAbstractProblems(),
        jutge.misc.getHexColors(),
    ])

    const enrolledEmails = students.map((student) => student.email)
    const profiles = profilesFromStudents(students)
    const course = toStatisticsInstructorCourse(enrolledCourse, enrolledEmails)
    const lists = enrolledCourse.lists
        .map((listKey) => listsByKey[listKey])
        .filter((list): list is NonNullable<typeof list> => !!list)
        .map(studentListToInstructorList)

    const heatmap = buildHeatmapSourceData(course, profiles, submissions, lists, abstractProblems)

    return { course, profiles, submissions, colors, lists, abstractProblems, heatmap }
}

/** Instructor routes that only have `course_nm` resolve the tutor course key first. */
export async function loadCourseStatisticsDataByNm(course_nm: string): Promise<CourseStatisticsPageData> {
    const courseKey = await resolveTutorCourseKey(course_nm)
    if (!courseKey) {
        throw new Error(`Course key not found for ${course_nm}`)
    }
    const fetched = await fetchCourse(jutge, courseKey)
    if (!fetched) {
        throw new Error(`Course not found for ${courseKey}`)
    }
    return loadCourseStatisticsData({ courseKey, course: fetched.course })
}
