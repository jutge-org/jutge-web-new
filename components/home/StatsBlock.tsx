'use client'

import { RecentSubmissionsCard } from '@/components/general/RecentSubmissionsCard'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchHomepageStats } from '@/lib/data/misc'
import { fetchCompilers } from '@/lib/data/tables'
import { countActiveProglangs, getActiveCompilers } from '@/lib/documentation'
import type { HomepageStats } from '@/lib/jutge_api_client'
import {
    CodeIcon,
    FileBracesCornerIcon,
    type LucideIcon,
    SchoolIcon,
    SendIcon,
    TerminalIcon,
    TrophyIcon,
    UsersIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

const STAGGER_DELAY = 0.1
const ICON_STAGGER_OFFSET = 0.2
const VALUE_DELAY_OFFSET = 0.3

type PlatformStats = HomepageStats & {
    languages: number
    compilers: number
}

type StatsBlockProps = {
    stats: PlatformStats | null
    loading: boolean
}

const statItems: Array<{
    key: 'submissions' | 'problems' | 'users' | 'exams' | 'contests' | 'languages' | 'compilers'
    label: string
    description: string
    icon: LucideIcon
}> = [
    {
        key: 'submissions',
        label: 'Submissions',
        description: 'Programs judged on the platform',
        icon: SendIcon,
    },
    {
        key: 'problems',
        label: 'Problems',
        description: 'Programming challenges available',
        icon: FileBracesCornerIcon,
    },
    {
        key: 'users',
        label: 'Users',
        description: 'Registered learners and instructors',
        icon: UsersIcon,
    },
    {
        key: 'exams',
        label: 'Exams',
        description: 'Exams created on the platform',
        icon: SchoolIcon,
    },
    {
        key: 'contests',
        label: 'Contests',
        description: 'Programming contests hosted',
        icon: TrophyIcon,
    },
    {
        key: 'languages',
        label: 'Proglangs',
        description: 'Active programming languages',
        icon: CodeIcon,
    },
    {
        key: 'compilers',
        label: 'Compilers',
        description: 'Active compilers and interpreters',
        icon: TerminalIcon,
    },
]

function RecentSubmissionsSkeleton() {
    return (
        <div className="grid h-full grid-cols-2 gap-2" aria-hidden>
            {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex flex-col items-center justify-center gap-2">
                    <Skeleton className="size-14 rounded-full bg-foreground/10" />
                    <Skeleton className="h-3 w-6 bg-foreground/10" />
                </div>
            ))}
        </div>
    )
}

function StatsBlockView({ stats, loading }: StatsBlockProps) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-stats" aria-labelledby="home-stats-heading" aria-busy={loading} className="scroll-mt-14">
            <div className="mx-auto max-w-7xl px-0 sm:px-6">
                <motion.div
                    className="mb-16 text-center"
                    initial={false}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
                    viewport={{ once: true }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2
                        className="mb-4 font-bold text-3xl text-[var(--color-brand-title)] lg:text-4xl dark:text-foreground"
                        id="home-stats-heading"
                    >
                        Platform at a glance
                    </h2>
                    <p className="mx-auto max-w-2xl text-foreground text-lg dark:text-foreground/70">
                        Key numbers from the Jutge.org community.
                    </p>
                    {loading ? <span className="sr-only">Loading platform statistics</span> : null}
                </motion.div>

                <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                    {statItems.map((item, index) => {
                        const Icon = item.icon
                        const value = stats?.[item.key]

                        return (
                            <motion.div
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="group relative overflow-hidden rounded-xl border bg-primary/5 p-6 ring-1 ring-primary/10 transition-all hover:scale-[1.02] hover:shadow-md"
                                initial={false}
                                key={item.key}
                                transition={
                                    shouldReduceMotion
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.6,
                                              delay: index * STAGGER_DELAY,
                                              type: 'spring' as const,
                                              stiffness: 100,
                                          }
                                }
                            >
                                <motion.div
                                    animate={{ rotate: 0, scale: 1 }}
                                    className="mb-4 text-3xl"
                                    initial={false}
                                    transition={
                                        shouldReduceMotion
                                            ? { duration: 0 }
                                            : {
                                                  duration: 0.6,
                                                  delay: index * STAGGER_DELAY + ICON_STAGGER_OFFSET,
                                                  type: 'spring' as const,
                                                  stiffness: 200,
                                              }
                                    }
                                >
                                    <Icon className="size-8 text-[var(--color-brand)]" aria-hidden />
                                </motion.div>

                                <motion.div
                                    animate={{ scale: 1 }}
                                    className="mb-1 font-bold text-2xl text-foreground tabular-nums lg:text-3xl"
                                    initial={false}
                                    transition={
                                        shouldReduceMotion
                                            ? { duration: 0 }
                                            : {
                                                  duration: 0.8,
                                                  delay: index * STAGGER_DELAY + VALUE_DELAY_OFFSET,
                                                  type: 'spring' as const,
                                                  stiffness: 200,
                                              }
                                    }
                                >
                                    {loading ? (
                                        <Skeleton className="inline-block h-8 w-20 bg-foreground/10 lg:h-9" />
                                    ) : (
                                        (value ?? 0).toLocaleString()
                                    )}
                                </motion.div>

                                <h3 className="mb-2 font-semibold text-foreground text-sm uppercase tracking-wide">
                                    {item.label}
                                </h3>
                                <p className="hidden text-foreground text-xs sm:block dark:text-foreground/70">
                                    {item.description}
                                </p>

                                <motion.div
                                    className="absolute inset-0 hidden bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 dark:block"
                                    initial={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ opacity: 1 }}
                                />
                            </motion.div>
                        )
                    })}

                    {loading || stats?.recent_submissions ? (
                        <motion.div
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="group relative overflow-hidden rounded-xl border bg-primary/5 p-6 ring-1 ring-primary/10 transition-all hover:scale-[1.02] hover:shadow-md"
                            initial={false}
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0 }
                                    : {
                                          duration: 0.6,
                                          delay: statItems.length * STAGGER_DELAY,
                                          type: 'spring' as const,
                                          stiffness: 100,
                                      }
                            }
                        >
                            {stats?.recent_submissions ? (
                                <RecentSubmissionsCard
                                    className="h-full justify-center border-0 border-t-0 bg-transparent p-0 pt-0 shadow-none"
                                    gridClassName="grid-cols-2 gap-2"
                                    recentSubmissions={stats.recent_submissions}
                                />
                            ) : (
                                <RecentSubmissionsSkeleton />
                            )}

                            <motion.div
                                className="pointer-events-none absolute inset-0 hidden bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 dark:block"
                                initial={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{ opacity: 1 }}
                            />
                        </motion.div>
                    ) : null}
                </div>
            </div>
        </section>
    )
}

export function StatsBlock() {
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function loadStats() {
            try {
                const [homepageStats, compilers] = await Promise.all([fetchHomepageStats(), fetchCompilers()])
                if (cancelled) {
                    return
                }
                if (homepageStats) {
                    const activeCompilers = getActiveCompilers(compilers)
                    setStats({
                        ...homepageStats,
                        languages: countActiveProglangs(compilers),
                        compilers: activeCompilers.length,
                    })
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void loadStats()
        return () => {
            cancelled = true
        }
    }, [])

    return <StatsBlockView stats={stats} loading={loading} />
}
