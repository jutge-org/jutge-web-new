'use client'

import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { fetchPublicCourses } from '@/lib/data/courses'
import { abstractProblemsToRows, fetchAllAbstractProblems, type ProblemRow } from '@/lib/data/problems'
import { publicCourseHref, type GuestCourseRow } from '@/lib/courses'
import { ArrowRightIcon, FileBracesCornerIcon, SignatureIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import jutge from '@/lib/jutge'
import { problemIconUrl } from '@/lib/problems'

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

// just a bunch of problems to show while the API is loading
const defaultProblems: ProblemRow[] = [
    {
        "problem_nm": "P20195",
        "title": "Solitaire game",
        "iconUrl": "https://jutge.org/img/problems-icons/ea/ea1e6017e614490885777f03a5a90fd2.webp",
        "language_ids": [
            "en"
        ],
        "driver_id": "std",
        "author": "Salvador Roura",
        "created_at": "2015-06-30T13:29:01.000Z",
        "updated_at": "2026-07-15T12:44:29.545Z"
    },
    {
        "problem_nm": "P47610",
        "title": "Never trust Ivan",
        "iconUrl": "https://jutge.org/img/problems-icons/ee/ee5a5a01c49243ab944938c0da069030.webp",
        "language_ids": [
            "en"
        ],
        "driver_id": "std",
        "author": "Ivan Geffner",
        "created_at": "2014-09-30T13:52:57.000Z",
        "updated_at": "2026-07-15T12:44:27.541Z"
    },
    {
        "problem_nm": "P56276",
        "title": "The thirty-five camels",
        "iconUrl": "https://jutge.org/img/problems-icons/d0/d0592f255c494205ae4da4096626b8c6.webp",
        "language_ids": [
            "en",
            "es"
        ],
        "driver_id": "std",
        "author": "Salvador Roura",
        "created_at": "2013-02-15T10:44:10.000Z",
        "updated_at": "2026-07-15T12:44:30.065Z"
    },
    {
        "problem_nm": "P61930",
        "title": "Multiples of three",
        "iconUrl": "https://jutge.org/img/problems-icons/bd/bd44ffa7bf9b43a8adb0900c8527672c.webp",
        "language_ids": [
            "ca",
            "en"
        ],
        "driver_id": "std",
        "author": "Salvador Roura",
        "created_at": "2007-03-15T16:39:59.000Z",
        "updated_at": "2026-07-15T12:44:27.693Z"
    },
    {
        "problem_nm": "P41202",
        "title": "The game of trains",
        "iconUrl": "https://jutge.org/img/problems-icons/4f/4fd03728edf2407cb72f78e4f369a79d.webp",
        "language_ids": [
            "en",
            "es"
        ],
        "driver_id": "std",
        "author": "Omer Giménez",
        "created_at": "2010-07-28T13:53:41.000Z",
        "updated_at": "2026-07-15T12:44:27.363Z"
    },
    {
        "problem_nm": "P57443",
        "title": "Barcodes",
        "iconUrl": "https://jutge.org/img/problems-icons/ea/ea6b1b27304e448783ccb678ea0c8020.webp",
        "language_ids": [
            "ca",
            "en"
        ],
        "driver_id": "std",
        "author": "Jordi Petit",
        "created_at": "2010-07-28T13:55:31.000Z",
        "updated_at": "2026-07-15T12:44:30.113Z"
    },
    {
        "problem_nm": "P88905",
        "title": "Products of matrices",
        "iconUrl": "https://jutge.org/img/problems-icons/1f/1fc95ccfdd3b4e04a48b035d73faeaee.webp",
        "language_ids": [
            "ca",
            "en"
        ],
        "driver_id": "std",
        "author": "Jordi Petit",
        "created_at": "2010-07-28T13:58:40.000Z",
        "updated_at": "2026-07-15T12:44:29.654Z"
    },
    {
        "problem_nm": "P71356",
        "title": "Old Dalmatian",
        "iconUrl": "https://jutge.org/img/problems-icons/14/14976a143c564359889c3298d6a846d5.webp",
        "language_ids": [
            "en"
        ],
        "driver_id": "std",
        "author": "Edgar Gonzàlez",
        "created_at": "2010-07-28T13:57:00.000Z",
        "updated_at": "2026-07-15T12:44:28.004Z"
    }
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

function ListItemsSkeleton({ iconClassName }: { iconClassName: string }) {
    return (
        <ul className="flex flex-col gap-0 pb-1">
            {Array.from({ length: SAMPLE_SIZE }, (_, index) => (
                <li key={index} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className={`shrink-0 rounded-sm bg-foreground/10 ${iconClassName}`} />
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-foreground/10" />
                        <Skeleton className="h-3 w-1/2 bg-foreground/10" />
                    </div>
                </li>
            ))}
        </ul>
    )
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
            className={`relative flex flex-col overflow-hidden rounded-2xl border bg-muted p-4 shadow-sm dark:bg-card ${CARD_HEIGHT}`}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -left-8 -top-8 hidden size-40 rounded-full bg-brand/15 blur-2xl dark:block"
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
            <div
                className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-1"
                aria-busy={courses === null}
                aria-live="polite"
            >
                {courses === null ? (
                    <div role="status" aria-label="Loading courses">
                        <ListItemsSkeleton iconClassName="size-12" />
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
            className={`relative flex flex-col overflow-hidden rounded-2xl border bg-muted p-4 shadow-sm dark:bg-card ${CARD_HEIGHT}`}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-8 -left-8 hidden size-40 rounded-full bg-brand/15 blur-2xl dark:block"
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
            <div
                className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-1"
                aria-busy={problems === null}
                aria-live="polite"
            >
                {problems === null ? (
                    <div role="status" aria-label="Loading problems">
                        <ListItemsSkeleton iconClassName="size-12" />
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
    const [problems, setProblems] = useState<ProblemRow[] | null>(defaultProblems)

    useEffect(() => {
        let cancelled = false
        void fetchPublicCourses().then((rows) => {
            if (!cancelled) setCourses(filterFeaturedCourses(rows))
        })
        void jutge.problems.getSomeAbstractProblems({regexp: 'P[0-9]+', limit: SAMPLE_SIZE*4}).then((someProblems) => {
            if (!cancelled) {
                const rows: ProblemRow[] = []
                for (const aproblem of Object.values(someProblems)) {
                    const problem_id = aproblem.problem_nm + "_en"
                    if (problem_id in aproblem.problems) {
                        rows.push({
                            problem_nm: problem_id,
                            title: aproblem.problems[problem_id].title,
                            iconUrl: problemIconUrl(aproblem.icon),
                            language_ids: [aproblem.problems[problem_id].language_id],
                            driver_id: aproblem.driver_id,
                            author: aproblem.author,
                            created_at: aproblem.created_at,
                            updated_at: aproblem.updated_at,
                        })
                    }
                    if (rows.length >= SAMPLE_SIZE) break
                }
                setProblems(rows)
            }
        })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <section id="home-courses-problems" aria-labelledby="home-courses-problems-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-5xl px-0 sm:px-6">
                <motion.div
                    className="mx-auto mb-12 max-w-2xl text-center"
                    initial={false}
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
                    initial={false}
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
