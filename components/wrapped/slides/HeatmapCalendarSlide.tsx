'use client'

import { SubmissionCalendar } from '@/components/statistics/SubmissionCalendar'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { buildHeatmapWeekGrid } from '@/lib/statistics/heatmap'
import { t } from '@/lib/wrapped/strings'
import type { WrappedInsights, WrappedRawData } from '@/lib/wrapped/types'

type HeatmapCalendarSlideProps = {
    raw: WrappedRawData
    insights: WrappedInsights
}

export function HeatmapCalendarSlide({ raw, insights }: HeatmapCalendarSlideProps) {
    const grid = buildHeatmapWeekGrid(raw.dashboard.heatmap)

    return (
        <StoryLayout
            eyebrow={t('slides.heatmap.eyebrow')}
            title={t('slides.heatmap.calendarHeading')}
            subtitle={insights.personalized.heatmapSubtitle}
        >
            <PanelCard>
                {grid.grid[0]?.length ? (
                    <SubmissionCalendar heatmap={grid} />
                ) : (
                    <p className="text-sm text-muted-foreground">{t('heatmap.noActivity')}</p>
                )}
            </PanelCard>
        </StoryLayout>
    )
}
