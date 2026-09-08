'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import { AgTableFull } from '@/components/administrator/AgTable'
import { DevIcon } from '@/components/administrator/DevIcon'
import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import { ProblemIdLabel } from '@/components/problems/ProblemIdLabel'
import { ProblemTitleSummaryTooltip } from '@/components/problems/ProblemTitleSummaryTooltip'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import {
    COURSE_SUBMISSIONS_LIMIT,
    fetchCourseSubmissionsPageData,
    formatCourseSubmissionTime,
    type CourseSubmissionRow,
    type CourseSubmissionsPageData,
} from '@/lib/data/courseSubmissions'
import type { Compiler, Verdict } from '@/lib/jutge_api_client'
import { cn } from '@/lib/utils'

type CourseSubmissionsViewProps = {
    courseKey: string
}

export function CourseSubmissionsView({ courseKey }: CourseSubmissionsViewProps) {
    const [data, setData] = useState<CourseSubmissionsPageData | null>(null)
    const isMobile = useIsMobile()
    const { profile } = useAuth()
    const preferredLanguageId = profile?.language_id ?? null

    useEffect(() => {
        let cancelled = false
        setData(null)

        void (async () => {
            try {
                const pageData = await fetchCourseSubmissionsPageData({ courseKey })
                if (!cancelled) {
                    setData(pageData)
                }
            } catch {
                if (!cancelled) {
                    toast.error('Could not load submissions.')
                    setData({ rows: [], compilers: {}, verdicts: {} })
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [courseKey])

    const colDefs = useMemo(
        () => buildColumnDefs(data?.compilers ?? {}, data?.verdicts ?? {}, isMobile, preferredLanguageId),
        [data?.compilers, data?.verdicts, isMobile, preferredLanguageId],
    )

    if (data === null) {
        return <PageSpinner />
    }

    const { rows } = data
    const countLabel =
        rows.length === 1
            ? 'submission'
            : rows.length === COURSE_SUBMISSIONS_LIMIT
              ? 'latest submissions'
              : 'submissions'

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end">
                <div className="text-xs text-muted-foreground">
                    {rows.length} {countLabel}
                </div>
            </div>

            <TooltipProvider>
                <AgTableFull rowData={rows} columnDefs={colDefs} />
            </TooltipProvider>
        </div>
    )
}

function buildColumnDefs(
    compilers: Record<string, Compiler>,
    verdicts: Record<string, Verdict>,
    isMobile: boolean,
    preferredLanguageId: string | null,
) {
    return [
        {
            field: 'time',
            headerName: 'Time',
            width: isMobile ? 100 : 180,
            filter: true,
            sort: 'desc',
            valueGetter: (params: { data: CourseSubmissionRow }) => params.data.time,
            cellRenderer: (params: { data: CourseSubmissionRow }) =>
                formatCourseSubmissionTime(params.data.time, isMobile),
        },
        {
            field: 'name',
            headerName: 'Student',
            flex: 1,
            filter: true,
            cellRenderer: (params: { data: CourseSubmissionRow }) => (
                <Link href={params.data.studentHref} className="text-sm hover:text-primary hover:underline">
                    {params.data.name}
                </Link>
            ),
        },
        {
            field: 'problem_id',
            headerName: 'Problem',
            width: 140,
            filter: true,
            cellRenderer: (params: { data: CourseSubmissionRow }) => (
                <ProblemTitleSummaryTooltip
                    problem_nm={params.data.problem_nm}
                    title={params.data.problem_id}
                    preferredLanguageId={preferredLanguageId}
                >
                    <Link href={params.data.problemHref} className="text-sm hover:text-primary hover:underline">
                        <ProblemIdLabel problemId={params.data.problem_id} />
                    </Link>
                </ProblemTitleSummaryTooltip>
            ),
        },
        {
            field: 'submission_id',
            headerName: 'Submission',
            width: 130,
            filter: true,
            cellRenderer: (params: { data: CourseSubmissionRow }) => (
                <Link href={params.data.submissionHref} className="text-sm hover:text-primary hover:underline">
                    {params.data.submission_id}
                </Link>
            ),
        },
        {
            field: 'verdict',
            headerName: 'Verdict',
            width: 130,
            filter: true,
            cellRenderer: (params: { data: CourseSubmissionRow }) => (
                <VerdictCell verdict={params.data.verdict} verdicts={verdicts} />
            ),
        },
        {
            field: 'compiler_id',
            headerName: 'Compiler',
            width: 160,
            filter: true,
            cellRenderer: (params: { data: CourseSubmissionRow }) => (
                <CompilerCell compilerId={params.data.compiler_id} compilers={compilers} />
            ),
        },
    ]
}

function VerdictCell({ verdict, verdicts }: { verdict: string; verdicts: Record<string, Verdict> }) {
    let emoji = '🔘'
    let klass = 'animate-pulse'
    const info = verdicts[verdict]
    if (info && 'emoji' in info) {
        emoji = info.emoji
        klass = ''
    }

    return (
        <div className="flex flex-row items-center gap-2">
            <div className={cn(klass)} aria-hidden>
                {emoji}
            </div>
            <span>{verdict}</span>
        </div>
    )
}

function CompilerCell({ compilerId, compilers }: { compilerId: string; compilers: Record<string, Compiler> }) {
    const language = compilers[compilerId]?.language ?? 'Unknown'
    return (
        <div className="flex flex-row items-center gap-2">
            <DevIcon proglang={language} size={14} />
            {compilerId}
        </div>
    )
}
