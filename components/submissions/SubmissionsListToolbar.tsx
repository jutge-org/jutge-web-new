'use client'

import { Columns3Icon, FunnelIcon } from 'lucide-react'

import { ProblemCountBadge } from '@/components/courses/ProblemCountBadge'
import { SubmissionsHelpDialog } from '@/components/submissions/SubmissionsHelpDialog'
import { SearchInput } from '@/components/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    SUBMISSIONS_COLUMN_LABELS,
    type SubmissionsColumnField,
    type SubmissionsColumnVisibility,
    type SubmissionsDefaultColumnField,
    type SubmissionsProblemColumnField,
    type SubmissionsVerdictFilter,
} from '@/lib/submissions'

const DEFAULT_TOGGLEABLE_COLUMNS: SubmissionsDefaultColumnField[] = [
    'problem_id',
    'submission_id',
    'verdict',
    'compiler_id',
    'time_inMs',
    'annotation',
]

const PROBLEM_TOGGLEABLE_COLUMNS: SubmissionsProblemColumnField[] = [
    'language_id',
    'submission_id',
    'verdict',
    'compiler_id',
    'time_inMs',
    'annotation',
]

type SubmissionsListToolbarProps = {
    variant?: 'default' | 'problem'
    searchQuery: string
    onSearchQueryChange: (value: string) => void
    verdictFilter: SubmissionsVerdictFilter
    onVerdictFilterChange: (value: SubmissionsVerdictFilter) => void
    columnVisibility: SubmissionsColumnVisibility
    onColumnVisibilityChange: (field: SubmissionsColumnField, visible: boolean) => void
    visibleCount?: number
    totalCount?: number
    okCount?: number
    koCount?: number
    showHelp?: boolean
}

export function SubmissionsListToolbar({
    variant = 'default',
    searchQuery,
    onSearchQueryChange,
    verdictFilter,
    onVerdictFilterChange,
    columnVisibility,
    onColumnVisibilityChange,
    visibleCount,
    totalCount,
    okCount,
    koCount,
    showHelp = false,
}: SubmissionsListToolbarProps) {
    const columns = variant === 'problem' ? PROBLEM_TOGGLEABLE_COLUMNS : DEFAULT_TOGGLEABLE_COLUMNS
    const showCountBadge = false && visibleCount !== undefined && totalCount !== undefined
    const showOkKoBadges = okCount !== undefined && koCount !== undefined

    return (
        <TooltipProvider>
            <div className="flex flex-row items-center justify-end gap-2">
                {showOkKoBadges || showCountBadge ? (
                    <div className="flex items-center gap-1.5">
                        {showOkKoBadges && okCount > 0 ? (
                            <ProblemCountBadge tone="ok" count={okCount} label="Accepted submissions" />
                        ) : null}
                        {showOkKoBadges && koCount > 0 ? (
                            <ProblemCountBadge tone="ko" count={koCount} label="Rejected submissions" />
                        ) : null}
                        {showCountBadge ? (
                            <Badge variant="outline" className="tabular-nums ml-2">
                                {visibleCount === totalCount ? visibleCount : `${visibleCount}/${totalCount}`}
                            </Badge>
                        ) : null}
                    </div>
                ) : null}
                <ButtonGroup>
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" aria-label="Filter submissions">
                                        <FunnelIcon aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top">Filter submissions</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>Verdict</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={verdictFilter}
                                onValueChange={(value) => onVerdictFilterChange(value as SubmissionsVerdictFilter)}
                            >
                                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="accepted">Accepted</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="rejected">Rejected</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" aria-label="Toggle columns">
                                        <Columns3Icon aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top">Columns</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>Columns</DropdownMenuLabel>
                            {columns.map((field) => (
                                <DropdownMenuCheckboxItem
                                    key={field}
                                    checked={columnVisibility[field]}
                                    onCheckedChange={(checked) => onColumnVisibilityChange(field, checked === true)}
                                >
                                    {SUBMISSIONS_COLUMN_LABELS[field]}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ButtonGroup>
                <SearchInput
                    showSearchIcon
                    value={searchQuery}
                    onChange={(event) => onSearchQueryChange(event.target.value)}
                    placeholder="Search…"
                    className="w-64 shrink-0"
                    aria-label="Search submissions"
                />
                {showHelp ? <SubmissionsHelpDialog /> : null}
            </div>
        </TooltipProvider>
    )
}
