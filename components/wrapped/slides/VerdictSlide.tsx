'use client'

import { Cell, Legend, Pie, PieChart } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { t } from '@/lib/wrapped/strings'
import type { WrappedInsights } from '@/lib/wrapped/types'

type VerdictSlideProps = {
    insights: WrappedInsights
}

export function VerdictSlide({ insights }: VerdictSlideProps) {
    const { verdicts } = insights
    const chartConfig = Object.fromEntries(
        verdicts.items.map((s) => [s.key, { label: s.label, color: s.color ?? 'var(--color-chart-1)' }]),
    )

    return (
        <StoryLayout
            eyebrow={t('slides.verdict.eyebrow')}
            title={t('slides.verdict.title')}
            subtitle={t('slides.verdict.subtitle')}
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <PanelCard>
                    {verdicts.items.length > 0 ? (
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-80 w-full"
                        >
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={verdicts.items}
                                    dataKey="count"
                                    nameKey="key"
                                    innerRadius="45%"
                                    strokeWidth={2}
                                >
                                    {verdicts.items.map((slice) => (
                                        <Cell key={slice.key} fill={slice.color ?? 'var(--color-chart-1)'} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground">No submissions yet.</p>
                    )}
                </PanelCard>

                <PanelCard>
                    <p className="text-4xl font-semibold tracking-tight tabular-nums">
                        {verdicts.acRate}%
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('slides.intro.acRate')}</p>
                    <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                        {verdicts.narrative}
                    </p>
                    <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <dt className="text-muted-foreground">{t('slides.ranking.acRuns')}</dt>
                            <dd className="text-lg font-semibold tabular-nums">{verdicts.ac}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">{t('slides.recap.totalSubmissions')}</dt>
                            <dd className="text-lg font-semibold tabular-nums">{verdicts.total}</dd>
                        </div>
                    </dl>
                </PanelCard>
            </div>
        </StoryLayout>
    )
}
