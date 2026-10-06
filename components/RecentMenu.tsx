'use client'

import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { useRecents } from '@/components/RecentsProvider'
import { SmoothDropdownMenuContent } from '@/components/smoothui/dropdown-menu/animated-content'
import SmoothButton from '@/components/smoothui/smooth-button'
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    formatRecentProblemTitle,
    recentCourseHref,
    recentProblemHref,
    recentSubmissionHref,
    type RecentCourseItem,
    type RecentProblemItem,
    type RecentSubmissionItem,
} from '@/lib/recents'
import { courseIconUrl } from '@/lib/courses'
import { HistoryIcon, BookOpenIcon, FileBracesCornerIcon, SendIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

type RecentSectionProps<T> = {
    label: string
    icon: ReactNode
    items: T[]
    renderHref: (item: T) => string
    renderTitle: (item: T) => ReactNode
    renderLeading?: (item: T) => ReactNode
    emptyLabel: string
}

function RecentSection<T>({
    label,
    icon,
    items,
    renderHref,
    renderTitle,
    renderLeading,
    emptyLabel,
}: RecentSectionProps<T>) {
    return (
        <>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {icon}
                {label}
            </DropdownMenuLabel>
            {items.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                    {emptyLabel}
                </DropdownMenuItem>
            ) : (
                items.map((item) => (
                    <DropdownMenuItem key={renderHref(item)} asChild>
                        <Link href={renderHref(item)} className="flex min-w-0 items-center gap-1.5">
                            {renderLeading ? renderLeading(item) : null}
                            <span className="truncate">{renderTitle(item)}</span>
                        </Link>
                    </DropdownMenuItem>
                ))
            )}
        </>
    )
}

export function RecentMenu() {
    const { recents } = useRecents()

    return (
        <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <SmoothButton
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                className="size-8 [&_svg]:size-4.5"
                                aria-label="Recent items"
                            >
                                <HistoryIcon aria-hidden />
                            </SmoothButton>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Recent items</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <SmoothDropdownMenuContent
                align="end"
                className="min-w-64 max-w-80 **:data-[slot=dropdown-menu-item]:py-1.5 **:data-[slot=dropdown-menu-item]:text-base"
            >
                <RecentSection<RecentCourseItem>
                    label="Courses"
                    icon={<BookOpenIcon className="size-4" aria-hidden />}
                    items={recents.courses}
                    renderHref={recentCourseHref}
                    renderTitle={(item) => item.title}
                    renderLeading={(item) => (
                        <CourseIconImage iconUrl={item.iconUrl ?? courseIconUrl(null)} size="xs" className="rounded" />
                    )}
                    emptyLabel="No recent courses"
                />
                <DropdownMenuSeparator />
                <RecentSection<RecentProblemItem>
                    label="Problems"
                    icon={<FileBracesCornerIcon className="size-4" aria-hidden />}
                    items={recents.problems}
                    renderHref={recentProblemHref}
                    renderTitle={formatRecentProblemTitle}
                    renderLeading={(item) =>
                        item.iconUrl ? <ProblemIconImage iconUrl={item.iconUrl} size="xs" className="rounded" /> : null
                    }
                    emptyLabel="No recent problems"
                />
                <DropdownMenuSeparator />
                <RecentSection<RecentSubmissionItem>
                    label="Submissions"
                    icon={<SendIcon className="size-4" aria-hidden />}
                    items={recents.submissions}
                    renderHref={recentSubmissionHref}
                    renderTitle={(item) => (
                        <>
                            {item.verdictEmoji ? (
                                <span aria-hidden className="mr-2">
                                    {item.verdictEmoji}
                                </span>
                            ) : null}
                            {item.title}
                        </>
                    )}
                    emptyLabel="No recent submissions"
                />
            </SmoothDropdownMenuContent>
        </DropdownMenu>
    )
}
