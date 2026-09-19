'use client'

import { AnimatedGroup } from '@/components/smoothui/shared/animated-group'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { t } from '@/lib/wrapped/strings'
import type { RankingHighlight, WrappedInsights } from '@/lib/wrapped/types'

type RankingSlideProps = {
    insights: WrappedInsights
}

function highlightCopy(item: RankingHighlight): { label: string; headline: string; detail: string } {
    switch (item.kind) {
        case 'first_attempt':
            return {
                label: t('personalization.rankingHighlights.firstAttempt.label'),
                headline: t('personalization.rankingHighlights.firstAttempt.headline', {
                    percent: item.percent,
                }).replace(/<\/?0>/g, ''),
                detail: t('personalization.rankingHighlights.firstAttempt.detail', {
                    count: item.numerator,
                    total: item.denominator,
                }),
            }
        case 'platform_problems':
            return {
                label: t('personalization.rankingHighlights.platformProblems.label'),
                headline: t('personalization.rankingHighlights.platformProblems.headline', {
                    percent: item.percent,
                }).replace(/<\/?0>/g, ''),
                detail: t('personalization.rankingHighlights.platformProblems.detail', {
                    accepted: item.numerator,
                    total: item.denominator,
                }),
            }
        case 'platform_submissions':
            return {
                label: t('personalization.rankingHighlights.platformSubmissions.label'),
                headline: t('personalization.rankingHighlights.platformSubmissions.headline', {
                    percent: item.percent,
                }).replace(/<\/?0>/g, ''),
                detail: t('personalization.rankingHighlights.platformSubmissions.detail', {
                    yours: item.numerator,
                    total: item.denominator,
                }),
            }
        case 'compile_grief':
            return {
                label: t('personalization.rankingHighlights.compileGrief.label'),
                headline: t('personalization.rankingHighlights.compileGrief.headline', {
                    count: item.numerator,
                }).replace(/<\/?0>/g, ''),
                detail: t('personalization.rankingHighlights.compileGrief.detail', {
                    percent: item.percent,
                }),
            }
    }
}

export function RankingSlide({ insights }: RankingSlideProps) {
    const { rank, personalized, rankingHighlights, courseArc, weekday, verdicts } = insights

    const highlightItems = rankingHighlights.items.filter(
        (item) => item.kind !== 'first_attempt',
    )

    return (
        <StoryLayout
            eyebrow={t('slides.ranking.eyebrow')}
            title={rank.eliteLabel}
            subtitle={personalized.rankingSubtitle}
        >
            <AnimatedGroup preset="blur-slide" className="flex flex-col gap-4">
                <PanelCard>
                    <p className="text-sm text-muted-foreground">{t('slides.ranking.globalLeaderboard')}</p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                        #{rank.rank.toLocaleString()}
                    </p>
                    {personalized.usersAheadText ? (
                        <p className="mt-3 text-sm text-muted-foreground">{personalized.usersAheadText}</p>
                    ) : null}
                    <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <dt className="text-xs text-muted-foreground">{t('slides.ranking.topLanguage')}</dt>
                            <dd className="font-semibold">{courseArc.topProglang?.label ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">{t('slides.ranking.busiestDay')}</dt>
                            <dd className="font-semibold">{weekday.peak?.label ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">{t('slides.ranking.acRuns')}</dt>
                            <dd className="font-semibold tabular-nums">{verdicts.ac.toLocaleString()}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">{t('slides.ranking.platformSubs')}</dt>
                            <dd className="font-semibold tabular-nums">
                                {rank.platformUserCount.toLocaleString()}
                            </dd>
                        </div>
                    </dl>
                </PanelCard>

                {highlightItems.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {highlightItems.map((item) => {
                            const copy = highlightCopy(item)
                            return (
                                <PanelCard key={item.kind}>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {copy.label}
                                    </p>
                                    <p className="mt-2 text-lg font-semibold leading-snug">{copy.headline}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">{copy.detail}</p>
                                </PanelCard>
                            )
                        })}
                    </div>
                ) : null}
            </AnimatedGroup>
        </StoryLayout>
    )
}
