'use client'

import { RecentSubmissionsCard } from '@/components/general/RecentSubmissionsCard'
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
import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef } from 'react'

const STAGGER_DELAY = 0.1
const ICON_STAGGER_OFFSET = 0.2
const VALUE_DELAY_OFFSET = 0.3

type PlatformStats = HomepageStats & {
    languages: number
    compilers: number
}

type StatsBlockProps = {
    stats: PlatformStats
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

export function StatsBlock({ stats }: StatsBlockProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-stats" aria-labelledby="home-stats-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    className="mb-16 text-center"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
                    viewport={{ once: true }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2 className="mb-4 font-bold text-3xl text-[var(--color-brand-title)] lg:text-4xl dark:text-foreground" id="home-stats-heading">
                        Platform at a glance
                    </h2>
                    <p className="mx-auto max-w-2xl text-foreground text-lg dark:text-foreground/70">
                        Key numbers from the Jutge.org community.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 gap-6 lg:grid-cols-4" ref={ref}>
                    {statItems.map((item, index) => {
                        const Icon = item.icon
                        const value = stats[item.key]

                        return (
                            <motion.div
                                animate={(() => {
                                    if (shouldReduceMotion) return { opacity: 1 }
                                    return isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }
                                })()}
                                className="group relative overflow-hidden rounded-xl border bg-primary/5 p-6 ring-1 ring-primary/10 transition-all hover:scale-[1.02] hover:shadow-md"
                                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
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
                                    animate={(() => {
                                        if (shouldReduceMotion) return { rotate: 0, scale: 1 }
                                        return isInView ? { rotate: 0, scale: 1 } : { rotate: -10, scale: 0.8 }
                                    })()}
                                    className="mb-4 text-3xl"
                                    initial={shouldReduceMotion ? { rotate: 0, scale: 1 } : { rotate: -10, scale: 0.8 }}
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
                                    animate={(() => {
                                        if (shouldReduceMotion) return { scale: 1 }
                                        return isInView ? { scale: 1 } : { scale: 0.5 }
                                    })()}
                                    className="mb-1 font-bold text-2xl text-foreground tabular-nums lg:text-3xl"
                                    initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.5 }}
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
                                    {value.toLocaleString()}
                                </motion.div>

                                <h3 className="mb-2 font-semibold text-foreground text-sm uppercase tracking-wide">
                                    {item.label}
                                </h3>
                                <p className="hidden text-foreground text-xs sm:block dark:text-foreground/70">{item.description}</p>

                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                                    initial={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ opacity: 1 }}
                                />
                            </motion.div>
                        )
                    })}

                    {stats.recent_submissions ? (
                        <motion.div
                            animate={(() => {
                                if (shouldReduceMotion) return { opacity: 1 }
                                return isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }
                            })()}
                            className="group relative overflow-hidden rounded-xl border bg-primary/5 p-6 ring-1 ring-primary/10 transition-all hover:scale-[1.02] hover:shadow-md"
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
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
                            <RecentSubmissionsCard
                                className="h-full justify-center border-0 border-t-0 bg-transparent p-0 pt-0 shadow-none"
                                gridClassName="grid-cols-2 gap-2"
                                recentSubmissions={stats.recent_submissions}
                            />

                            <motion.div
                                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100"
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
