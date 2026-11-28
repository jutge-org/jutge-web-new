'use client'

import { fetchAdminDashboardZombies, fetchHomepageStats } from '@/lib/administrator/client'
import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { cn } from '@/lib/utils'
import { AlertTriangleIcon, FileBracesCornerIcon, SendIcon, UsersIcon } from 'lucide-react'
import { all } from 'radash'
import Link from 'next/link'
import { type ReactNode, useEffect, useState } from 'react'
import { HomepageStats, Zombies } from '@/lib/jutge_api_client'

const statCards = [
    {
        key: 'users' as const,
        label: 'Users',
        icon: UsersIcon,
        borderAccent: 'border-t-emerald-500',
        iconAccent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        key: 'submissions' as const,
        label: 'Submissions',
        icon: SendIcon,
        borderAccent: 'border-t-orange-500',
        iconAccent: 'text-orange-600 dark:text-orange-400',
    },
    {
        key: 'problems' as const,
        label: 'Problems',
        icon: FileBracesCornerIcon,
        borderAccent: 'border-t-violet-500',
        iconAccent: 'text-violet-600 dark:text-violet-400',
    },
    {
        key: 'ies' as const,
        label: 'IEs',
        icon: AlertTriangleIcon,
        borderAccent: 'border-t-muted-foreground/30',
        iconAccent: 'text-muted-foreground',
        alertBorderAccent: 'border-t-red-500',
        alertIconAccent: 'text-red-600 dark:text-red-400',
    },
]

function useIncrementer(top: number, time: number) {
    const [count, setCount] = useState(0)
    const period = 50

    useEffect(() => {
        const interval = setInterval(() => {
            if (count >= top) {
                clearInterval(interval)
                return
            }
            setCount((prev) => Math.floor(prev + top / (time / period)))
        }, period)
        return () => clearInterval(interval)
    }, [top, time, count])

    return count
}

export default function HeaderWidget() {
    const [stats, setStats] = useState<HomepageStats | null>(null)
    const [zombies, setZombies] = useState<Zombies | null>(null)
    const usersIncrementer = useIncrementer(42000, 1000)
    const submissionsIncrementer = useIncrementer(6000000, 1000)
    const problemsIncrementer = useIncrementer(6000, 1000)

    async function fetchData() {
        const data = await all({
            stats: fetchHomepageStats(),
            zombies: fetchAdminDashboardZombies(),
        })
        setStats(data.stats)
        setZombies(data.zombies)
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10 * 1000)
        return () => clearInterval(interval)
    }, [])

    function formatValue(key: (typeof statCards)[number]['key']): ReactNode {
        if (key === 'ies') {
            return zombies ? (
                <Link href="/administrator/queue?view=internal-errors" className="hover:text-primary">
                    {zombies.ies.toLocaleString()}
                </Link>
            ) : (
                <SimpleSpinner />
            )
        }

        if (!stats) {
            const fallback =
                key === 'users'
                    ? usersIncrementer
                    : key === 'submissions'
                      ? submissionsIncrementer
                      : problemsIncrementer
            return fallback.toLocaleString()
        }

        return stats[key].toLocaleString()
    }

    return (
        <section aria-label="Overview" className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
                const { key, label, icon: Icon, borderAccent, iconAccent } = card
                const iesAlert = key === 'ies' && (zombies?.ies ?? 0) > 0

                return (
                    <div
                        key={key}
                        className={cn(
                            'flex flex-col rounded-2xl border border-border border-t-4 bg-card shadow-sm',
                            iesAlert ? card.alertBorderAccent : borderAccent,
                        )}
                    >
                        <div className="flex flex-1 items-center gap-3 px-5 py-5">
                            <Icon
                                className={cn(
                                    'size-8 shrink-0 opacity-80',
                                    iesAlert ? card.alertIconAccent : iconAccent,
                                )}
                                aria-hidden
                            />
                            <div className="ml-auto flex min-w-0 flex-col gap-1 items-end text-right">
                                <span className="text-3xl font-semibold tracking-tight tabular-nums">
                                    {formatValue(key)}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </section>
    )
}
