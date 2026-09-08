'use client'

import { array2csv } from '@/actions/instructor/csv'
import { AgTable } from '@/components/administrator/AgTable'
import { ExternalLink } from '@/components/ExternalLink'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { SaveFileIconButton } from '@/components/instructor/statistics/SaveFileIconButton'
import { CardAction, CardContent, CardHeader, CardTitle, ResizableCard } from '@/components/ResizableCard'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { deriveCourseProblemRanking } from '@/lib/instructor/courseProblemRanking'
import type { Dict } from '@/lib/instructor/utils'
import { problemIconUrl } from '@/lib/problems'
import { saveFileWithDialog } from '@/lib/saveFileWithDialog'
import type { AbstractProblem, CourseSubmission, InstructorCourse, InstructorList } from '@/lib/jutge_api_client'
import type { ICellRendererParams } from 'ag-grid-community'
import { BarChart3Icon, FileDownIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { toast } from 'sonner'

type CourseProblemRankingCardProps = {
    course: InstructorCourse
    lists: InstructorList[]
    submissions: CourseSubmission[]
    abstractProblems: Dict<AbstractProblem>
    statisticsBaseHref?: string
}

export function CourseProblemRankingCard({
    course,
    lists,
    submissions,
    abstractProblems,
    statisticsBaseHref,
}: CourseProblemRankingCardProps) {
    const baseHref = statisticsBaseHref ?? `/instructor/courses/${course.course_nm}/statistics`
    const colDefs = useMemo(
        () => [
            {
                field: 'iconUrl',
                headerName: '',
                width: 36,
                sortable: false,
                filter: false,
                cellRenderer: (params: ICellRendererParams<{ problem_nm: string }>) => {
                    const iconUrl = problemIconUrl(abstractProblems[params.data!.problem_nm]?.icon)
                    return iconUrl ? <ProblemIconImage iconUrl={iconUrl} size="xs" className="translate-y-1" /> : null
                },
            },
            {
                field: 'problem_nm',
                headerName: 'Id',
                width: 120,
                filter: true,
                cellRenderer: (params: ICellRendererParams<{ problem_nm: string }>) => (
                    <ExternalLink
                        href={`https://jutge.org/problems/${params.data!.problem_nm}`}
                        className="text-primary"
                    >
                        {params.data!.problem_nm}
                    </ExternalLink>
                ),
            },
            {
                field: 'title',
                flex: 2,
                filter: true,
            },
            {
                field: 'ok',
                headerName: '#OK',
                width: 120,
                filter: false,
                type: 'rightAligned',
            },
            {
                field: 'ko',
                headerName: '#KO',
                width: 120,
                filter: false,
                type: 'rightAligned',
            },
            {
                field: 'sc',
                headerName: '#SC',
                width: 120,
                filter: false,
                type: 'rightAligned',
            },
            {
                field: 'nt',
                headerName: '#NT',
                width: 120,
                filter: false,
                type: 'rightAligned',
            },
            {
                field: 'totalSubmissions',
                headerName: '#Sub',
                width: 120,
                filter: false,
                type: 'rightAligned',
            },
            {
                field: 'avgSubmissionsPerStudent',
                headerName: 'Avg #Sub/std',
                width: 180,
                filter: false,
                type: 'rightAligned',
                valueFormatter: (params: { value: number }) =>
                    Number.isFinite(params.value) ? params.value.toFixed(1) : '',
            },
            {
                headerName: '',
                width: 52,
                filter: false,
                sortable: false,
                suppressHeaderMenuButton: true,
                cellRenderer: (params: ICellRendererParams<{ problem_nm: string }>) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8" asChild>
                                    <Link href={`${baseHref}/${params.data!.problem_nm}`}>
                                        <BarChart3Icon className="size-4" aria-hidden />
                                        <span className="sr-only">Problem statistics</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Problem statistics</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ),
            },
        ],
        [baseHref, abstractProblems],
    )

    const rows = useMemo(
        () => deriveCourseProblemRanking(course, lists, submissions, abstractProblems),
        [course, lists, submissions, abstractProblems],
    )

    async function saveCsvHandle() {
        const data = rows.map((row) => ({
            Id: row.problem_nm,
            title: row.title,
            '#OK': row.ok,
            '#KO': row.ko,
            '#SC': row.sc,
            '#NT': row.nt,
            '#Sub': row.totalSubmissions,
            'Avg #Sub/std': Number.isFinite(row.avgSubmissionsPerStudent)
                ? row.avgSubmissionsPerStudent.toFixed(1)
                : '',
        }))
        const csv = await array2csv(data)
        if (!csv) {
            toast.error('Error preparing CSV data')
            return
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        await saveFileWithDialog({
            blob,
            suggestedName: `${course.course_nm}-problems.csv`,
            types: [{ description: 'CSV file', accept: { 'text/csv': ['.csv'] } }],
        })
    }

    return (
        <ResizableCard className="w-full" defaultHeight={480}>
            <CardHeader className="p-4">
                <CardTitle>Problems</CardTitle>
                <CardAction>
                    <TooltipProvider>
                        <SaveFileIconButton
                            onClick={saveCsvHandle}
                            disabled={rows.length === 0}
                            tooltip="Save table as CSV"
                            aria-label="Save table as CSV"
                            icon={FileDownIcon}
                        />
                    </TooltipProvider>
                </CardAction>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-4">
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No problems to display.</p>
                ) : (
                    <div className="min-h-0 w-full flex-1">
                        <AgTable
                            rowData={rows}
                            columnDefs={colDefs}
                            rowHeight={36}
                            wrapperBorder={false}
                            themeParams={{
                                backgroundColor: 'var(--card)',
                                oddRowBackgroundColor: 'var(--card)',
                                chromeBackgroundColor: 'var(--card)',
                            }}
                        />
                    </div>
                )}
            </CardContent>
        </ResizableCard>
    )
}
