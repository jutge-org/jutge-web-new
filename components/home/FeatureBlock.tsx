'use client'

import { GraduationCapIcon, UserIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

type FeatureCardData = {
    title: string
    tagline: string
    icon: LucideIcon
    features: string[]
    variant: 'muted' | 'card'
}

const cards: FeatureCardData[] = [
    {
        title: 'For students',
        tagline: 'Learn programming through hands-on practice with instant, meaningful feedback.',
        icon: UserIcon,
        variant: 'muted',
        features: [
            'Thousands of curated problems organized by topic and difficulty',
            'Instant automated feedback on every submission — test, correct, and resubmit',
            'Support for many programming languages',
            'Track your progress through assignments, contests, and exams',
        ],
    },
    {
        title: 'For instructors',
        tagline: 'Run programming courses with automatic grading that scales and stays consistent.',
        icon: GraduationCapIcon,
        variant: 'card',
        features: [
            'Create and manage courses with students and teaching assistants',
            'Build assignments, contests, and exams — reuse or create problems',
            'Reliable automatic assessment at scale, saving countless hours',
            'Monitor student progress through submissions and results',
        ],
    },
]

function FeatureCard({ title, tagline, icon: Icon, features, variant }: FeatureCardData) {
    return (
        <div
            className={
                variant === 'muted'
                    ? 'relative flex flex-col overflow-hidden rounded-2xl border bg-muted/50 p-8'
                    : 'relative flex flex-col overflow-hidden rounded-2xl border bg-card p-8 shadow-sm'
            }
        >
            {variant === 'muted' ? (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundSize: '22px 22px',
                        maskImage: 'radial-gradient(ellipse 80% 70% at 30% 40%, black 20%, transparent 75%)',
                    }}
                />
            ) : null}
            {variant === 'muted' ? (
                <>
                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 -right-8 size-40 -translate-y-1/2 rounded-full bg-brand/15 blur-2xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 -left-6 size-36 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl"
                    />
                </>
            ) : (
                <>
                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 -left-8 size-40 -translate-y-1/2 rounded-full bg-brand/15 blur-2xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 -right-6 size-36 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl"
                    />
                </>
            )}

            <div className="relative flex h-full flex-col">
                <div className="mb-4 flex items-center gap-3">
                    <Icon className="size-8 shrink-0 text-[var(--color-brand)]" aria-hidden />
                    <h3 className="font-bold text-2xl text-foreground tracking-tight">{title}</h3>
                </div>
                <p className="max-w-sm text-foreground text-sm dark:text-foreground/70 leading-relaxed">{tagline}</p>
                <ul className="mt-6 flex flex-col gap-3">
                    {features.map((feature) => (
                        <li key={feature} className="flex gap-3 text-foreground text-sm leading-relaxed">
                            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export function FeatureBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-features" aria-labelledby="home-features-heading" className="scroll-mt-14">
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
                        id="home-features-heading"
                    >
                        Learn programming by solving problems
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Jutge.org is a free, open educational platform purpose-built for computer science education —
                        proven through millions of automatic evaluations and years of research-backed use in real
                        university courses.
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.4, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    {cards.map((card) => (
                        <FeatureCard key={card.title} {...card} />
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
