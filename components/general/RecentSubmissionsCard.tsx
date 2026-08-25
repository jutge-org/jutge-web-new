'use client'

import { Pie, PieChart } from 'recharts'

import { AnimatedStatValue } from '@/components/general/AnimatedStatValue'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { HomepageStats } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

export const MAX_SUBMISSIONS_PER_MINUTE = 20

const INTERVALS = [
    { key: 'latest_01_minutes' as const, minutes: 1, label: '1m', period: 'the last minute' },
    { key: 'latest_05_minutes' as const, minutes: 5, label: '5m', period: 'the last 5 minutes' },
    { key: 'latest_15_minutes' as const, minutes: 15, label: '15m', period: 'the last 15 minutes' },
    { key: 'latest_60_minutes' as const, minutes: 60, label: '1h', period: 'the last hour' },
] as const

const chartConfig = {
    submissions: {
        label: 'Submissions',
        color: 'var(--color-brand)',
    },
    track: {
        label: 'Capacity',
        color: 'var(--muted)',
    },
} satisfies ChartConfig

type RecentSubmissionsCardProps = {
    recentSubmissions: HomepageStats['recent_submissions']
    replayKey?: number
    className?: string
    gridClassName?: string
}

function submissionPercentage(count: number, minutes: number): number {
    const max = MAX_SUBMISSIONS_PER_MINUTE * minutes
    return Math.min(100, (count / max) * 100)
}

type RadialGaugeProps = {
    count: number
    minutes: number
    label: string
    period: string
    replayKey: number
}

function RadialGauge({ count, minutes, label, period, replayKey }: RadialGaugeProps) {
    const percentage = submissionPercentage(count, minutes)
    const submissionWord = count === 1 ? 'submission' : 'submissions'
    const trackData = [{ key: 'track', value: 100, fill: 'var(--color-track)' }]
    const progressData = [
        { key: 'submissions', value: percentage, fill: 'var(--color-submissions)' },
        { key: 'empty', value: 100 - percentage, fill: 'transparent' },
    ]

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className="relative aspect-square w-full min-w-0 cursor-default"
                    role="img"
                    aria-label={`${count} ${submissionWord} in ${period}`}
                >
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-square h-full w-full"
                        initialDimension={{ width: 56, height: 56 }}
                    >
                        <PieChart>
                            <Pie
                                data={trackData}
                                dataKey="value"
                                startAngle={180}
                                endAngle={-180}
                                innerRadius="72%"
                                outerRadius="86%"
                                cx="50%"
                                cy="50%"
                                strokeWidth={0}
                                isAnimationActive={false}
                            />
                            <Pie
                                data={progressData}
                                dataKey="value"
                                startAngle={180}
                                endAngle={-180}
                                innerRadius="72%"
                                outerRadius="94%"
                                cx="50%"
                                cy="50%"
                                strokeWidth={0}
                                cornerRadius={2}
                                isAnimationActive={false}
                            />
                        </PieChart>
                    </ChartContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-sm font-semibold tracking-tight tabular-nums text-foreground">
                            <AnimatedStatValue value={count} replayKey={replayKey} />
                        </span>
                        <span className="mt-0.5 text-[10px] text-muted-foreground">{label}</span>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64 text-center">
                {count.toLocaleString()} {submissionWord} in {period}
            </TooltipContent>
        </Tooltip>
    )
}

export function RecentSubmissionsCard({
    recentSubmissions,
    replayKey = 0,
    className,
    gridClassName,
}: RecentSubmissionsCardProps) {
    return (
        <div
            className={cn(
                'group flex flex-col gap-3 rounded-2xl border border-border border-t-4 border-t-cyan-400 bg-card px-2 pt-5 shadow-sm',
                className,
            )}
        >
            <div className={cn('grid min-h-16 grid-cols-4 gap-1', gridClassName)}>
                <TooltipProvider>
                    {INTERVALS.map(({ key, minutes, label, period }) => (
                        <RadialGauge
                            key={key}
                            count={recentSubmissions[key]}
                            minutes={minutes}
                            label={label}
                            period={period}
                            replayKey={replayKey}
                        />
                    ))}
                </TooltipProvider>
            </div>
        </div>
    )
}
