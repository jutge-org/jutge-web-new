'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useMemo } from 'react'
import Link from 'next/link'

import { AgTableAutoHeight } from '@/components/administrator/AgTable'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemIdLabel } from '@/components/problems/ProblemIdLabel'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SubmissionRow } from '@/lib/submissions'

dayjs.extend(relativeTime)

type ExamSubmissionsTableProps = {
    submissions: SubmissionRow[]
}

const ROW_HEIGHT = 32
const HEADER_HEIGHT = 32

const defaultColDef = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: false,
}

const verdictEmojiCellStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    paddingLeft: 8,
    paddingRight: 4,
}

export function ExamSubmissionsTable({ submissions }: ExamSubmissionsTableProps) {
    const colDefs = useMemo(
        () => [
            {
                field: 'verdictEmoji',
                headerName: '',
                width: 52,
                sortable: false,
                filter: false,
                cellStyle: verdictEmojiCellStyle,
                cellRenderer: (params: { data: SubmissionRow }) =>
                    params.data.verdictEmoji ? (
                        <span
                            aria-hidden
                            className={
                                params.data.verdict === 'Pending'
                                    ? 'inline-flex text-base leading-none animate-pulse'
                                    : 'inline-flex text-base leading-none'
                            }
                        >
                            {params.data.verdictEmoji}
                        </span>
                    ) : (
                        '—'
                    ),
            },
            {
                field: 'problem_id',
                headerName: 'Problem',
                width: 140,
                cellStyle: { display: 'flex', alignItems: 'center' },
                cellRenderer: (params: { data: SubmissionRow }) => (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href={params.data.problemHref}
                                className="inline-flex min-w-0 items-center gap-1.5 text-sm hover:text-primary hover:underline"
                            >
                                {params.data.iconUrl ? (
                                    <ProblemIconImage
                                        iconUrl={params.data.iconUrl}
                                        size="2xs"
                                        className="shrink-0"
                                    />
                                ) : null}
                                <ProblemIdLabel problemId={params.data.problem_id} />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top">{params.data.problemTitle}</TooltipContent>
                    </Tooltip>
                ),
                valueGetter: (params: { data: SubmissionRow }) => params.data.problem_id,
            },
            {
                field: 'submission_id',
                headerName: 'Submission',
                width: 132,
                cellRenderer: (params: { data: SubmissionRow }) => (
                    <Link href={params.data.submissionHref} className="text-sm hover:text-primary hover:underline">
                        {params.data.submission_id}
                    </Link>
                ),
            },
            {
                field: 'verdict',
                headerName: 'Verdict',
                width: 100,
                cellStyle: { display: 'flex', alignItems: 'center' },
                cellRenderer: (params: { data: SubmissionRow }) => (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>{params.data.verdict}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{params.data.verdictFullName}</TooltipContent>
                    </Tooltip>
                ),
                valueGetter: (params: { data: SubmissionRow }) => params.data.verdict,
            },
            {
                field: 'compiler_id',
                headerName: 'Compiler',
                width: 120,
                cellStyle: { display: 'flex', alignItems: 'center' },
                cellRenderer: (params: { data: SubmissionRow }) => (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>{params.data.compiler_id}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{params.data.compilerFullName}</TooltipContent>
                    </Tooltip>
                ),
                valueGetter: (params: { data: SubmissionRow }) => params.data.compiler_id,
            },
            {
                field: 'time_inMs',
                headerName: 'Time',
                width: 152,
                sort: 'desc',
                cellRenderer: (params: { data: SubmissionRow }) => (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>{dayjs(params.data.time_inMs).fromNow()}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{params.data.time_in}</TooltipContent>
                    </Tooltip>
                ),
                valueGetter: (params: { data: SubmissionRow }) => params.data.time_inMs,
            },
            {
                field: 'annotation',
                headerName: 'Annotation',
                flex: 1,
                minWidth: 100,
                cellRenderer: (params: { data: SubmissionRow }) =>
                    params.data.annotation ? (
                        <span className="text-muted-foreground">{params.data.annotation}</span>
                    ) : null,
                valueGetter: (params: { data: SubmissionRow }) => params.data.annotation ?? '',
            },
        ],
        [],
    )

    return (
        <TooltipProvider>
            <div className="min-w-0 overflow-x-auto px-1 pb-px [&_.ag-cell]:overflow-visible">
            <AgTableAutoHeight
                rowData={submissions}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
                rowHeight={ROW_HEIGHT}
                headerHeight={HEADER_HEIGHT}
                wrapperBorder={false}
                themeParams={{
                    backgroundColor: 'var(--card)',
                    oddRowBackgroundColor: 'var(--card)',
                    chromeBackgroundColor: 'var(--card)',
                }}
            />
            </div>
        </TooltipProvider>
    )
}
