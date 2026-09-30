'use client'

import { useMemo } from 'react'
import Link from 'next/link'

import { AgTableAutoHeight } from '@/components/administrator/AgTable'
import { referenceLinkClassName } from '@/components/documentation/ReferenceLink'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemStatusIcon } from '@/components/problems/ProblemStatusIcon'
import { ProblemTitleSummaryTooltip } from '@/components/problems/ProblemTitleSummaryTooltip'
import { ProblemTypeIcon } from '@/components/problems/ProblemTypeIcon'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { LastSubmissionInfo } from '@/lib/submissions'
import type { AbstractStatus, Language } from '@/lib/jutge_api_client'
import type { SupervisionContext } from '@/lib/supervision'
import { supervisionProblemHref } from '@/lib/supervision'
import type { CourseListItemRow } from '@/lib/data/lists'
import { cn } from '@/lib/utils'

type CourseListItemsTableProps = {
    items: CourseListItemRow[]
    languages: Record<string, Language>
    statuses?: Record<string, AbstractStatus>
    lastSubmissions?: Record<string, LastSubmissionInfo>
    supervisionContext?: SupervisionContext
    preferredLanguageId?: string | null
}

function isProblemRow(row: CourseListItemRow): row is Extract<CourseListItemRow, { kind: 'problem' }> {
    return row.kind === 'problem'
}

const ROW_HEIGHT = 36
const HEADER_HEIGHT = 36

export function CourseListItemsTable({
    items,
    languages,
    statuses,
    lastSubmissions,
    supervisionContext,
    preferredLanguageId = null,
}: CourseListItemsTableProps) {
    const colDefs = useMemo(
        () => [
            ...(statuses
                ? [
                      {
                          field: 'status',
                          headerName: 'Status',
                          width: 100,
                          sortable: false,
                          filter: false,
                          cellRenderer: (params: { data: CourseListItemRow }) => {
                              if (!isProblemRow(params.data)) return ''
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
                      },
                  ]
                : []),

            {
                field: 'problem_nm',
                headerName: 'Problem',
                width: 112,
                sortable: false,
                filter: false,
                headerClass: 'ag-problem-column-header',
                cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
                cellRenderer: (params: { data: CourseListItemRow }) => {
                    if (!isProblemRow(params.data)) return ''
                    return (
                        <ProblemTitleSummaryTooltip
                            problem_nm={params.data.problem_nm}
                            title={params.data.title}
                            preferredLanguageId={preferredLanguageId}
                        >
                            <Link
                                href={
                                    supervisionContext
                                        ? supervisionProblemHref(supervisionContext, params.data.problem_nm)
                                        : `/problems/${params.data.problem_nm}`
                                }
                                className={cn(referenceLinkClassName, 'tabular-nums')}
                            >
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
                    )
                },
            },
            {
                field: 'title',
                flex: 1,
                sortable: false,
                filter: false,
                cellRenderer: (params: { data: CourseListItemRow }) => {
                    if (!isProblemRow(params.data)) {
                        return <span className="text-muted-foreground">{params.data.description}</span>
                    }
                    return <span className="inline-flex items-center gap-1.5">{params.data.title}</span>
                },
            },
            ...(lastSubmissions
                ? [
                      {
                          field: 'last_submission_id',
                          headerName: 'Last sub',
                          width: 112,
                          sortable: false,
                          filter: false,
                          cellRenderer: (params: { data: CourseListItemRow }) => {
                              if (!isProblemRow(params.data)) return ''
                              const submission = lastSubmissions[params.data.problem_nm]
                              if (!submission) return ''
                              return (
                                  <Link
                                      href={submission.submissionHref}
                                      className={referenceLinkClassName}
                                  >
                                      {submission.submission_id}
                                  </Link>
                              )
                          },
                      },
                  ]
                : []),
            {
                field: 'language_ids',
                headerName: 'Languages',
                width: 200,
                sortable: false,
                filter: false,
                cellStyle: { display: 'flex', alignItems: 'center' },
                cellRenderer: (params: { data: CourseListItemRow }) => {
                    if (!isProblemRow(params.data)) return ''
                    return (
                        <div className="flex flex-wrap items-center gap-1">
                            {params.data.language_ids.map((languageId) => (
                                <Tooltip key={languageId}>
                                    <TooltipTrigger asChild>
                                        <Badge variant="outline">{languageId}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        {languages[languageId]?.eng_name ?? languageId}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    )
                },
                valueGetter: (params: { data: CourseListItemRow }) =>
                    isProblemRow(params.data) ? params.data.language_ids.join(', ') : '',
            },
            {
                field: 'driver_id',
                headerName: 'Type',
                width: 90,
                sortable: false,
                filter: false,
                cellRenderer: (params: { data: CourseListItemRow }) => {
                    if (!isProblemRow(params.data)) return ''
                    return params.data.driver_id ? (
                        <ProblemTypeIcon type={params.data.driver_id} className="translate-y-1 text-muted-foreground" />
                    ) : (
                        '—'
                    )
                },
            },
        ],
        [languages, lastSubmissions, preferredLanguageId, statuses, supervisionContext],
    )

    return (
        <TooltipProvider>
            <div className="[&_.ag-problem-column-header_.ag-header-cell-label]:justify-center">
                <AgTableAutoHeight
                    rowData={items}
                    columnDefs={colDefs}
                    rowHeight={ROW_HEIGHT}
                    headerHeight={HEADER_HEIGHT}
                    wrapperBorder={false}
                    themeParams={{
                        backgroundColor: 'var(--card)',
                        oddRowBackgroundColor: 'var(--card)',
                        chromeBackgroundColor: 'var(--card)',
                    }}
                    getRowClass={(params: { data?: CourseListItemRow }) =>
                        params.data?.kind === 'separator' ? 'bg-muted/30' : undefined
                    }
                />
            </div>
        </TooltipProvider>
    )
}
