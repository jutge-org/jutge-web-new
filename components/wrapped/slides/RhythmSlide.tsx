'use client'

import { Bar, BarChart, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AnimatedGroup } from '@/components/smoothui/shared/animated-group'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { t } from '@/lib/wrapped/strings'
import type { WrappedInsights } from '@/lib/wrapped/types'

type RhythmSlideProps = {
    insights: WrappedInsights
}

export function RhythmSlide({ insights }: RhythmSlideProps) {
    const { weekday, chrono, personalized } = insights
    const rhythmTitle = t(`slides.rhythm.titles.${personalized.rhythmTitleKey}`)

    const weekdayBars = weekday.weekdays.map((d) => ({
        label: t(`weekdaysShort.${d.key}`, { defaultValue: d.label.slice(0, 3) }),
        count: d.count,
    }))
    const hourBars = chrono.hours.map((h) => ({
        hour: String(h.hour).padStart(2, '0'),
        count: h.count,
    }))

    const subtitle = weekday.peak
        ? weekday.quietest
            ? t('slides.rhythm.subtitleWithQuietest', {
                  peakDay: weekday.peak.label,
                  quietest: weekday.quietest.label,
                  peakHour: chrono.peakHour,
              })
            : t('slides.rhythm.subtitle', {
                  peakDay: weekday.peak.label,
                  peakHour: chrono.peakHour,
              })
        : chrono.narrative

    return (
        <StoryLayout
            eyebrow={personalized.chronoEyebrow}
            title={rhythmTitle}
            subtitle={subtitle}
        >
            <AnimatedGroup preset="blur-slide" className="grid gap-4 lg:grid-cols-2">
                <PanelCard title={t('slides.weekday.chartHeading')}>
                    <ChartContainer
                        config={{ count: { label: 'Submissions', color: 'var(--color-chart-3)' } }}
                        className="aspect-[5/3] w-full"
                    >
                        <BarChart data={weekdayBars} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                            <XAxis dataKey="label" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} width={28} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="var(--color-chart-3)" radius={2} />
                        </BarChart>
                    </ChartContainer>
                    {weekday.peak ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            {t('slides.weekday.busiestDay')}: {weekday.peak.label} ·{' '}
                            {t('slides.weekday.submissionsShare', {
                                count: weekday.peak.count,
                                percent: weekday.peak.percent,
                            })}
                        </p>
                    ) : null}
                </PanelCard>

                <PanelCard title={t('slides.chrono.chartHeading')}>
                    <ChartContainer
                        config={{ count: { label: 'Submissions', color: 'var(--color-chart-1)' } }}
                        className="aspect-[5/3] w-full"
                    >
                        <BarChart data={hourBars} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                            <XAxis dataKey="hour" tickLine={false} axisLine={false} interval={2} />
                            <YAxis tickLine={false} axisLine={false} width={28} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="var(--color-chart-1)" radius={2} />
                        </BarChart>
                    </ChartContainer>
                    <p className="mt-3 text-sm text-muted-foreground">
                        {t('slides.chrono.peakHour')}: {String(chrono.peakHour).padStart(2, '0')}:00 ·{' '}
                        {t('slides.chrono.submissionsAtPeak', { count: chrono.peakHourCount })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{chrono.narrative}</p>
                </PanelCard>
            </AnimatedGroup>
        </StoryLayout>
    )
}
