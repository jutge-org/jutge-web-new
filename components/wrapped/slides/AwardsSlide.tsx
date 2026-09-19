'use client'

import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import SmoothButton from '@/components/smoothui/smooth-button'
import { AnimatedGroup } from '@/components/smoothui/shared/animated-group'
import { PanelCard } from '@/components/wrapped/PanelCard'
import { StoryLayout } from '@/components/wrapped/StoryLayout'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AWARDS_PER_PAGE } from '@/lib/wrapped/slides'
import { t } from '@/lib/wrapped/strings'
import type { WrappedInsights } from '@/lib/wrapped/types'

type AwardsSlideProps = {
    insights: WrappedInsights
}

export function AwardsSlide({ insights }: AwardsSlideProps) {
    const { awards } = insights
    const [pageIndex, setPageIndex] = useState(0)
    const pageCount = Math.max(1, Math.ceil(awards.items.length / AWARDS_PER_PAGE))

    const pageItems = useMemo(() => {
        const start = pageIndex * AWARDS_PER_PAGE
        return awards.items.slice(start, start + AWARDS_PER_PAGE)
    }, [awards.items, pageIndex])

    return (
        <StoryLayout
            eyebrow={t('slides.awards.eyebrow')}
            title={awards.title}
            subtitle={`${awards.count} ${t('slides.awards.totalLabel')}`}
        >
            <AnimatedGroup preset="blur-slide" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((award) => (
                    <PanelCard key={award.awardId}>
                        <div className="flex gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={award.iconUrl}
                                alt={t('slides.awards.iconAlt', { title: award.title })}
                                className="size-14 shrink-0 rounded-lg object-contain"
                            />
                            <div className="min-w-0">
                                <Link
                                    href={`/awards/${award.awardId}`}
                                    className="font-semibold hover:text-primary hover:underline"
                                >
                                    {award.title}
                                </Link>
                                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                                    {award.info}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">{award.timeLabel}</p>
                                {award.problemId ? (
                                    <Link
                                        href={`/problems/${award.problemId}`}
                                        className="mt-1 inline-block text-xs text-primary hover:underline"
                                    >
                                        {t('slides.awards.problemAwarded', {
                                            problem: award.problemLabel ?? award.problemId,
                                        })}
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </PanelCard>
                ))}
            </AnimatedGroup>

            {pageCount > 1 ? (
                <div className="mt-6 flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        {t('slides.awards.showingOf', {
                            current: pageIndex + 1,
                            total: pageCount,
                        })}
                    </p>
                    <TooltipProvider>
                        <div className="flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <SmoothButton
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        disabled={pageIndex === 0}
                                        aria-label={t('slides.awards.prevPage')}
                                        onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                                    >
                                        <ChevronLeftIcon />
                                    </SmoothButton>
                                </TooltipTrigger>
                                <TooltipContent>{t('slides.awards.prevPage')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <SmoothButton
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        disabled={pageIndex >= pageCount - 1}
                                        aria-label={t('slides.awards.nextPage')}
                                        onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
                                    >
                                        <ChevronRightIcon />
                                    </SmoothButton>
                                </TooltipTrigger>
                                <TooltipContent>{t('slides.awards.nextPage')}</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                </div>
            ) : null}
        </StoryLayout>
    )
}
