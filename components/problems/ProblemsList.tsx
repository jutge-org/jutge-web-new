'use client'

import { useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import Link from 'next/link'

import { AgTableFull } from '@/components/administrator/AgTable'
import { LiveExamProblemsGrid, orderProblemsForExam } from '@/components/live/LiveExamProblemsGrid'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemStatusIcon } from '@/components/problems/ProblemStatusIcon'
import { ProblemTitleSummaryTooltip } from '@/components/problems/ProblemTitleSummaryTooltip'
import { ProblemTypeIcon } from '@/components/problems/ProblemTypeIcon'
import { ProblemsListToolbar } from '@/components/problems/ProblemsListToolbar'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    DEFAULT_PROBLEMS_COLUMN_VISIBILITY,
    filterProblems,
    type ProblemsColumnField,
    type ProblemsColumnVisibility,
} from '@/lib/problems'
import type { AbstractStatus, Language, RunningExamProblem } from '@/lib/jutge_api_client'
import type { ProblemRow } from '@/lib/data/problems'

type ProblemsListProps = {
    problems: ProblemRow[]
    languages: Record<string, Language>
    statuses?: Record<string, AbstractStatus>
    showAdvancedSearch?: boolean
    showHelp?: boolean
    showPasscodes?: boolean
    preferredLanguageId?: string | null
    loading?: boolean
    layout?: 'table' | 'cards'
    examProblemsByNm?: ReadonlyMap<string, RunningExamProblem>
    problemOrder?: readonly string[]
}

export function ProblemsList({
    problems,
    languages,
    statuses,
    showAdvancedSearch = false,
    showHelp = false,
    showPasscodes,
    preferredLanguageId = null,
    loading = false,
    layout = 'table',
    examProblemsByNm,
    problemOrder,
}: ProblemsListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [columnVisibility, setColumnVisibility] = useState<ProblemsColumnVisibility>(
        DEFAULT_PROBLEMS_COLUMN_VISIBILITY,
    )

    const filteredProblems = useMemo(() => filterProblems(problems, searchQuery), [problems, searchQuery])

    const visibleProblems = useMemo(
        () => orderProblemsForExam(filteredProblems, problemOrder ?? []),
        [filteredProblems, problemOrder],
    )

    function handleColumnVisibilityChange(field: ProblemsColumnField, visible: boolean) {
        setColumnVisibility((current) => ({ ...current, [field]: visible }))
    }

    const colDefs = useMemo(
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
                //headerClass: 'ag-problem-column-header',
                cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
                cellRenderer: (params: { data: ProblemRow }) => (
                    <ProblemTitleSummaryTooltip
                        problem_nm={params.data.problem_nm}
                        title={params.data.title}
                        preferredLanguageId={preferredLanguageId}
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
                        preferredLanguageId={preferredLanguageId}
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
        [columnVisibility, languages, preferredLanguageId, statuses],
    )

    const showToolbar = layout !== 'cards'

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {showToolbar ? (
                    <ProblemsListToolbar
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={handleColumnVisibilityChange}
                        showStatusColumn={statuses !== undefined}
                        showAdvancedSearch={showAdvancedSearch}
                        showHelp={showHelp}
                        showPasscodes={showPasscodes}
                    />
                ) : null}
                {layout === 'cards' ? (
                    <LiveExamProblemsGrid problems={[]} languages={{}} loading />
                ) : (
                    <div
                        aria-busy="true"
                        aria-label="Loading problems"
                        className="flex min-h-64 items-center justify-center border border-dashed border-border bg-muted/20"
                    >
                        <Spinner className="size-8 text-muted-foreground" />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {showToolbar ? (
                <ProblemsListToolbar
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                    showStatusColumn={statuses !== undefined}
                    showAdvancedSearch={showAdvancedSearch}
                    showHelp={showHelp}
                    showPasscodes={showPasscodes}
                    visibleCount={visibleProblems.length}
                    totalCount={problems.length}
                />
            ) : null}

            {visibleProblems.length === 0 ? (
                <Empty className="border border-dashed border-border bg-muted/20 py-12">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <SearchIcon aria-hidden />
                        </EmptyMedia>
                        <EmptyTitle>No matching problems</EmptyTitle>
                        <EmptyDescription>Try a different search term or clear the search box.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : layout === 'cards' ? (
                <LiveExamProblemsGrid
                    problems={visibleProblems}
                    languages={languages}
                    statuses={statuses}
                    examProblemsByNm={examProblemsByNm}
                    columnVisibility={columnVisibility}
                />
            ) : (
                <TooltipProvider>
                    <div className="[&_.ag-problem-column-header_.ag-header-cell-label]:justify-center">
                        <AgTableFull rowData={visibleProblems} columnDefs={colDefs} />
                    </div>
                </TooltipProvider>
            )}
        </div>
    )
}
