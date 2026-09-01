import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, ChevronUpIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { CircuitErrorReportCard } from '@/components/submissions/CircuitErrorReportCard'
import { CircuitErrorTraceCard } from '@/components/submissions/CircuitErrorTraceCard'
import { CircuitModulesCard } from '@/components/submissions/CircuitModulesCard'
import { CompilationErrorsCard } from '@/components/submissions/CompilationErrorsCard'
import { DebugInformationCard } from '@/components/submissions/DebugInformationCard'
import { ScoringCard } from '@/components/submissions/ScoringCard'
import { SubmissionAnalysisCard } from '@/components/submissions/SubmissionAnalysisCard'
// Awards temporarily unwired
// import { SubmissionAwardsCard } from '@/components/submissions/SubmissionAwardsCard'
import { SubmissionCodeMetricsCard } from '@/components/submissions/SubmissionCodeMetricsCard'
import { SubmissionNavButton } from '@/components/submissions/SubmissionNavButton'
import { SubmissionSourceCodeCard } from '@/components/submissions/SubmissionSourceCodeCard'
import { ProblemWidgetCard } from '@/components/problems/ProblemWidgetCard'
import { WidgetSpinner } from '@/components/general/WidgetSpinner'
import { ButtonGroup } from '@/components/ui/button-group'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { compilerIdToSlug } from '@/lib/documentation'
import { parseSubmissionTime, type SubmissionNavLinks } from '@/lib/submissions'
import { cn } from '@/lib/utils'
import type { SubmissionCodeMetricsData } from '@/lib/codeMetrics'
import type {
    ScoringRow,
    SubmissionDetailCore,
    SubmissionDetailSections,
    SubmissionSourceContent,
} from '@/lib/data/submissions'
import type { ReactNode } from 'react'

dayjs.extend(relativeTime)

function scoringTotals(scoring: ScoringRow[]): { obtained: number; total: number } {
    return scoring.reduce(
        (totals, row) => ({
            obtained: totals.obtained + row.points,
            total: totals.total + row.correct_points,
        }),
        { obtained: 0, total: 0 },
    )
}

type SubmissionDetailViewProps =
    | {
          loading: true
          submissionId?: string
          data?: never
          sections?: never
          source?: never
          codeMetrics?: never
          codeHref?: never
          debugHref?: never
          problemKey?: never
          navigation?: never
          getTestcaseHref?: never
      }
    | {
          loading?: false
          data: SubmissionDetailCore
          /** undefined = still loading */
          sections?: SubmissionDetailSections
          /** undefined = still loading, null = none */
          source?: SubmissionSourceContent | null
          /** undefined = still loading, null = none */
          codeMetrics?: SubmissionCodeMetricsData | null
          codeHref: string
          debugHref?: string
          problemKey: string
          navigation?: SubmissionNavLinks | null
          getTestcaseHref?: (testcase: string) => string | null
      }

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-0.5 py-0.5 sm:grid-cols-[8rem_1fr] sm:gap-3">
            <dt className="text-sm font-medium text-foreground sm:text-right pr-4">{label}</dt>
            <dd className="text-sm text-muted-foreground">{children}</dd>
        </div>
    )
}

function SubmissionDetailViewLoading({ submissionId }: { submissionId?: string }) {
    return (
        <div className="flex flex-col gap-6">
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader className="border-b border-border">
                    <CardTitle className="text-lg font-semibold">{submissionId ?? 'Submission'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <WidgetSpinner label="Loading submission" />
                </CardContent>
            </Card>
            <ProblemWidgetCard title="Source code" />
        </div>
    )
}

function sectionsPlaceholderTitle(verdict: string): string | null {
    if (verdict === 'CE') {
        return 'Compilation errors'
    }
    if (verdict === 'SC') {
        return 'Scoring'
    }
    return 'Analysis'
}

export function SubmissionDetailView(props: SubmissionDetailViewProps) {
    if (props.loading) {
        return <SubmissionDetailViewLoading submissionId={props.submissionId} />
    }

    const { data, sections, source, codeMetrics, codeHref, debugHref, problemKey, navigation, getTestcaseHref } =
        props
    const { submission } = data
    const isPending = submission.state !== 'done'
    const submittedAt = dayjs(parseSubmissionTime(submission.time_in))
    const submittedAtLabel = `${submittedAt.isSame(dayjs(), 'day') ? submittedAt.format('HH:mm:ss') : submittedAt.format('YYYY-MM-DD HH:mm:ss')} (${submittedAt.fromNow()})`
    const scoringSummary = data.verdict === 'SC' && sections?.scoring ? scoringTotals(sections.scoring) : null
    const sectionsLoading = !isPending && sections === undefined
    const sourceLoading = !isPending && source === undefined
    const placeholderTitle = sectionsLoading ? sectionsPlaceholderTitle(data.verdict) : null

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <Card className="ring-0 border border-border shadow-sm">
                    <CardHeader className="border-b border-border">
                        <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                            {data.verdictEmoji ? (
                                <span
                                    aria-hidden
                                    data-recent-verdict-emoji={data.verdictEmoji}
                                    className={cn('text-xl', isPending && 'animate-pulse')}
                                >
                                    Submission
                                </span>
                            ) : null}
                            <span>{data.submission.submission_id}</span>
                        </CardTitle>
                        {navigation ? (
                            <CardAction>
                                <ButtonGroup>
                                    <SubmissionNavButton href={navigation.listHref} label="Submissions list">
                                        <ChevronUpIcon />
                                    </SubmissionNavButton>
                                    <SubmissionNavButton href={navigation.previousHref} label="Previous submission">
                                        <ChevronLeftIcon />
                                    </SubmissionNavButton>
                                    <SubmissionNavButton href={navigation.nextHref} label="Next submission">
                                        <ChevronRightIcon />
                                    </SubmissionNavButton>
                                    <SubmissionNavButton href={navigation.lastHref} label="Last submission">
                                        <ChevronsRightIcon />
                                    </SubmissionNavButton>
                                </ButtonGroup>
                            </CardAction>
                        ) : null}
                    </CardHeader>
                    <CardContent className="px-6 py-4">
                        <div className="flex items-center gap-0">
                            <Image
                                src={`/verdicts/svg/${data.verdict}.svg`}
                                alt=""
                                width={110}
                                height={110}
                                className={cn('shrink-0', isPending && 'animate-pulse')}
                            />
                            <dl className="min-w-0 flex-1">
                                <DetailRow label="Verdict">
                                    <span
                                        className={cn(
                                            'inline-flex flex-wrap items-center',
                                            isPending && 'animate-pulse',
                                        )}
                                    >
                                        <Link
                                            href={`/documentation/verdicts/${data.verdict}`}
                                            className="font-medium text-primary underline-offset-4 hover:underline"
                                        >
                                            {data.verdictFullName}
                                        </Link>
                                        {submission.veredict_info && (
                                            <span className="ml-1">({submission.veredict_info})</span>
                                        )}
                                        {scoringSummary ? (
                                            <span
                                                className="tabular-nums text-foreground"
                                                aria-label={`${scoringSummary.obtained} of ${scoringSummary.total} points`}
                                            >
                                                {scoringSummary.obtained}/{scoringSummary.total}
                                            </span>
                                        ) : null}
                                    </span>
                                </DetailRow>
                                <DetailRow label="Compiler">
                                    <Link
                                        href={`/documentation/compilers/${compilerIdToSlug(submission.compiler_id)}`}
                                        className="font-medium text-primary underline-offset-4 hover:underline"
                                    >
                                        {submission.compiler_id}
                                    </Link>
                                </DetailRow>
                                <DetailRow label="Submitted">{submittedAtLabel}</DetailRow>
                                {submission.annotation ? (
                                    <DetailRow label="Annotation">{submission.annotation}</DetailRow>
                                ) : null}
                            </dl>
                        </div>
                    </CardContent>
                </Card>

                {placeholderTitle ? <ProblemWidgetCard title={placeholderTitle} /> : null}

                {sections?.compilationErrors && data.verdict === 'CE' ? (
                    <CompilationErrorsCard data={sections.compilationErrors} compilerId={submission.compiler_id} />
                ) : null}

                {/* Awards temporarily unwired */}
                {/* {data.awards.length > 0 ? <SubmissionAwardsCard awards={data.awards} /> : null} */}

                {sections?.scoring ? <ScoringCard scoring={sections.scoring} /> : null}

                {sections && sections.analysis.length > 0 ? (
                    <SubmissionAnalysisCard
                        analysis={sections.analysis}
                        problemKey={problemKey}
                        submissionId={submission.submission_id}
                        getTestcaseHref={getTestcaseHref}
                    />
                ) : null}

                {codeMetrics ? <SubmissionCodeMetricsCard data={codeMetrics} /> : null}

                {sections?.circuitModules ? (
                    <CircuitModulesCard
                        modules={sections.circuitModules}
                        problemKey={problemKey}
                        submissionId={submission.submission_id}
                    />
                ) : null}

                {sections?.circuitErrorReports?.map((trace, index) => (
                    <CircuitErrorReportCard key={index + 1} index={index + 1} trace={trace} />
                ))}

                {sections?.circuitErrorTraces?.map((svg, index) => (
                    <CircuitErrorTraceCard key={index + 1} index={index + 1} svg={svg} />
                ))}

                {sourceLoading ? <ProblemWidgetCard title="Source code" /> : null}

                {source ? (
                    <SubmissionSourceCodeCard
                        code={source.code}
                        codeExtension={source.codeExtension}
                        codeFilename={source.codeFilename}
                        codeHref={codeHref}
                    />
                ) : null}

                {debugHref && submission.state === 'done' ? (
                    <DebugInformationCard
                        key={`${submission.problem_id}-${submission.submission_id}`}
                        problemId={submission.problem_id}
                        submissionId={submission.submission_id}
                        debugHref={debugHref}
                    />
                ) : null}
            </div>
        </TooltipProvider>
    )
}
