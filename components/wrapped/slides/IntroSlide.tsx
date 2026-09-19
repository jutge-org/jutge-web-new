'use client'

import Link from 'next/link'
import { Gavel, Send, ThumbsDown, ThumbsUp } from 'lucide-react'

import { AnimatedGroup } from '@/components/smoothui/shared/animated-group'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { t } from '@/lib/wrapped/strings'
import type { WrappedInsights, WrappedRawData } from '@/lib/wrapped/types'
import { cn } from '@/lib/utils'

type IntroSlideProps = {
    raw: WrappedRawData
    insights: WrappedInsights
}

const METRICS = [
    {
        key: 'accepted' as const,
        labelKey: 'slides.intro.acceptedProblems',
        value: (j: WrappedInsights['journey']) => j.acceptedProblems,
        icon: ThumbsUp,
        borderAccent: 'border-t-emerald-500',
        iconAccent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        key: 'rejected' as const,
        labelKey: 'slides.intro.rejectedProblems',
        value: (j: WrappedInsights['journey']) => j.rejectedProblems,
        icon: ThumbsDown,
        borderAccent: 'border-t-red-500',
        iconAccent: 'text-red-600 dark:text-red-400',
    },
    {
        key: 'submissions' as const,
        labelKey: 'slides.intro.submissions',
        value: (j: WrappedInsights['journey']) => j.totalSubmissions,
        icon: Send,
        borderAccent: 'border-t-orange-500',
        iconAccent: 'text-orange-600 dark:text-orange-400',
    },
]

export function IntroSlide({ raw, insights }: IntroSlideProps) {
    const { journey, personalized, level, displayName } = insights

    return (
        <StoryLayout
            eyebrow={t('slides.intro.eyebrow')}
            title={displayName}
            subtitle={personalized.introSubtitle}
        >
            <AnimatedGroup preset="blur-slide" className="flex flex-col gap-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
                    <PanelCard className="lg:w-72 lg:shrink-0">
                        <div className="flex items-center gap-4">
                            {raw.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={raw.avatarUrl}
                                    alt={t('slides.intro.avatarAlt')}
                                    className="size-20 rounded-xl object-cover"
                                />
                            ) : (
                                <div className="flex size-20 items-center justify-center rounded-xl bg-muted text-2xl font-semibold text-muted-foreground">
                                    {displayName.slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate font-semibold">{displayName}</p>
                                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Gavel className="size-4" aria-hidden />
                                    {t('slides.intro.judgeLevel')}:{' '}
                                    <span className="font-medium text-foreground">{level}</span>
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {t('slides.intro.acRate')}: {journey.problemSuccessRate}%
                                </p>
                            </div>
                        </div>
                    </PanelCard>

                    <section
                        aria-label="Summary"
                        className="grid flex-1 gap-4 sm:grid-cols-3"
                    >
                        {METRICS.map(({ key, labelKey, value, icon: Icon, borderAccent, iconAccent }) => (
                            <div
                                key={key}
                                className={cn(
                                    'flex flex-col rounded-2xl border border-border border-t-4 bg-card shadow-sm',
                                    borderAccent,
                                )}
                            >
                                <div className="flex flex-1 items-center justify-between gap-3 px-5 py-5">
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {t(labelKey)}
                                        </span>
                                        <span className="text-3xl font-semibold tracking-tight tabular-nums">
                                            {value(journey).toLocaleString()}
                                        </span>
                                    </div>
                                    <Icon className={cn('size-8 shrink-0 opacity-80', iconAccent)} aria-hidden />
                                </div>
                            </div>
                        ))}
                    </section>
                </div>

                {personalized.introActivity ? (
                    <p className="text-sm text-muted-foreground">{personalized.introActivity}</p>
                ) : null}

                <p className="text-sm text-muted-foreground">
                    {t('slides.intro.problemSuccessRate', { rate: journey.problemSuccessRate })}
                </p>

                {journey.drilldowns.available && journey.drilldowns.acceptedProblems.length > 0 ? (
                    <PanelCard title={t('slides.intro.drilldown.acceptedTitle')}>
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {journey.drilldowns.acceptedProblems.slice(0, 8).map((item) => (
                                <li key={item.problemId}>
                                    <Link
                                        href={`/problems/${item.problemId}`}
                                        className="text-sm hover:text-primary hover:underline"
                                    >
                                        {item.problemLabel}
                                        {item.problemTitle ? (
                                            <span className="text-muted-foreground">
                                                {' '}
                                                · {item.problemTitle}
                                            </span>
                                        ) : null}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </PanelCard>
                ) : null}
            </AnimatedGroup>
        </StoryLayout>
    )
}
