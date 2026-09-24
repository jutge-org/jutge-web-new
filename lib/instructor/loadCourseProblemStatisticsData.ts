import { fetchCourse } from '@/lib/data/courses'
import { fetchTutorCourseSubmissions, resolveTutorCourseKey } from '@/lib/data/supervisionActions'
import {
    fetchAbstractProblem,
    fetchInstructorCourse,
    fetchMiscHexColors,
    fetchTablesLanguages,
} from '@/lib/instructor/client'
import jutge from '@/lib/jutge'
import type {
    AbstractProblem,
    ColorMapping,
    CourseSubmission,
    InstructorCourse,
    Language,
    PublicProfile,
} from '@/lib/jutge_api_client'
import { parseProblemKey } from '@/lib/problems'

export type CourseProblemStatisticsPageData = {
    course: InstructorCourse
    ownerName: string | null
    problem_nm: string
    submissions: CourseSubmission[]
    abstractProblem: AbstractProblem
    colors: ColorMapping
    languagesTable: Record<string, Language>
}

function ownerNameFromProfile(owner: PublicProfile): string {
    return owner.name.trim() || owner.username?.trim() || owner.email
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

    const [course, enrolledCourse, allSubmissions, abstractProblem, colors, languagesTable] = await Promise.all([
        fetchInstructorCourse(course_nm),
        fetchCourse(jutge, resolvedCourseKey),
        // TODO: replace with getCourseSubmissionsForProblem when available
        fetchTutorCourseSubmissions(resolvedCourseKey),
        fetchAbstractProblem(problem_nm),
        fetchMiscHexColors(),
        fetchTablesLanguages(),
    ])

    const submissions = filterCourseSubmissionsByProblem(allSubmissions, problem_nm)

    return {
        course,
        ownerName: enrolledCourse ? ownerNameFromProfile(enrolledCourse.course.owner) : null,
        problem_nm,
        submissions,
        abstractProblem,
        colors,
        languagesTable,
    }
}
