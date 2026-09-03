'use client'

import { ArrowDownWideNarrowIcon, FolderPenIcon, FunnelIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { CoursesHelpDialog } from '@/components/courses/CoursesHelpDialog'
import { SearchInput } from '@/components/SearchInput'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CoursesInstructorFilter, CoursesOfficialFilter, CoursesSortField } from '@/lib/courses'
import { ButtonGroup } from '../ui/button-group'

type CoursesListToolbarProps = {
    searchQuery: string
    onSearchQueryChange: (value: string) => void
    officialFilter: CoursesOfficialFilter
    onOfficialFilterChange: (value: CoursesOfficialFilter) => void
    instructorFilter?: CoursesInstructorFilter
    onInstructorFilterChange?: (value: CoursesInstructorFilter) => void
    sortField: CoursesSortField
    onSortFieldChange: (value: CoursesSortField) => void
    visibleCount?: number
    totalCount?: number
    showHelp?: boolean
}

export function CoursesListToolbar({
    searchQuery,
    onSearchQueryChange,
    officialFilter,
    onOfficialFilterChange,
    instructorFilter,
    onInstructorFilterChange,
    sortField,
    onSortFieldChange,
    visibleCount,
    totalCount,
    showHelp = false,
}: CoursesListToolbarProps) {
    const { user } = useAuth()
    const showCountBadge = visibleCount !== undefined && totalCount !== undefined
    const showInstructorFilter = instructorFilter !== undefined && onInstructorFilterChange !== undefined

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
                                    <Button type="button" variant="outline" size="icon" aria-label="Filter courses">
                                        <FunnelIcon aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top">Filter courses</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>Official</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={officialFilter}
                                onValueChange={(value) => onOfficialFilterChange(value as CoursesOfficialFilter)}
                            >
                                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="official">Official</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="unofficial">Non-official</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            {showInstructorFilter ? (
                                <>
                                    <DropdownMenuLabel>Instructor</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={instructorFilter}
                                        onValueChange={(value) =>
                                            onInstructorFilterChange(value as CoursesInstructorFilter)
                                        }
                                    >
                                        <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="instructor">Instructor</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="non-instructor">
                                            Non-instructor
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" aria-label="Sort courses">
                                        <ArrowDownWideNarrowIcon aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top">Sort courses</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={sortField}
                                onValueChange={(value) => onSortFieldChange(value as CoursesSortField)}
                            >
                                <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="author">Author</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ButtonGroup>
                <SearchInput
                    showSearchIcon
                    value={searchQuery}
                    onChange={(event) => onSearchQueryChange(event.target.value)}
                    placeholder="Search…"
                    className="w-64 shrink-0"
                    aria-label="Search courses"
                />
                {user?.instructor ? (
                    <ButtonGroup>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="outline" size="icon">
                                    <Link href="/instructor/courses/new" aria-label="New course">
                                        <PlusIcon aria-hidden />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">New course</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="outline" size="icon">
                                    <Link href="/instructor/courses" aria-label="Manage courses">
                                        <FolderPenIcon aria-hidden />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Manage courses</TooltipContent>
                        </Tooltip>
                    </ButtonGroup>
                ) : null}
                {showHelp ? <CoursesHelpDialog /> : null}
            </div>
        </TooltipProvider>
    )
}
