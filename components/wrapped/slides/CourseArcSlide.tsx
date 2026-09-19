'use client'

import { Cell, Legend, Pie, PieChart } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AnimatedGroup } from '@/components/smoothui/shared/animated-group'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { t } from '@/lib/wrapped/strings'
import type { WrappedInsights } from '@/lib/wrapped/types'

type CourseArcSlideProps = {
    insights: WrappedInsights
}

export function CourseArcSlide({ insights }: CourseArcSlideProps) {
    const { courseArc, proglangs, compilers } = insights

    const languageSlices = proglangs.slice(0, 8)
    const compilerSlices = compilers.slice(0, 8)

    const languageConfig = Object.fromEntries(
        languageSlices.map((s) => [s.key, { label: s.label, color: s.color ?? 'var(--color-chart-1)' }]),
    )
    const compilerConfig = Object.fromEntries(
        compilerSlices.map((s) => [s.key, { label: s.label, color: s.color ?? 'var(--color-chart-2)' }]),
    )

    return (
        <StoryLayout
            eyebrow={t('slides.courseArc.eyebrow')}
            title={courseArc.title}
            subtitle={courseArc.subtitle}
        >
            <AnimatedGroup preset="blur-slide" className="grid gap-4 lg:grid-cols-2">
                <PanelCard title={t('slides.ranking.topLanguage')}>
                    {languageSlices.length > 0 ? (
                        <ChartContainer
                            config={languageConfig}
                            className="mx-auto aspect-square max-h-72 w-full"
                        >
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={languageSlices}
                                    dataKey="count"
                                    nameKey="label"
                                    innerRadius="45%"
                                    strokeWidth={2}
                                >
                                    {languageSlices.map((slice) => (
                                        <Cell key={slice.key} fill={slice.color ?? 'var(--color-chart-1)'} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground">No language data yet.</p>
                    )}
                </PanelCard>

                <PanelCard title="Compilers">
                    {compilerSlices.length > 0 ? (
                        <ChartContainer
                            config={compilerConfig}
                            className="mx-auto aspect-square max-h-72 w-full"
                        >
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={compilerSlices}
                                    dataKey="count"
                                    nameKey="label"
                                    innerRadius="45%"
                                    strokeWidth={2}
                                >
                                    {compilerSlices.map((slice) => (
                                        <Cell key={slice.key} fill={slice.color ?? 'var(--color-chart-2)'} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-sm text-muted-foreground">No compiler data yet.</p>
                    )}
                    {courseArc.courseCompilerShare > 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Course compilers (P1++, PRO2, MakePRO2): {courseArc.courseCompilerShare}% of
                            submissions
                        </p>
                    ) : null}
                </PanelCard>
            </AnimatedGroup>
        </StoryLayout>
    )
}
