'use client'

import { BookOpenIcon, EyeIcon, MailIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import type { PublicProfile } from '@/lib/jutge_api_client'
import type { SupervisionCourseOption } from '@/lib/supervision'
import { cn } from '@/lib/utils'

type SupervisionStudentProfileCardProps = {
    profile: PublicProfile
    course: Pick<SupervisionCourseOption, 'title'>
}

function formatOptional(value: string | null | undefined): string {
    const trimmed = value?.trim()
    return trimmed ? trimmed : '—'
}

function useSupervisionHeaderClassName() {
    return cn(
        '-mt-4 flex w-full items-center justify-between gap-4 rounded-b-2xl border-l border-r border-b border-t-none px-6 py-2 text-left shadow-sm sm:gap-5',
    )
}

/** PageTitle-style header: overlaps the sticky bar and uses the supervision contextual gradient. */
export function SupervisionStudentProfileCard({ profile, course }: SupervisionStudentProfileCardProps) {
    const className = useSupervisionHeaderClassName()

    return (
        <div className={className}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <h1 className="my-0 flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                    <EyeIcon className="size-4" />
                    {formatOptional(profile.name)}
                </h1>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 text-right text-sm text-muted-foreground">
                <p className="my-0 flex items-center justify-end gap-2">
                    <MailIcon className="size-3 shrink-0" aria-hidden />
                    <span className="min-w-0 break-all">{profile.email}</span>
                </p>
                <p className="my-0 flex items-center justify-end gap-2">
                    <BookOpenIcon className="size-3 shrink-0" aria-hidden />
                    <span className="min-w-0 break-all">{course.title}</span>
                </p>
            </div>
        </div>
    )
}

export function SupervisionStudentProfileCardLoading() {
    const className = useSupervisionHeaderClassName()

    return (
        <div className={className} aria-busy="true" aria-label="Loading student profile">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className="h-5 w-48 max-w-full" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="h-4 w-44 max-w-full" />
            </div>
        </div>
    )
}
