'use client'

import SmoothButton from '@/components/smoothui/smooth-button'
import { CheckIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'

const CARD_ANIMATION_DELAY = 0.1
const EASE_OUT = [0.22, 1, 0.36, 1] as const

type AccountPlan = {
    title: string
    tagline: string
    description: string
    features: string[]
    ctaLabel: string
    ctaHref: string
    note?: string
}

const plans: AccountPlan[] = [
    {
        title: 'Student',
        tagline: 'For learners',
        description:
            'Practice programming with instant feedback. Solve problems, follow courses, and track your progress — completely free.',
        note: 'Accounts with no activity nor submissions after 12 months may be deleted.',
        ctaLabel: 'Register',
        ctaHref: '/registration',
        features: [
            'Thousands of programming problems',
            'Submit in many languages and compilers',
            'Instant automatic judging and verdicts',
            'Submission history and activity stats',
            'Public and enrolled courses',
            'Awards and progress tracking',
        ],
    },
    {
        title: 'Instructor',
        tagline: 'For teachers',
        description:
            'Run courses, exams, and problem lists for your students. Free for educators — proof of instructor status is required.',
        note: 'Proof of instructor status is required before instructor privileges are granted.',
        ctaLabel: 'Request',
        ctaHref: '/request-instructor-account',
        features: [
            'Create and manage courses and students',
            'Build ordered problem lists',
            'Delegate teaching tasks to tutors',
            'Configure exams, rosters, and rankings',
            'Author, share, and analyze problems',
            'Upload PDF and ZIP exam documents',
            'Semantic search across statements and solutions',
            'JutgeAI assistance for teaching',
        ],
    },
]

function FeatureItem({ item }: { item: string }) {
    return (
        <li className="flex items-center gap-3 text-foreground text-sm">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground">
                <CheckIcon aria-hidden className="size-2.5 text-background" strokeWidth={3} />
            </span>
            {item}
        </li>
    )
}

export function AccountsBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-accounts" aria-labelledby="home-accounts-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-accounts-heading"
                    >
                        Student and Instructor accounts
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-balance text-foreground text-lg dark:text-foreground/70">
                        Whether you are learning or teaching, Jutge.org is free. Choose the account that fits you.
                    </p>
                </div>

                <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
                    {plans.map((plan, index) => (
                        <motion.div
                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border bg-muted/50 p-8 transition-all hover:scale-[1.02] hover:shadow-md"
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
                            key={plan.title}
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0 }
                                    : {
                                          duration: 0.3,
                                          ease: EASE_OUT,
                                          delay: index * CARD_ANIMATION_DELAY,
                                      }
                            }
                        >
                            <div className="relative flex h-full flex-col">
                                <h3 className="mb-4 font-bold text-2xl text-foreground">{plan.title} account</h3>

                                <SmoothButton asChild className="mb-6 w-full" color="accent" variant="candy">
                                    <Link href={plan.ctaHref}>{plan.ctaLabel}</Link>
                                </SmoothButton>

                                <p className="mb-6 text-foreground text-sm dark:text-foreground/70 leading-relaxed">{plan.description}</p>

                                <div className="space-y-4">
                                    <h4 className="font-medium text-foreground text-xs dark:text-foreground/70 uppercase tracking-wider">
                                        What&apos;s included:
                                    </h4>
                                    <ul className="space-y-3">
                                        {plan.features.map((item) => (
                                            <FeatureItem item={item} key={item} />
                                        ))}
                                    </ul>
                                </div>

                                {plan.note ? (
                                    <div className="mt-auto pt-8">
                                        <p className="rounded-lg border border-border/80 bg-background/60 px-3 py-2 text-foreground text-xs dark:text-foreground/80 leading-relaxed">
                                            {plan.note}
                                        </p>
                                    </div>
                                ) : null}
                            </div>

                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
