'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarIcon } from 'lucide-react'

import { useSimulatedAmplitude } from '@/components/smoothui/ai-core'
import type { StepItem } from '@/components/smoothui/animated-stepper'
import SiriOrb from '@/components/smoothui/siri-orb'
import SmoothButton from '@/components/smoothui/smooth-button'
import { AwardsSlide } from '@/components/wrapped/slides/AwardsSlide'
import { CourseArcSlide } from '@/components/wrapped/slides/CourseArcSlide'
import { HeatmapCalendarSlide } from '@/components/wrapped/slides/HeatmapCalendarSlide'
import { HeatmapStatsSlide } from '@/components/wrapped/slides/HeatmapStatsSlide'
import { IntroSlide } from '@/components/wrapped/slides/IntroSlide'
import { PerformanceSlide } from '@/components/wrapped/slides/PerformanceSlide'
import { RankingSlide } from '@/components/wrapped/slides/RankingSlide'
import { RecapSlide } from '@/components/wrapped/slides/RecapSlide'
import { RhythmSlide } from '@/components/wrapped/slides/RhythmSlide'
import { VerdictSlide } from '@/components/wrapped/slides/VerdictSlide'
import {
    buildWrappedTimelineSteps,
    WrappedTimeline,
    WRAPPED_SETTINGS_STEP,
} from '@/components/wrapped/WrappedTimeline'
import { Card, CardContent } from '@/components/ui/card'
import jutge from '@/lib/jutge'
import { fetchWrappedData, type WrappedLoadResult } from '@/lib/wrapped/fetchWrappedData'
import type { WrappedPeriod } from '@/lib/wrapped/period'
import { getActiveSlideIds, type SlideId } from '@/lib/wrapped/slides'
import { t } from '@/lib/wrapped/strings'
import type { WrappedInsights, WrappedRawData } from '@/lib/wrapped/types'

type WrappedDeckProps = {
    period: WrappedPeriod
    onChangeDates: () => void
}

function ThinkingOrbSpinner() {
    const amplitude = useSimulatedAmplitude('thinking')
    return (
        <div aria-hidden className="shrink-0">
            <SiriOrb amplitude={amplitude} size="96px" state="thinking" />
        </div>
    )
}

function renderSlide(slideId: SlideId, raw: WrappedRawData, insights: WrappedInsights) {
    switch (slideId) {
        case 'intro':
            return <IntroSlide raw={raw} insights={insights} />
        case 'heatmap_stats':
            return <HeatmapStatsSlide insights={insights} />
        case 'heatmap_calendar':
            return <HeatmapCalendarSlide raw={raw} insights={insights} />
        case 'rhythm':
            return <RhythmSlide insights={insights} />
        case 'course':
            return <CourseArcSlide insights={insights} />
        case 'verdict':
            return <VerdictSlide insights={insights} />
        case 'awards':
            return <AwardsSlide insights={insights} />
        case 'ranking':
            return <RankingSlide insights={insights} />
        case 'performance':
            return <PerformanceSlide insights={insights} />
        case 'recap':
            return <RecapSlide insights={insights} />
        default:
            return null
    }
}

export function WrappedDeck({ period, onChangeDates }: WrappedDeckProps) {
    const [result, setResult] = useState<WrappedLoadResult | null>(null)
    const [index, setIndex] = useState(0)

    useEffect(() => {
        let cancelled = false
        setResult(null)
        setIndex(0)
        void fetchWrappedData(jutge, period).then((next) => {
            if (!cancelled) setResult(next)
        })
        return () => {
            cancelled = true
        }
    }, [period])

    const activeSlideIds = useMemo(() => {
        if (result?.status === 'ready') return getActiveSlideIds(result.insights)
        return []
    }, [result])

    const slideCount = activeSlideIds.length

    useEffect(() => {
        setIndex((i) => Math.min(i, Math.max(slideCount - 1, 0)))
    }, [slideCount])

    const goToSlide = useCallback((slideIndex: number) => {
        setIndex(slideIndex)
    }, [])

    const handleTimelineStep = useCallback(
        (step: number) => {
            if (step === WRAPPED_SETTINGS_STEP) {
                onChangeDates()
                return
            }
            if (result?.status === 'ready') {
                goToSlide(step - 1)
            }
        },
        [goToSlide, onChangeDates, result],
    )

    const next = useCallback(() => {
        setIndex((i) => Math.min(i + 1, slideCount - 1))
    }, [slideCount])

    const prev = useCallback(() => {
        if (index <= 0) {
            onChangeDates()
            return
        }
        setIndex((i) => i - 1)
    }, [index, onChangeDates])

    useEffect(() => {
        if (!result || result.status !== 'ready') return

        function onKey(e: KeyboardEvent) {
            const target = e.target as HTMLElement | null
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return
            }
            if (target?.getAttribute('role') === 'tab') return
            if (e.code === 'Space' || e.code === 'ArrowRight') {
                e.preventDefault()
                next()
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault()
                prev()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [next, prev, result])

    if (!result) {
        return (
            <div className="flex flex-col gap-4">
                <WrappedTimeline
                    allowClickNavigation
                    currentStep={WRAPPED_SETTINGS_STEP}
                    onStepChange={handleTimelineStep}
                />
                <Card className="rounded-2xl border border-border shadow-sm">
                    <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 py-16">
                        <ThinkingOrbSpinner />
                        <p className="text-sm text-muted-foreground" role="status">
                            {t('deck.loadingLine')}…
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (result.status === 'error') {
        return (
            <div className="flex flex-col gap-4">
                <WrappedTimeline
                    allowClickNavigation
                    currentStep={WRAPPED_SETTINGS_STEP}
                    onStepChange={handleTimelineStep}
                />
                <Card className="rounded-2xl border border-border shadow-sm">
                    <CardContent className="flex min-h-72 flex-col items-start justify-center gap-4 py-10">
                        <p className="text-sm text-destructive">{result.message}</p>
                        <SmoothButton
                            type="button"
                            variant="outline"
                            onClick={onChangeDates}
                            prefix={<CalendarIcon />}
                        >
                            {t('deck.changeDates')}
                        </SmoothButton>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { raw, insights } = result

    const steps: StepItem[] = [
        ...buildWrappedTimelineSteps([]),
        ...activeSlideIds.map((slideId, i) => ({
            label: t(`deck.steps.${slideId}`),
            stepNumber: i + 1,
            content: (
                <Card className="overflow-hidden rounded-2xl border border-border shadow-sm">
                    <CardContent className="relative min-h-[28rem] overflow-hidden p-6 sm:p-8">
                        {renderSlide(slideId, raw, insights)}
                    </CardContent>
                </Card>
            ),
        })),
    ]

    return (
        <WrappedTimeline
            allowClickNavigation
            currentStep={index + 1}
            onStepChange={handleTimelineStep}
            steps={steps}
        />
    )
}
