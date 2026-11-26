import { liveRankingExamProblems } from '@/lib/data/contestWatch'
import {
    fetchExamStatistics,
    fetchTutorRanking,
    type LiveTutorStatus,
} from '@/lib/data/liveExam'
import { fetchInstructorExam } from '@/lib/instructor/client'
import jutge from '@/lib/jutge'
import type {
    AbstractProblem,
    ColorMapping,
    ExamStatistics,
    InstructorExam,
    InstructorExamProblem,
    RunningExam,
} from '@/lib/jutge_api_client'

export function liveExamNmFromKey(examKey: string | null): string | null {
    if (!examKey) return null
    const separator = examKey.indexOf(':')
    if (separator < 0 || separator >= examKey.length - 1) return null
    return examKey.slice(separator + 1)
}

function examProblemsFromStatistics(statistics: ExamStatistics): InstructorExamProblem[] {
    const problemNms = new Set<string>()
    for (const group of [
        statistics.submissions,
        statistics.statuses,
        statistics.compilers,
        statistics.proglangs,
    ] as const) {
        for (const problem_nm of Object.keys(group)) {
            problemNms.add(problem_nm)
        }
    }
    return [...problemNms].sort().map((problem_nm, index) => ({
        problem_nm,
        weight: null,
        icon: null,
        caption: `P${index + 1}`,
    }))
}

function placeholderInstructorExam(input: {
    exam_nm: string
    problems: InstructorExamProblem[]
    time_start: string | null
    exp_time_start: string
}): InstructorExam {
    return {
        exam_nm: input.exam_nm,
        title: input.exam_nm,
        place: null,
        description: null,
        code: null,
        time_start: input.time_start,
        exp_time_start: input.exp_time_start,
        running_time: 0,
        visible_submissions: 0,
        started_by: null,
        contest: 0,
        instructions: null,
        avatars: null,
        anonymous: 0,
        course: { course_nm: '', title: '' },
        created_at: input.exp_time_start,
        updated_at: input.exp_time_start,
        documents: [],
        compilers: [],
        problems: input.problems,
        students: [],
    }
}

export type LiveExamStatisticsViewSource = {
    examKey: string | null
    instructor: boolean
    tutorStatus: LiveTutorStatus | null
}

export async function fetchLiveExamStatisticsViewData(
    input: LiveExamStatisticsViewSource,
): Promise<{
    exam: InstructorExam
    statistics: ExamStatistics
    abstractProblems: Record<string, AbstractProblem>
    colors: ColorMapping
}> {
    const exam_nm = liveExamNmFromKey(input.examKey)
    const exp_time_start = input.tutorStatus?.time_start ?? new Date(0).toISOString()

    const [statistics, colors] = await Promise.all([fetchExamStatistics(), jutge.misc.getHexColors()])

    let ranking = null
    try {
        ranking = await fetchTutorRanking()
    } catch {
        ranking = null
    }

    let runningExam: RunningExam | null = null
    try {
        runningExam = await jutge.student.exam.get()
    } catch {
        runningExam = null
    }

    let exam: InstructorExam | null = null
    if (input.instructor && exam_nm) {
        try {
            exam = await fetchInstructorExam(exam_nm)
        } catch {
            exam = null
        }
    }

    if (!exam) {
        let problems: InstructorExamProblem[]
        if (runningExam && runningExam.problems.length > 0) {
            problems = runningExam.problems
        } else if (ranking && ranking.length > 0) {
            problems = liveRankingExamProblems(ranking, runningExam?.problems)
        } else {
            problems = examProblemsFromStatistics(statistics)
        }
        exam = placeholderInstructorExam({
            exam_nm: exam_nm ?? '',
            problems,
            time_start: input.tutorStatus?.time_start ?? runningExam?.time_start ?? null,
            exp_time_start: runningExam?.exp_time_start ?? exp_time_start,
        })
    }

    const problem_nms = exam.problems.map((problem) => problem.problem_nm).join(',')
    const abstractProblems = problem_nms ? await jutge.problems.getAbstractProblems(problem_nms) : {}

    return { exam, statistics, abstractProblems, colors }
}