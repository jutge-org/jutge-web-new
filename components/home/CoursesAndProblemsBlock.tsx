'use client'

import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { fetchPublicCourses } from '@/lib/data/courses'
import { fetchAllAbstractProblems, type ProblemRow } from '@/lib/data/problems'
import { publicCourseHref, type GuestCourseRow } from '@/lib/courses'
import { ArrowRightIcon, FileBracesCornerIcon, SignatureIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const CARD_HEIGHT = 'min-h-96 h-96 md:h-96'
const SAMPLE_SIZE = 8

/** Featured public courses shown on the home page, ordered by preference. Values are course keys (`username:course_nm`). */
const FEATURED_COURSE_NMS = [
    'Jutge:Programming',
    'Jutge:Algorithms',
    'Jutge:Graphic_Problems',
    'JordiCortadella:IntroCircuits',
    'Jutge:Haskell',
    'GerardEscudero:clojureCAP',
    'Jutge:oicat_problems',
    'Jutge:OIE',
]

function filterFeaturedCourses(courses: GuestCourseRow[]): GuestCourseRow[] {
    const byKey = new Map(courses.map((course) => [course.course_key, course]))
    const featured = FEATURED_COURSE_NMS.flatMap((courseKey) => {
        const course = byKey.get(courseKey)
        return course ? [course] : []
    })
    for (let i = featured.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[featured[i], featured[j]] = [featured[j], featured[i]]
    }
    return featured
}

function pickRandomProblems(problems: ProblemRow[]): ProblemRow[] {
    const eligible = problems.filter(
        (problem) => problem.problem_nm.startsWith('P') && problem.language_ids.includes('en'),
    )
    for (let i = eligible.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[eligible[i], eligible[j]] = [eligible[j], eligible[i]]
    }
    return eligible.slice(0, SAMPLE_SIZE)
}

function CourseListItem({ course }: { course: GuestCourseRow }) {
    return (
        <li>
            <Link
                href={publicCourseHref(course.course_key)}
                className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <CourseIconImage iconUrl={course.iconUrl} size="sm" />
                <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground text-sm">{course.title}</div>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
                        <SignatureIcon className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">{course.ownerName}</span>
                    </div>
                </div>
            </Link>
        </li>
    )
}

function ProblemListItem({ problem }: { problem: ProblemRow }) {
    return (
        <li>
            <Link
                href={`/problems/${problem.problem_nm}_en`}
                className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                {problem.iconUrl ? (
                    <ProblemIconImage iconUrl={problem.iconUrl} size="md" className="shrink-0" />
                ) : (
                    <span
                        className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground"
                        aria-hidden
                    >
                        <FileBracesCornerIcon className="size-5" />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground text-sm">{problem.title}</div>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
                        {problem.author ? (
                            <>
                                <SignatureIcon className="size-3 shrink-0" aria-hidden />
                                <span className="truncate">{problem.author}</span>
                            </>
                        ) : null}
                    </div>
                </div>
            </Link>
        </li>
    )
}

function CoursesListCard({ courses }: { courses: GuestCourseRow[] | null }) {
    return (
        <div
            className={`relative flex flex-col overflow-hidden rounded-2xl border bg-card p-4 shadow-sm ${CARD_HEIGHT}`}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -left-8 -top-8 size-40 rounded-full bg-brand/15 blur-2xl"
            />
            <div className="relative mb-2 flex shrink-0 items-center justify-between gap-2 px-2 pt-1">
                <h3 className="font-semibold text-foreground text-lg">Featured public courses</h3>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground"
                                asChild
                            >
                                <Link href="/courses/public" aria-label="Browse all public courses">
                                    <ArrowRightIcon className="size-4" aria-hidden />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Browse all public courses</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
                {courses === null ? (
                    <div className="flex h-full items-center justify-center" aria-busy="true" aria-live="polite">
                        <div
                            className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground"
                            role="status"
                            aria-label="Loading courses"
                        />
                    </div>
                ) : courses.length === 0 ? (
                    <p className="px-2 py-8 text-center text-muted-foreground text-sm">
                        No public courses available right now.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-0 pb-1">
                        {courses.map((course) => (
                            <CourseListItem key={course.course_key} course={course} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function ProblemsListCard({ problems }: { problems: ProblemRow[] | null }) {
    return (
        <div
            className={`relative flex flex-col overflow-hidden rounded-2xl border bg-card p-4 shadow-sm ${CARD_HEIGHT}`}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full bg-brand/15 blur-2xl"
            />
            <div className="relative mb-2 flex shrink-0 items-center justify-between gap-2 px-2 pt-1">
                <h3 className="font-semibold text-foreground text-lg">Sample public problems</h3>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground"
                                asChild
                            >
                                <Link href="/problems/public" aria-label="Browse all public problems">
                                    <ArrowRightIcon className="size-4" aria-hidden />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Browse all public problems</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
                {problems === null ? (
                    <div className="flex h-full items-center justify-center" aria-busy="true" aria-live="polite">
                        <div
                            className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground"
                            role="status"
                            aria-label="Loading problems"
                        />
                    </div>
                ) : problems.length === 0 ? (
                    <p className="px-2 py-8 text-center text-muted-foreground text-sm">
                        No public problems available right now.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-0 pb-1">
                        {problems.map((problem) => (
                            <ProblemListItem key={problem.problem_nm} problem={problem} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export function CoursesAndProblemsBlock() {
    const shouldReduceMotion = useReducedMotion()
    const [courses, setCourses] = useState<GuestCourseRow[] | null>(null)
    const [problems, setProblems] = useState<ProblemRow[] | null>(null)

    useEffect(() => {
        let cancelled = false
        void fetchPublicCourses().then((rows) => {
            if (!cancelled) setCourses(filterFeaturedCourses(rows))
        })
        void fetchAllAbstractProblems('en').then((rows) => {
            if (!cancelled) setProblems(pickRandomProblems(rows))
        })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <section id="home-courses-problems" aria-labelledby="home-courses-problems-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    className="mx-auto mb-12 max-w-2xl text-center"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-courses-problems-heading"
                    >
                        Courses and problems
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Enroll in public courses or courses by your instructors, and solve graded problems by yourself.
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.4, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <CoursesListCard courses={courses} />
                    <ProblemsListCard problems={problems} />
                </motion.div>
            </div>
        </section>
    )
}
