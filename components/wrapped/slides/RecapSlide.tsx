'use client'

import { AnimatedGroup } from '@/components/smoothui/shared/animated-group'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { formatMinutes, t } from '@/lib/wrapped/strings'
import type { WrappedInsights } from '@/lib/wrapped/types'

type RecapSlideProps = {
    insights: WrappedInsights
}

export function RecapSlide({ insights }: RecapSlideProps) {
    const { journey, rank, chrono, courseArc, periodLabel, displayName } = insights

    const rows = [
        {
            label: t('slides.recap.ranking'),
            value: `#${rank.rank.toLocaleString()} · ${rank.eliteLabel}`,
        },
        {
            label: t('slides.recap.estimatedTime'),
            value:
                journey.estimatedActiveMinutes != null
                    ? formatMinutes(journey.estimatedActiveMinutes)
                    : t('slides.recap.timeUnavailable'),
        },
        {
            label: t('slides.recap.acceptedProblems'),
            value: journey.acceptedProblems.toLocaleString(),
        },
        {
            label: t('slides.recap.totalSubmissions'),
            value: journey.totalSubmissions.toLocaleString(),
        },
        {
            label: t('slides.recap.acRate'),
            value: `${journey.problemSuccessRate}%`,
        },
        {
            label: t('slides.recap.archetype'),
            value: chrono.archetype,
        },
        {
            label: t('slides.recap.topLanguage'),
            value: courseArc.topProglang?.label ?? '—',
        },
    ]

    return (
        <StoryLayout
            eyebrow={t('common.wrapped')}
            title={t('slides.recap.title', { yearRange: periodLabel })}
            subtitle={displayName}
        >
            <AnimatedGroup preset="blur-slide" className="grid gap-3 sm:grid-cols-2">
                {rows.map((row) => (
                    <PanelCard key={row.label}>
                        <p className="text-sm font-medium text-muted-foreground">{row.label}</p>
                        <p className="mt-2 text-lg font-semibold tracking-tight">{row.value}</p>
                    </PanelCard>
                ))}
            </AnimatedGroup>
        </StoryLayout>
    )
}
