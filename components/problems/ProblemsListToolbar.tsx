'use client'

import { BinocularsIcon, Columns3Icon, FolderPenIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ProblemsHelpDialog } from '@/components/problems/ProblemsHelpDialog'
import { SearchInput } from '@/components/SearchInput'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PROBLEMS_COLUMN_LABELS, type ProblemsColumnField, type ProblemsColumnVisibility } from '@/lib/problems'

type ProblemsListToolbarProps = {
    searchQuery: string
    onSearchQueryChange: (value: string) => void
    columnVisibility: ProblemsColumnVisibility
    onColumnVisibilityChange: (field: ProblemsColumnField, visible: boolean) => void
    showStatusColumn?: boolean
    showAdvancedSearch?: boolean
    visibleCount?: number
    totalCount?: number
    showHelp?: boolean
}

const TOGGLEABLE_COLUMNS: ProblemsColumnField[] = ['problem_nm', 'title', 'author', 'language_ids', 'driver_id']

export function ProblemsListToolbar({
    searchQuery,
    onSearchQueryChange,
    columnVisibility,
    onColumnVisibilityChange,
    showStatusColumn = false,
    showAdvancedSearch = false,
    visibleCount,
    totalCount,
    showHelp = false,
}: ProblemsListToolbarProps) {
    const { user } = useAuth()
    const columns = showStatusColumn ? (['status', ...TOGGLEABLE_COLUMNS] as ProblemsColumnField[]) : TOGGLEABLE_COLUMNS
    const showCountBadge = visibleCount !== undefined && totalCount !== undefined
    const trimmedSearchQuery = searchQuery.trim()
    const advancedSearchHref =
        trimmedSearchQuery.length > 0
            ? `/problems/search?q=${encodeURIComponent(trimmedSearchQuery)}`
            : '/problems/search'

    return (
        <TooltipProvider>
            <div className="flex flex-row items-center justify-end gap-2">
                {showCountBadge ? (
                    <Badge variant="outline" className="tabular-nums">
                        {visibleCount === totalCount ? visibleCount : `${visibleCount}/${totalCount}`}
                    </Badge>
                ) : null}
                <ButtonGroup>
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
                                    {PROBLEMS_COLUMN_LABELS[field]}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {showAdvancedSearch ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="outline" className="gap-2">
                                    <Link href={advancedSearchHref} aria-label="Advanced search">
                                        <BinocularsIcon aria-hidden />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Advanced search</TooltipContent>
                        </Tooltip>
                    ) : null}
                </ButtonGroup>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="w-64 shrink-0">
                            <SearchInput
                                showSearchIcon
                                value={searchQuery}
                                onChange={(event) => onSearchQueryChange(event.target.value)}
                                placeholder="Search…"
                                aria-label="Search problems"
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Simple search</TooltipContent>
                </Tooltip>
                {user?.instructor ? (
                    <ButtonGroup>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="outline" size="icon">
                                    <Link href="/instructor/problems/new" aria-label="New problem">
                                        <PlusIcon aria-hidden />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">New problem</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="outline" size="icon">
                                    <Link href="/instructor/problems" aria-label="Manage problems">
                                        <FolderPenIcon aria-hidden />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Manage problems</TooltipContent>
                        </Tooltip>
                    </ButtonGroup>
                ) : null}
                {showHelp ? <ProblemsHelpDialog /> : null}
            </div>
        </TooltipProvider>
    )
}
