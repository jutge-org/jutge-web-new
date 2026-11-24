'use client'

import { useMemo } from 'react'
import Link from 'next/link'

import { AgTableAutoHeight, AgTableFull } from '@/components/administrator/AgTable'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemStatusIcon } from '@/components/problems/ProblemStatusIcon'
import { ProblemTitleSummaryTooltip } from '@/components/problems/ProblemTitleSummaryTooltip'
import { ProblemTypeIcon } from '@/components/problems/ProblemTypeIcon'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProblemRow } from '@/lib/data/problems'
import type { ProblemsColumnVisibility } from '@/lib/problems'
import type { AbstractStatus, Language } from '@/lib/jutge_api_client'

type ProblemsListTableProps = {
    problems: ProblemRow[]
    languages: Record<string, Language>
    statuses?: Record<string, AbstractStatus>
    preferredLanguageId?: string | null
    columnVisibility: ProblemsColumnVisibility
    /** Fit grid height to row count instead of filling the viewport. */
    autoHeight?: boolean
}

export function useProblemsListColumnDefs({
    languages,
    statuses,
    preferredLanguageId = null,
    columnVisibility,
}: Omit<ProblemsListTableProps, 'problems'>) {
    const languageId = preferredLanguageId ?? null
    return useMemo(
        () => [
            ...(statuses
                ? [
                      {
                          field: 'status',
                          headerName: 'Status',
                          width: 100,
                          sortable: true,
                          filter: true,
                          hide: !columnVisibility.status,
                          cellRenderer: (params: { data: ProblemRow }) => {
                              const data = statuses[params.data.problem_nm]
                              if (
                                  data?.status === 'accepted' ||
                                  data?.status === 'rejected' ||
                                  data?.status === 'scored'
                              ) {
                                  return <ProblemStatusIcon status={data} className="size-4 shrink-0 translate-y-1" />
                              }
                              return ''
                          },
                          valueGetter: (params: { data: ProblemRow }) => statuses[params.data.problem_nm]?.status ?? '',
                      },
                  ]
                : []),

            {
                field: 'problem_nm',
                headerName: 'Id',
                width: 112,
                sortable: true,
                filter: true,
                hide: !columnVisibility.problem_nm,
                cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
                cellRenderer: (params: { data: ProblemRow }) => (
                    <ProblemTitleSummaryTooltip
                        problem_nm={params.data.problem_nm}
                        title={params.data.title}
                        preferredLanguageId={languageId}
                    >
                        <Link href={`/problems/${params.data.problem_nm}`} className="tabular-nums text-sm">
                            <span className="flex flex-row items-center gap-3">
                                {params.data.iconUrl ? (
                                    <ProblemIconImage
                                        iconUrl={params.data.iconUrl}
                                        size="xs"
                                        className="translate-y-px"
                                    />
                                ) : null}
                                {params.data.problem_nm}
                            </span>
                        </Link>
                    </ProblemTitleSummaryTooltip>
                ),
                valueGetter: (params: { data: ProblemRow }) => params.data.problem_nm,
            },
            {
                field: 'title',
                flex: 1,
                sortable: true,
                filter: true,
                hide: !columnVisibility.title,
                cellRenderer: (params: { data: ProblemRow }) => (
                    <ProblemTitleSummaryTooltip
                        problem_nm={params.data.problem_nm}
                        title={params.data.title}
                        preferredLanguageId={languageId}
                    >
                        <span className="inline-flex items-center gap-1.5">{params.data.title}</span>
                    </ProblemTitleSummaryTooltip>
                ),
            },
            {
                field: 'author',
                headerName: 'Author',
                width: 170,
                sortable: true,
                filter: true,
                hide: !columnVisibility.author,
                valueGetter: (params: { data: ProblemRow }) => params.data.author ?? '',
                cellRenderer: (params: { data: ProblemRow }) => params.data.author ?? '—',
            },
            {
                field: 'language_ids',
                headerName: 'Languages',
                width: 200,
                sortable: true,
                filter: true,
                hide: !columnVisibility.language_ids,
                cellRenderer: (params: { data: ProblemRow }) => (
                    <div className="flex flex-wrap gap-1">
                        {params.data.language_ids.map((languageId) => (
                            <Tooltip key={languageId}>
                                <TooltipTrigger asChild>
                                    <Badge className="mt-2.5" variant="outline">
                                        {languageId}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    {languages[languageId]?.eng_name ?? languageId}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                ),
                valueGetter: (params: { data: ProblemRow }) => params.data.language_ids.join(', '),
            },
            {
                field: 'driver_id',
                headerName: 'Type',
                width: 90,
                sortable: true,
                filter: true,
                hide: !columnVisibility.driver_id,
                cellRenderer: (params: { data: ProblemRow }) =>
                    params.data.driver_id ? (
                        <ProblemTypeIcon type={params.data.driver_id} className="text-muted-foreground translate-y-1" />
                    ) : (
                        '—'
                    ),
                valueGetter: (params: { data: ProblemRow }) => params.data.driver_id ?? '',
            },
        ],
        [columnVisibility, languageId, languages, statuses],
    )
}

export function ProblemsListTable({
    problems,
    languages,
    statuses,
    preferredLanguageId = null,
    columnVisibility,
    autoHeight = false,
}: ProblemsListTableProps) {
    const colDefs = useProblemsListColumnDefs({
        languages,
        statuses,
        preferredLanguageId,
        columnVisibility,
    })

    const Table = autoHeight ? AgTableAutoHeight : AgTableFull

    return (
        <TooltipProvider>
            <div className="[&_.ag-problem-column-header_.ag-header-cell-label]:justify-center">
                <Table rowData={problems} columnDefs={colDefs} />
            </div>
        </TooltipProvider>
    )
}