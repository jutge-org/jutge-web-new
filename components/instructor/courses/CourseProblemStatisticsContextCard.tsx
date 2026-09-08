'use client'

import { ExternalLink } from '@/components/ExternalLink'
import { Badge } from '@/components/ui/badge'
import { getAbstractProblemTitle } from '@/lib/instructor/courseProblemRanking'
import type { CourseProblemStatisticsPageData } from '@/lib/instructor/loadCourseProblemStatisticsData'
import { cn } from '@/lib/utils'
import {
    ArrowLeftIcon,
    BarChart3Icon,
    BookOpenIcon,
    GlobeIcon,
    FileBracesCornerIcon,
    ShieldCheckIcon,
    SignatureIcon,
    UsersIcon,
} from 'lucide-react'
import Link from 'next/link'

type CourseProblemStatisticsContextCardProps = {
    data: Pick<
        CourseProblemStatisticsPageData,
        'course' | 'tutorProfiles' | 'problem_nm' | 'abstractProblem' | 'submissions'
    >
    courseStatsHref?: string
    courseHref?: string
}

function formatTutorNames(data: CourseProblemStatisticsContextCardProps['data']): string {
    const names = data.course.tutors.enrolled
        .map((email) => data.tutorProfiles[email]?.name?.trim())
        .filter((name): name is string => Boolean(name))

    if (names.length > 0) {
        return names.join(', ')
    }

    const emails = data.course.tutors.enrolled
    if (emails.length === 1) return emails[0]!
    if (emails.length > 1) return emails.join(', ')
    return 'No tutors listed'
}

export function CourseProblemStatisticsContextCard({
    data,
    courseStatsHref,
    courseHref,
}: CourseProblemStatisticsContextCardProps) {
    const { course, problem_nm, abstractProblem, submissions } = data
    const problemTitle = getAbstractProblemTitle(problem_nm, { [problem_nm]: abstractProblem })
    const author = abstractProblem.author?.trim()
    const tutorLabel = formatTutorNames(data)
    const studentCount = course.students.enrolled.length + course.students.invited.length
    const statsHref = courseStatsHref ?? `/instructor/courses/${course.course_nm}/statistics`
    const coursePageHref = courseHref ?? `/instructor/courses/${course.course_nm}/properties`

    return (
        <section
            aria-label="Problem and course context"
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
            <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3Icon className="size-4 shrink-0 text-primary" aria-hidden />
                    <span>Statistics scoped to this course</span>
                </div>
                <Link
                    href={statsHref}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                    <ArrowLeftIcon className="size-4" aria-hidden />
                    Back to course statistics
                </Link>
            </div>

            <div className="grid gap-0 lg:grid-cols-2">
                <div className="flex flex-col gap-3 border-b border-border/70 p-5 lg:border-b-0 lg:border-r">
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                                'bg-violet-500/10 text-violet-700 dark:text-violet-300',
                            )}
                            aria-hidden
                        >
                            <FileBracesCornerIcon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Problem</p>
                            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <ExternalLink
                                    href={`https://jutge.org/problems/${problem_nm}`}
                                    className="text-lg font-semibold text-primary"
                                >
                                    {problem_nm}
                                </ExternalLink>
                            </div>
                            <p className="mt-1 text-base font-medium leading-snug text-foreground">
                                {problemTitle || 'Untitled problem'}
                            </p>
                            {author ? (
                                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <SignatureIcon className="size-3.5 shrink-0" aria-hidden />
                                    <span>{author}</span>
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 p-5">
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                                'bg-sky-500/10 text-sky-700 dark:text-sky-300',
                            )}
                            aria-hidden
                        >
                            <BookOpenIcon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Course</p>
                            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <Link
                                    href={coursePageHref}
                                    className="text-lg font-semibold text-foreground hover:text-primary hover:underline"
                                >
                                    {course.course_nm}
                                </Link>
                            </div>
                            <p className="mt-1 text-base font-medium leading-snug text-foreground">
                                {course.title.trim() || course.course_nm}
                            </p>
                            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <UsersIcon className="size-3.5 shrink-0" aria-hidden />
                                <span>
                                    <span className="font-medium text-foreground">{tutorLabel}</span>
                                    <span className="text-muted-foreground"> · course owner</span>
                                </span>
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {course.official !== 0 ? (
                                    <Badge variant="outline" className="gap-1">
                                        <ShieldCheckIcon className="size-3" aria-hidden />
                                        Official
                                    </Badge>
                                ) : null}
                                {course.public !== 0 ? (
                                    <Badge variant="outline" className="gap-1">
                                        <GlobeIcon className="size-3" aria-hidden />
                                        Public
                                    </Badge>
                                ) : null}
                                <Badge variant="secondary" className="gap-1 tabular-nums">
                                    <UsersIcon className="size-3" aria-hidden />
                                    {studentCount} students
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-border/70 bg-muted/20 px-5 py-3 text-sm text-muted-foreground">
                <span className="font-medium tabular-nums text-foreground">{submissions.length}</span>
                {' submission'}
                {submissions.length === 1 ? '' : 's'} from this course used in the charts below.
            </div>
        </section>
    )
}
