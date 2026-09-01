import { parseProblemKey } from '@/lib/problems'
import {
    buildLastSubmissionsByProblemNm,
    parseSubmissionTime,
    type LastSubmissionInfo,
    type SubmissionNavLinks,
} from '@/lib/submissions'
import type { Submission, TutorSubmission } from '@/lib/jutge_api_client'
import type { MainBreadcrumbSegment } from '@/store/MainBreadcrumbs'
import { useOpenWebSettingsStore } from '@/store/openWebSettings'

export type SupervisionCourseOption = {
    courseKey: string
    title: string
    iconUrl: string
    archived: boolean
}

export type SupervisionStudentOption = {
    email: string
    name: string
}

export type SupervisionContext = {
    courseKey: string
    email: string
    studentName?: string
}

const SUPERVISION_COURSE_STORAGE_PREFIX = 'jutge-supervision-course:'
const SUPERVISION_STUDENT_STORAGE_PREFIX = 'jutge-supervision-student:'

export function supervisionCourseStorageKey(userId: string): string {
    return `${SUPERVISION_COURSE_STORAGE_PREFIX}${userId}`
}

export function supervisionStudentStorageKey(userId: string, courseKey: string): string {
    return `${SUPERVISION_STUDENT_STORAGE_PREFIX}${userId}:${courseKey}`
}

export function parseStoredSupervisionCourseKey(
    stored: string | null,
    availableCourseKeys: readonly string[],
): string | null {
    if (!stored?.trim()) {
        return null
    }

    const courseKey = stored.trim()
    return availableCourseKeys.includes(courseKey) ? courseKey : null
}

export function parseStoredSupervisionStudentEmail(
    stored: string | null,
    availableStudentEmails: readonly string[],
): string | null {
    if (!stored?.trim()) {
        return null
    }

    const email = stored.trim()
    return availableStudentEmails.includes(email) ? email : null
}

export function supervisionHref(courseKey: string, email: string): string {
    return `/supervision/${courseKey}/${email}`
}

export function supervisionProblemHref(ctx: SupervisionContext, key: string): string {
    return `${supervisionHref(ctx.courseKey, ctx.email)}/problems/${key}`
}

export function supervisionProblemSubmissionsHref(ctx: SupervisionContext, key: string): string {
    return `${supervisionProblemHref(ctx, key)}/submissions`
}

export function supervisionSubmissionHref(ctx: SupervisionContext, problem_id: string, submission_id: string): string {
    return `${supervisionProblemHref(ctx, problem_id)}/submissions/${submission_id}`
}

export function supervisionSubmissionCodeHref(
    ctx: SupervisionContext,
    problem_id: string,
    submission_id: string,
): string {
    return `${supervisionSubmissionHref(ctx, problem_id, submission_id)}/code`
}

export function supervisionSubmissionTestcaseHref(
    ctx: SupervisionContext,
    problem_id: string,
    submission_id: string,
    testcase: string,
): string {
    return `${supervisionSubmissionHref(ctx, problem_id, submission_id)}/diffs/${testcase}`
}

export function supervisionSubmissionTestcaseDiffHref(
    ctx: SupervisionContext,
    problem_id: string,
    submission_id: string,
    testcase: string,
): string {
    return `${supervisionSubmissionTestcaseHref(ctx, problem_id, submission_id, testcase)}/diff`
}

export function storeSupervisionCoursePreference(_userId: string, courseKey: string): void {
    useOpenWebSettingsStore.getState().setSupervisionLastCourse(courseKey)
}

export type SupervisionProblemTab = 'statement' | 'submissions'

export type SupervisionProblemNavItem = {
    tab: SupervisionProblemTab
    label: string
    href: string
}

export function supervisionProblemNavItems(ctx: SupervisionContext, pageKey: string): SupervisionProblemNavItem[] {
    return [
        { tab: 'statement', label: 'Statement', href: supervisionProblemHref(ctx, pageKey) },
        { tab: 'submissions', label: 'Submissions', href: supervisionProblemSubmissionsHref(ctx, pageKey) },
    ]
}

export function supervisionProblemTabFromPathname(
    pathname: string,
    pageKey: string,
    ctx: SupervisionContext,
): SupervisionProblemTab {
    const base = supervisionProblemHref(ctx, pageKey)

    if (pathname.startsWith(`${base}/submissions`)) {
        return 'submissions'
    }

    return 'statement'
}

export function buildSupervisionLastSubmissionsByProblemNm(
    submissions: TutorSubmission[],
    ctx: SupervisionContext,
): Record<string, LastSubmissionInfo> {
    const latest = buildLastSubmissionsByProblemNm(submissions as Submission[])
    const result: Record<string, LastSubmissionInfo> = {}

    for (const [problem_nm, info] of latest) {
        const matching = submissions
            .filter((s) => {
                const p = parseProblemKey(s.problem_id)
                return (p.kind === 'problem_id' || p.kind === 'problem_nm') && p.problem_nm === problem_nm
            })
            .sort((a, b) => parseSubmissionTime(b.time_in).getTime() - parseSubmissionTime(a.time_in).getTime())

        const latestSubmission = matching.find((s) => s.submission_id === info.submission_id) ?? matching[0]
        if (!latestSubmission) {
            continue
        }

        result[problem_nm] = {
            submission_id: info.submission_id,
            submissionHref: supervisionSubmissionHref(ctx, latestSubmission.problem_id, info.submission_id),
        }
    }

    return result
}

export function buildSupervisionSubmissionNavLinks(
    submissions: Submission[],
    currentSubmissionId: string,
    ctx: SupervisionContext,
    pageKey: string,
    subpath = '',
): SubmissionNavLinks | null {
    const sorted = [...submissions].sort(
        (a, b) => parseSubmissionTime(b.time_in).getTime() - parseSubmissionTime(a.time_in).getTime(),
    )
    const index = sorted.findIndex((submission) => submission.submission_id === currentSubmissionId)
    if (index === -1) {
        return null
    }

    const problemIdForHref = sorted[index]?.problem_id ?? pageKey
    const href = (submissionId: string) => {
        const submission = sorted.find((s) => s.submission_id === submissionId)
        const pid = submission?.problem_id ?? problemIdForHref
        return `${supervisionSubmissionHref(ctx, pid, submissionId)}${subpath}`
    }

    return {
        previousHref: index < sorted.length - 1 ? href(sorted[index + 1].submission_id) : null,
        listHref: supervisionProblemSubmissionsHref(ctx, pageKey),
        nextHref: index > 0 ? href(sorted[index - 1].submission_id) : null,
        lastHref: index > 0 ? href(sorted[0].submission_id) : null,
    }
}

export function supervisionBaseBreadcrumbs(ctx: SupervisionContext, courseTitle?: string): MainBreadcrumbSegment[] {
    const studentLabel = ctx.studentName?.trim() || ctx.email
    return [
        { title: 'Supervision', url: '/supervision' },
        { title: courseTitle ?? ctx.courseKey, url: '/supervision' },
        { title: studentLabel, url: supervisionHref(ctx.courseKey, ctx.email) },
    ]
}

export function supervisionProblemBreadcrumbs(
    ctx: SupervisionContext,
    pageKey: string,
    problem_nm: string,
    title: string,
    trail: readonly MainBreadcrumbSegment[] = [],
    courseTitle?: string,
): MainBreadcrumbSegment[] {
    return [
        ...supervisionBaseBreadcrumbs(ctx, courseTitle),
        { title: problem_nm, url: supervisionProblemHref(ctx, problem_nm) },
        { title, url: supervisionProblemHref(ctx, pageKey) },
        ...trail,
    ]
}
