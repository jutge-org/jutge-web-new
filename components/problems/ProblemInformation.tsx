'use client'

import Link from 'next/link'
import {
    BookmarkIcon,
    BotIcon,
    GlobeIcon,
    InfoIcon,
    LanguagesIcon,
    ScrollIcon,
    ScrollTextIcon,
    SignatureIcon,
    TagsIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { DevIcon } from '@/components/administrator/DevIcon'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemTypeIcon } from '@/components/problems/ProblemTypeIcon'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { problemIconUrl } from '@/lib/problems'
import { cn } from '@/lib/utils'
import type { ProblemDetailData } from '@/lib/data/problemDetail'

type ProblemInformationProps = {
    data: ProblemDetailData
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:items-center sm:gap-3">
            <dt className="text-sm font-medium text-foreground sm:text-right">{label}</dt>
            <dd className="text-sm text-muted-foreground">{children}</dd>
        </div>
    )
}

function SummaryRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <div className="flex w-full flex-row gap-2 text-sm">
            <div className="w-5 shrink-0 text-muted-foreground">{icon}</div>
            <div className="min-w-0 flex-1 text-muted-foreground">{children}</div>
        </div>
    )
}

function formatProglangName(proglang: string) {
    return proglang.replace(/_/g, ' ')
}

function ProglangIcons({ proglangs }: { proglangs: string[] }) {
    return (
        <TooltipProvider>
            <div className="flex flex-wrap gap-1.5">
                {proglangs.map((proglang) => (
                    <Tooltip key={proglang}>
                        <TooltipTrigger asChild>
                            <span className="inline-flex cursor-default">
                                <Badge variant="outline" className="border-border bg-white p-1">
                                    <DevIcon proglang={proglang} size={16} />
                                </Badge>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{formatProglangName(proglang)}</TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    )
}

export function ProblemInformation({ data }: ProblemInformationProps) {
    const { problem } = data
    const [open, setOpen] = useState(false)
    const iconUrl = problemIconUrl(problem.abstract_problem.icon)
    const summary = problem.summary
    const solutionTags = problem.abstract_problem.solution_tags
    const driverId = problem.abstract_problem.driver_id

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted px-1.5" asChild>
                            <button type="button" aria-label="Problem information">
                                <InfoIcon aria-hidden />
                            </button>
                        </Badge>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Problem information</TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex min-w-0 items-center gap-2">
                        <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                            {iconUrl ? <ProblemIconImage iconUrl={iconUrl} size="xs" /> : null}
                            {problem.problem_nm}
                        </span>
                        <span className="min-w-0 truncate">· {problem.title}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        {problem.abstract_problem.author ? (
                            <SummaryRow icon={<SignatureIcon className="size-4" aria-hidden />}>
                                {problem.abstract_problem.author}
                            </SummaryRow>
                        ) : null}
                        {problem.translator ? (
                            <SummaryRow icon={<LanguagesIcon className="size-4" aria-hidden />}>
                                {problem.translator}
                            </SummaryRow>
                        ) : null}
                        {driverId ? (
                            <SummaryRow
                                icon={<ProblemTypeIcon type={driverId} showTooltip={false} className="size-4" />}
                            >
                                {driverId}
                            </SummaryRow>
                        ) : null}
                        {data.languageVariants.length > 0 ? (
                            <SummaryRow icon={<GlobeIcon className="size-4" aria-hidden />}>
                                <TooltipProvider>
                                    <div className="flex flex-wrap gap-1">
                                        {data.languageVariants.map((variant) => {
                                            const isCurrent = variant.problem_id === problem.problem_id
                                            return (
                                                <Tooltip key={variant.problem_id}>
                                                    <TooltipTrigger asChild>
                                                        <Badge
                                                            variant={isCurrent ? 'default' : 'outline'}
                                                            asChild={!isCurrent}
                                                            className={cn(!isCurrent && 'hover:bg-muted')}
                                                        >
                                                            {isCurrent ? (
                                                                <span>{variant.language_id}</span>
                                                            ) : (
                                                                <Link href={`/problems/${variant.problem_id}`}>
                                                                    {variant.language_id}
                                                                </Link>
                                                            )}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">{variant.title}</TooltipContent>
                                                </Tooltip>
                                            )
                                        })}
                                    </div>
                                </TooltipProvider>
                            </SummaryRow>
                        ) : null}
                        {summary?.keywords ? (
                            <SummaryRow icon={<TagsIcon className="size-4" aria-hidden />}>
                                {summary.keywords.replaceAll(',', ', ')}
                            </SummaryRow>
                        ) : null}
                        {summary?.summary_1s ? (
                            <SummaryRow icon={<ScrollIcon className="size-4" aria-hidden />}>
                                {summary.summary_1s}
                            </SummaryRow>
                        ) : null}
                        {summary?.summary_1p ? (
                            <SummaryRow icon={<ScrollTextIcon className="size-4" aria-hidden />}>
                                {summary.summary_1p}
                            </SummaryRow>
                        ) : null}
                        {solutionTags?.tags.trim() ? (
                            <SummaryRow icon={<BookmarkIcon className="size-4" aria-hidden />}>
                                {solutionTags.tags.replaceAll(',', ', ')}
                            </SummaryRow>
                        ) : null}
                        {summary || solutionTags?.tags.trim() ? (
                            <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                Keywords and summaries by JutgeAI
                                <BotIcon className="size-3.5" aria-hidden />
                            </div>
                        ) : null}
                    </div>

                    <dl className="flex flex-col gap-1.5 border-t border-border pt-4">
                        <InfoRow label="Official solutions">
                            {data.officialSolutions.length > 0 ? (
                                <ProglangIcons proglangs={data.officialSolutions} />
                            ) : (
                                '—'
                            )}
                        </InfoRow>
                        {data.brokenOfficialSolutions.length > 0 ? (
                            <InfoRow label="Broken official solutions">
                                <ProglangIcons proglangs={data.brokenOfficialSolutions} />
                            </InfoRow>
                        ) : null}
                        <InfoRow label="User solutions">
                            {data.userSolutions.length > 0 ? <ProglangIcons proglangs={data.userSolutions} /> : '—'}
                        </InfoRow>
                    </dl>
                </div>
            </DialogContent>
        </Dialog>
    )
}
