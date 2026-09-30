'use client'

import Link from 'next/link'
import { GlobeIcon, GraduationCapIcon, ShieldCheckIcon, SignatureIcon, UsersIcon } from 'lucide-react'

import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { ProblemCountBadge } from '@/components/courses/ProblemCountBadge'
import { referenceLinkClassName } from '@/components/documentation/ReferenceLink'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { type ProblemStatusCounts } from '@/lib/courses'
import { cn } from '@/lib/utils'

/** Thin horizontal strip. Relative, so a stretched title link can cover it. */
export function CourseCardShell({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div
            className={cn(
                'group relative flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-sm transition-[box-shadow,border-color,background-color] duration-200 ease-out',
                'hover:border-primary/25 hover:bg-accent/40',
                'has-focus-visible:border-primary/25 has-focus-visible:bg-accent/40',
                className,
            )}
        >
            {children}
        </div>
    )
}

type CourseCardIdentityProps = {
    iconUrl: string
    title: string
    href: string
    ownerName: string
    isOwner?: boolean
    isTutor?: boolean
    isOfficial: boolean
    isPublic?: boolean
    /** Makes the title link cover the whole strip, for strips with no other interactive parts. */
    stretched?: boolean
}

export function CourseCardIdentity({
    iconUrl,
    title,
    href,
    ownerName,
    isOwner,
    isTutor,
    isOfficial,
    isPublic,
    stretched = false,
}: CourseCardIdentityProps) {
    return (
        <>
            {stretched ? (
                <CourseIconImage iconUrl={iconUrl} size="sm" />
            ) : (
                <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden>
                    <CourseIconImage iconUrl={iconUrl} size="sm" />
                </Link>
            )}
            <div className="min-w-0 flex-1">
                <Link
                    href={href}
                    className={cn(
                        referenceLinkClassName,
                        'block truncate text-base font-medium',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        stretched && 'after:absolute after:inset-0 after:rounded-xl after:content-[""]',
                    )}
                >
                    {title}
                </Link>
                <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex min-w-0 items-center gap-1">
                        <SignatureIcon className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">{ownerName}</span>
                    </span>
                    <CourseBadges isOwner={isOwner} isTutor={isTutor} isOfficial={isOfficial} isPublic={isPublic} />
                </div>
            </div>
        </>
    )
}

type CourseBadgesProps = {
    isOwner?: boolean
    isTutor?: boolean
    isOfficial: boolean
    isPublic?: boolean
}

function CourseBadges({ isOwner, isTutor, isOfficial, isPublic }: CourseBadgesProps) {
    if (!isOwner && !isTutor && !isOfficial && !isPublic) {
        return null
    }

    return (
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {isOwner ? (
                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[11px] font-normal">
                    <GraduationCapIcon aria-hidden />
                    Instructor
                </Badge>
            ) : null}
            {isTutor ? (
                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[11px] font-normal">
                    <UsersIcon aria-hidden />
                    Tutor
                </Badge>
            ) : null}
            {isOfficial ? (
                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[11px] font-normal">
                    <ShieldCheckIcon aria-hidden />
                    Official
                </Badge>
            ) : null}
            {isPublic ? (
                <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[11px] font-normal">
                    <GlobeIcon aria-hidden />
                    Public
                </Badge>
            ) : null}
        </div>
    )
}

function pluralize(count: number, singular: string): string {
    return `${count} ${count === 1 ? singular : `${singular}s`}`
}

export function CourseStatsLoading() {
    return (
        <div className="flex shrink-0 items-center gap-1.5" aria-busy="true" aria-label="Loading course progress">
            <Skeleton className="h-5 w-6 rounded-4xl" />
            <Skeleton className="h-5 w-6 rounded-4xl" />
            <Skeleton className="h-5 w-6 rounded-4xl" />
        </div>
    )
}

type CourseStatsProps = {
    counts?: ProblemStatusCounts
    /** Shown instead of the badges when there is no progress to report. */
    problemCount?: number
}

/**
 * Course progress at a glance, in the same badges the lists inside a course use: solved,
 * partially scored, unsolved, and the total. Zero solved or unsolved still shows, since on
 * an overview "none yet" is itself the information.
 */
export function CourseStats({ counts, problemCount }: CourseStatsProps) {
    if (!counts || counts.total === 0) {
        if (!problemCount) {
            return null
        }

        return (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {pluralize(problemCount, 'problem')}
            </span>
        )
    }

    return (
        <div className="flex shrink-0 items-center gap-1.5">
            <ProblemCountBadge tone="ok" count={counts.ok} label={`${pluralize(counts.ok, 'problem')} solved`} />
            {counts.scored > 0 ? (
                <ProblemCountBadge
                    tone="scored"
                    count={counts.scored}
                    label={`${pluralize(counts.scored, 'problem')} partially scored`}
                />
            ) : null}
            <ProblemCountBadge
                tone="ko"
                count={counts.ko}
                label={`${pluralize(counts.ko, 'problem')} attempted without success`}
            />
            <ProblemCountBadge
                tone="total"
                count={counts.total}
                label={`${pluralize(counts.total, 'problem')} in this course`}
                className="ml-2"
            />
        </div>
    )
}
