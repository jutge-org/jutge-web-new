'use client'

import { AnimatedGroup } from '@/components/smoothui/shared/animated-group'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { t } from '@/lib/wrapped/strings'
import type { WrappedInsights } from '@/lib/wrapped/types'

type HeatmapStatsSlideProps = {
    insights: WrappedInsights
}

export function HeatmapStatsSlide({ insights }: HeatmapStatsSlideProps) {
    const { heatmap, personalized } = insights

    const stats = [
        {
            label: t('slides.heatmap.activeDays'),
            value: heatmap.totalActiveDays.toLocaleString(),
        },
        {
            label: t('slides.heatmap.longestStreakLabel'),
            value: t('slides.heatmap.longestStreakValue', { count: heatmap.longestStreak }),
        },
        {
            label: t('slides.heatmap.mostActiveDay'),
            value: heatmap.peakDay
                ? `${heatmap.peakDay.count} · ${heatmap.peakDay.date}`
                : '—',
        },
        {
            label: t('slides.heatmap.busiestWeek'),
            value: heatmap.peakWeek
                ? `${heatmap.peakWeek.total} · ${heatmap.peakWeek.weekLabel}`
                : '—',
        },
        {
            label: t('slides.heatmap.busiestMonth'),
            value: heatmap.peakMonth
                ? `${heatmap.peakMonth.total} · ${heatmap.peakMonth.monthLabel}`
                : '—',
        },
    ]

    return (
        <StoryLayout
            eyebrow={t('slides.heatmap.eyebrow')}
            title={personalized.heatmapTitle}
            subtitle={personalized.heatmapSubtitle}
        >
            <AnimatedGroup preset="blur-slide" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <PanelCard key={stat.label}>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</p>
                    </PanelCard>
                ))}
            </AnimatedGroup>
        </StoryLayout>
    )
}
