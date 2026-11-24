'use client'

import { useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'

import { LiveExamProblemsGrid, orderProblemsForExam } from '@/components/live/LiveExamProblemsGrid'
import { ProblemsListTable } from '@/components/problems/ProblemsListTable'
import { ProblemsListToolbar } from '@/components/problems/ProblemsListToolbar'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
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
                    <LiveExamProblemsGrid problems={[]} loading />
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
                    statuses={statuses}
                    examProblemsByNm={examProblemsByNm}
                    columnVisibility={columnVisibility}
                />
            ) : (
                <ProblemsListTable
                    problems={visibleProblems}
                    languages={languages}
                    statuses={statuses}
                    preferredLanguageId={preferredLanguageId}
                    columnVisibility={columnVisibility}
                />
            )}
        </div>
    )
}
