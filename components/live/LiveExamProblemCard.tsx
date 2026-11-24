import { SignatureIcon } from 'lucide-react'
import Link from 'next/link'

import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemStatusIcon } from '@/components/problems/ProblemStatusIcon'
import { ProblemTypeIcon } from '@/components/problems/ProblemTypeIcon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProblemRow } from '@/lib/data/problems'
import type { AbstractStatus, RunningExamProblem } from '@/lib/jutge_api_client'
import type { ProblemsColumnVisibility } from '@/lib/problems'
import { cn } from '@/lib/utils'

function ExamProblemIconImage({ icon, examLabel }: { icon: string; examLabel: string | null }) {
    const image = (
        // eslint-disable-next-line @next/next/no-img-element -- exam icons are external SVGs
        <img
            src={`https://jutge.org/img/examicons/${icon}.svg`}
            alt=""
            className="size-8 shrink-0 object-contain"
            width={32}
            height={32}
        />
    )
    if (!examLabel) return image
    return (
        <Tooltip>
            <TooltipTrigger asChild>{image}</TooltipTrigger>
            <TooltipContent side="top">{examLabel}</TooltipContent>
        </Tooltip>
    )
}

function LiveExamProblemCardIcons({
    iconUrl,
    examProblem,
    examLabel,
}: {
    iconUrl: string | null
    examProblem?: RunningExamProblem
    examLabel: string | null
}) {
    if (!iconUrl && !examProblem?.icon) return null

    return (
        <div className="flex shrink-0 items-center gap-2">
            {iconUrl ? <ProblemIconImage iconUrl={iconUrl} size="md" className="shrink-0" /> : null}
            {examProblem?.icon ? (
                <ExamProblemIconImage icon={examProblem.icon} examLabel={examLabel} />
            ) : null}
        </div>
    )
}

type LiveExamProblemCardProps = {
    problem: ProblemRow
    examProblem?: RunningExamProblem
    status?: AbstractStatus
    columnVisibility: ProblemsColumnVisibility
}

export function LiveExamProblemCard({
    problem,
    examProblem,
    status,
    columnVisibility,
}: LiveExamProblemCardProps) {
    const examLabel = examProblem?.caption?.trim() || null
    const href = `/problems/${problem.problem_nm}`
    const statusVisible =
        status &&
        columnVisibility.status &&
        (status.status === 'accepted' || status.status === 'rejected' || status.status === 'scored')
    const showTitleBar = columnVisibility.title || Boolean(examLabel)

    return (
        <article className="group relative min-w-0">
            <span
                aria-hidden
                className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-brand/40 via-brand-secondary/30 to-brand/25 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
            />
            <Link
                href={href}
                className={cn(
                    'relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
                    'transition-[border-color,box-shadow,transform] duration-300 ease-out',
                    'group-hover:-translate-y-px group-hover:border-[color-mix(in_oklab,var(--color-foreground)_12%,var(--color-brand))]',
                    'group-hover:shadow-[0_8px_28px_-8px_color-mix(in_oklab,var(--color-brand)_35%,transparent)]',
                    'group-hover:ring-1 group-hover:ring-[color-mix(in_oklab,var(--color-foreground)_15%,var(--color-brand))]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
            >
                {showTitleBar ? (
                    <header className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-3">
                        <LiveExamProblemCardIcons
                            iconUrl={problem.iconUrl}
                            examProblem={examProblem}
                            examLabel={examLabel}
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                            {examLabel ? (
                                <p className="text-sm font-semibold leading-snug tracking-tight text-foreground">
                                    {examLabel}
                                </p>
                            ) : null}
                            {columnVisibility.title ? (
                                <h2
                                    className={cn(
                                        'leading-snug tracking-tight',
                                        examLabel
                                            ? 'text-sm font-medium text-muted-foreground'
                                            : 'text-base font-semibold text-foreground',
                                    )}
                                >
                                    {problem.title}
                                </h2>
                            ) : null}
                        </div>
                        {columnVisibility.status && statusVisible ? (
                            <ProblemStatusIcon status={status} className="size-7 shrink-0" />
                        ) : null}
                    </header>
                ) : null}

                <CardMetaFooter problem={problem} columnVisibility={columnVisibility} />
            </Link>
        </article>
    )
}

function CardMetaFooter({
    problem,
    columnVisibility,
}: {
    problem: ProblemRow
    columnVisibility: ProblemsColumnVisibility
}) {
    const showProblemNm = columnVisibility.problem_nm
    const showAuthor = columnVisibility.author
    const showType = columnVisibility.driver_id && Boolean(problem.driver_id)
    if (!showProblemNm && !showAuthor && !showType) return null

    return (
        <footer className="mt-auto flex min-w-0 items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            {showProblemNm ? (
                <span className="shrink-0 font-medium tabular-nums text-foreground">{problem.problem_nm}</span>
            ) : null}
            {showAuthor ? (
                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                    {showProblemNm ? <span aria-hidden className="shrink-0 text-border">·</span> : null}
                    <SignatureIcon className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{problem.author ?? '—'}</span>
                </span>
            ) : null}
            {showType && problem.driver_id ? (
                <>
                    {showProblemNm || showAuthor ? (
                        <span aria-hidden className="shrink-0 text-border">
                            ·
                        </span>
                    ) : null}
                    <ProblemTypeIcon
                        type={problem.driver_id}
                        className="size-4 shrink-0 text-muted-foreground"
                    />
                </>
            ) : null}
        </footer>
    )
}