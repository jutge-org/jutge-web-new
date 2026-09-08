import {
    fetchAbstractProblem,
    fetchInstructorCourse,
    fetchInstructorCourseTutorProfiles,
    fetchMiscHexColors,
    fetchTablesLanguages,
} from '@/lib/instructor/client'
import type { Dict } from '@/lib/instructor/utils'
import { fetchTutorCourseSubmissions, resolveTutorCourseKey } from '@/lib/data/supervisionActions'
import { parseProblemKey } from '@/lib/problems'
import type {
    AbstractProblem,
    ColorMapping,
    CourseSubmission,
    InstructorCourse,
    Language,
    StudentProfile,
} from '@/lib/jutge_api_client'

export type CourseProblemStatisticsPageData = {
    course: InstructorCourse
    tutorProfiles: Dict<StudentProfile>
    problem_nm: string
    submissions: CourseSubmission[]
    abstractProblem: AbstractProblem
    colors: ColorMapping
    languagesTable: Record<string, Language>
}

function filterCourseSubmissionsByProblem(submissions: CourseSubmission[], problem_nm: string): CourseSubmission[] {
    return submissions.filter((submission) => {
        const parsed = parseProblemKey(submission.problem_id)
        return (parsed.kind === 'problem_id' || parsed.kind === 'problem_nm') && parsed.problem_nm === problem_nm
    })
}

export async function loadCourseProblemStatisticsData(
    course_nm: string,
    problem_nm: string,
    courseKey?: string,
): Promise<CourseProblemStatisticsPageData> {
    const resolvedCourseKey = courseKey ?? (await resolveTutorCourseKey(course_nm))
    if (!resolvedCourseKey) {
        throw new Error(`Course key not found for ${course_nm}`)
    }

    const [course, tutorProfiles, allSubmissions, abstractProblem, colors, languagesTable] = await Promise.all([
        fetchInstructorCourse(course_nm),
        fetchInstructorCourseTutorProfiles(course_nm),
        // TODO: replace with getCourseSubmissionsForProblem when available
        fetchTutorCourseSubmissions(resolvedCourseKey),
        fetchAbstractProblem(problem_nm),
        fetchMiscHexColors(),
        fetchTablesLanguages(),
    ])

    const submissions = filterCourseSubmissionsByProblem(allSubmissions, problem_nm)

    return {
        course,
        tutorProfiles,
        problem_nm,
        submissions,
        abstractProblem,
        colors,
        languagesTable,
    }
}
