import dayjs from 'dayjs'

import {
    fetchSupervisionCourseStudents,
    fetchTutorCourseSubmissions,
} from '@/lib/data/supervisionActions'
import type { Compiler, CourseSubmission, Verdict } from '@/lib/jutge_api_client'
import jutge from '@/lib/jutge'
import { parseProblemKey } from '@/lib/problems'
import { supervisionHref, supervisionSubmissionHref } from '@/lib/supervision'

export const COURSE_SUBMISSIONS_LIMIT = 1000

export type CourseSubmissionRow = {
    rowKey: string
    time: string
    name: string
    email: string
    studentHref: string
    problem_id: string
    problem_nm: string
    problemHref: string
    submission_id: string
    submissionHref: string
    verdict: string
    compiler_id: string
}

export type CourseSubmissionsPageData = {
    rows: CourseSubmissionRow[]
    compilers: Record<string, Compiler>
    verdicts: Record<string, Verdict>
}

/** Same date formatting as `/administrator/queue`. */
export function formatCourseSubmissionTime(datetime: string | number, isMobile: boolean): string {
    if (isMobile) {
        return dayjs(datetime).format('HH:mm:ss')
    }
    const value = dayjs(datetime)
    const current_date = dayjs().format('YYYY-MM-DD')
    const date = value.format('YYYY-MM-DD')
    const time = value.format('HH:mm:ss')
    return current_date === date ? time : `${date} ${time}`
}

function problemNmFromSubmission(submission: CourseSubmission): string {
    const parsed = parseProblemKey(submission.problem_id)
    if (parsed.kind === 'problem_id' || parsed.kind === 'problem_nm') {
        return parsed.problem_nm
    }
    return submission.problem_id
}

/** Latest course submissions for the `/courses/[course_key]/submissions` tab. */
export async function fetchCourseSubmissionsPageData(data: {
    courseKey: string
}): Promise<CourseSubmissionsPageData> {
    const [students, submissions, compilers, verdicts] = await Promise.all([
        fetchSupervisionCourseStudents(data.courseKey),
        fetchTutorCourseSubmissions(data.courseKey),
        jutge.tables.getCompilers(),
        jutge.tables.getVerdicts(),
    ])

    const nameByEmail = new Map(students.map((student) => [student.email, student.name?.trim() || student.email]))

    const sorted = [...submissions].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf())

    const rows = sorted.slice(0, COURSE_SUBMISSIONS_LIMIT).map((submission, index) => {
        const problem_nm = problemNmFromSubmission(submission)
        const parsed = parseProblemKey(submission.problem_id)
        const problemHref =
            parsed.kind === 'problem_id' ? `/problems/${parsed.problem_nm}` : `/problems/${submission.problem_id}`
        const supervisionCtx = { courseKey: data.courseKey, email: submission.email }
        return {
            rowKey: `${submission.time}\0${submission.email}\0${submission.problem_id}\0${submission.submission_id}\0${index}`,
            time: submission.time,
            name: nameByEmail.get(submission.email) || submission.email,
            email: submission.email,
            studentHref: supervisionHref(data.courseKey, submission.email),
            problem_id: submission.problem_id,
            problem_nm,
            problemHref,
            submission_id: submission.submission_id,
            submissionHref: supervisionSubmissionHref(
                supervisionCtx,
                submission.problem_id,
                submission.submission_id,
            ),
            verdict: submission.verdict,
            compiler_id: submission.compiler_id,
        }
    })

    return { rows, compilers, verdicts }
}
