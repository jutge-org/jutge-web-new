'use client'

import Link from 'next/link'

import { AnimatedGroup } from '@/components/smoothui/shared/animated-group'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { t } from '@/lib/wrapped/strings'
import type { HeroMomentInsight, RankingHighlight, SlowSolveInsight, WrappedInsights } from '@/lib/wrapped/types'

type PerformanceSlideProps = {
    insights: WrappedInsights
}

function heroHeadline(hero: HeroMomentInsight): string {
    const problem = hero.problemLabel
    switch (hero.kind) {
        case 'grind':
            return t('personalization.hero.grindHeadline', { problem }).replace(/<\/?0>/g, '')
        case 'most_attempted':
            return t('personalization.hero.mostAttemptedHeadline', { problem }).replace(/<\/?0>/g, '')
        case 'first_ac':
            return t('personalization.hero.firstAcHeadline', { problem }).replace(/<\/?0>/g, '')
    }
}

function firstAttemptCopy(item: RankingHighlight) {
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
}

function SlowSolveCard({ slowSolve }: { slowSolve: SlowSolveInsight }) {
    const headline = t('personalization.slowSolve.headline', {
        duration: slowSolve.durationLabel,
        problem: slowSolve.problemLabel,
    })
        .replace(/<\/?0>/g, '')
        .replace(/<\/?1>/g, '')

    return (
        <PanelCard>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('personalization.slowSolve.label')}
            </p>
            <p className="mt-2 text-lg font-semibold leading-snug">{headline}</p>
            <p className="mt-2 text-sm text-muted-foreground">{slowSolve.detail}</p>
            <Link
                href={`/problems/${slowSolve.problemId}`}
                className="mt-3 inline-block text-sm text-primary hover:underline"
            >
                {slowSolve.problemId}
            </Link>
        </PanelCard>
    )
}

export function PerformanceSlide({ insights }: PerformanceSlideProps) {
    const { personalized, rank, rankingHighlights, displayName, level, periodLabel } = insights
    const firstAttempt = rankingHighlights.items.find((item) => item.kind === 'first_attempt')

    return (
        <StoryLayout
            eyebrow={`${t('slides.performance.eyebrow')} · ${periodLabel}`}
            title={`${displayName} · ${level}`}
        >
            <AnimatedGroup preset="blur-slide" className="flex flex-col gap-4">
                <PanelCard>
                    <p className="text-sm text-muted-foreground">{t('slides.ranking.globalLeaderboard')}</p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                        #{rank.rank.toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{rank.eliteLabel}</p>
                </PanelCard>

                {personalized.heroMoment ? (
                    <PanelCard>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {t('personalization.hero.label')}
                        </p>
                        <p className="mt-2 text-lg font-semibold leading-snug">
                            {heroHeadline(personalized.heroMoment)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {personalized.heroMoment.detail}
                        </p>
                        <Link
                            href={`/problems/${personalized.heroMoment.problemId}`}
                            className="mt-3 inline-block text-sm text-primary hover:underline"
                        >
                            {personalized.heroMoment.problemId}
                        </Link>
                    </PanelCard>
                ) : null}

                {personalized.slowSolve ? <SlowSolveCard slowSolve={personalized.slowSolve} /> : null}

                {firstAttempt ? (
                    <PanelCard>
                        {(() => {
                            const copy = firstAttemptCopy(firstAttempt)
                            return (
                                <>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {copy.label}
                                    </p>
                                    <p className="mt-2 text-lg font-semibold leading-snug">{copy.headline}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">{copy.detail}</p>
                                </>
                            )
                        })()}
                    </PanelCard>
                ) : null}
            </AnimatedGroup>
        </StoryLayout>
    )
}
