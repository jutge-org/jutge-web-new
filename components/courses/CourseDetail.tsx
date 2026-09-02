'use client'

import { ArchiveIcon, BookOpenCheckIcon, Globe, ShieldCheck, SignatureIcon, UsersIcon } from 'lucide-react'

import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { CourseDescriptionDialog } from '@/components/courses/CourseDescriptionDialog'
import { CourseDetailActions } from '@/components/courses/CourseDetailActions'
import { CourseGuestLists } from '@/components/courses/CourseGuestLists'
import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { CourseLists } from '@/components/courses/CourseLists'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { buildCourseRow, type CourseStatus } from '@/lib/courses'
import type { LastSubmissionInfo } from '@/lib/submissions'
import type { AbstractStatus, Course, Language } from '@/lib/jutge_api_client'
import type { CourseListData } from '@/lib/data/lists'
import { isMotionReduced } from '@/lib/reducedMotion'
import { cn } from '@/lib/utils'

/** PageTitle-style shell: transparent, overlaps the sticky header. */
const courseTitleShellClassName =
    '-mt-6 flex min-h-22 flex-col gap-2 rounded-2xl border border-border px-4 py-5 text-left shadow-sm'

type CourseDetailProps = {
    courseKey: string
    course: Course
    status: CourseStatus
    isOwner: boolean
    isTutor: boolean
    userId: string
    lists: CourseListData[]
    languages: Record<string, Language>
    statuses?: Record<string, AbstractStatus>
    lastSubmissions?: Record<string, LastSubmissionInfo>
    listsLoading?: boolean
    problemCount?: number
    /** Called after enrolling, archiving, etc. so the page can fetch the course again. */
    onCourseChanged?: () => void
}

function CourseListCardLoading() {
    return (
        <Card className="gap-0 border border-border pt-2 pb-2 shadow-sm ring-0">
            <CardHeader className="flex items-center px-4 py-2">
                <div className="flex w-full items-center gap-2">
                    <Skeleton className="h-6 w-48" />
                    <div className="ml-auto flex items-center gap-1.5">
                        <Skeleton className="h-5 w-8 rounded-full" />
                        <Skeleton className="size-4" />
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}

export function CourseListsLoading({ count }: { count: number }) {
    if (count === 0) {
        return null
    }

    const expandedIndex = count > 1 ? 1 : 0

    return (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading course lists">
            {Array.from({ length: count }, (_, index) =>
                index === expandedIndex ? (
                    <Card key={index} className="gap-0 border border-border pt-2 pb-0 shadow-sm ring-0">
                        <CardHeader className="flex items-center border-b border-border px-4 py-2 [.border-b]:pb-2">
                            <div className="flex w-full items-center gap-2">
                                <Skeleton className="h-6 w-56" />
                                <div className="ml-auto flex items-center gap-1.5">
                                    <Skeleton className="h-5 w-8 rounded-full" />
                                    <Skeleton className="size-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center py-8">
                            <Spinner className="size-8 text-muted-foreground" />
                        </CardContent>
                    </Card>
                ) : (
                    <CourseListCardLoading key={index} />
                ),
            )}
        </div>
    )
}

export function CourseDetailLoading() {
    return (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading course">
            <div className={courseTitleShellClassName}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-5">
                        <Skeleton className="size-24 shrink-0 rounded-sm" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-7 w-full max-w-md" />
                            <Skeleton className="h-4 w-40" />
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="size-8 shrink-0 rounded-md" />
                </div>
            </div>
        </div>
    )
}

function CourseHeaderIconImage({ iconUrl }: { iconUrl: string }) {
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)

    return (
        <CourseIconImage
            iconUrl={iconUrl}
            size="lg"
            className={cn('shrink-0', !motionReduced && 'hover:animate-pulse')}
        />
    )
}

export function CourseDetail({
    courseKey,
    course,
    status,
    isOwner,
    isTutor,
    userId,
    lists,
    languages,
    statuses,
    lastSubmissions,
    listsLoading = false,
    problemCount,
    onCourseChanged,
}: CourseDetailProps) {
    const row = buildCourseRow(course, status, courseKey, isOwner)

    return (
        <div className="flex flex-col gap-6">
            <div className={courseTitleShellClassName}>
                <div className="flex items-start gap-5">
                    <CourseHeaderIconImage iconUrl={row.iconUrl} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                            <h1
                                className="my-0 min-w-0 text-2xl font-semibold tracking-tight text-foreground"
                                data-recent-course-icon-url={row.iconUrl}
                            >
                                {row.title}
                            </h1>
                            <CourseDetailActions
                                courseKey={courseKey}
                                title={row.title}
                                ownerName={row.ownerName}
                                status={status}
                                isOwner={isOwner}
                                isTutor={isTutor}
                                userId={userId}
                                onCourseChanged={onCourseChanged}
                            />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                            <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                                <SignatureIcon className="size-3 shrink-0" aria-hidden />
                                <span className="min-w-0 truncate">{row.ownerName}</span>
                            </p>
                            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                                {row.isOfficial ? (
                                    <Badge variant="outline" className="gap-1">
                                        <ShieldCheck aria-hidden />
                                        Official
                                    </Badge>
                                ) : null}
                                {row.isPublic ? (
                                    <Badge variant="outline" className="gap-1">
                                        <Globe aria-hidden />
                                        Public
                                    </Badge>
                                ) : null}
                                {isTutor ? (
                                    <Badge variant="outline" className="gap-1">
                                        <UsersIcon aria-hidden />
                                        Tutor
                                    </Badge>
                                ) : null}
                                {status === 'enrolled' && !isTutor ? (
                                    <Badge variant="outline" className="gap-1">
                                        <BookOpenCheckIcon aria-hidden />
                                        Enrolled
                                    </Badge>
                                ) : null}
                                {status === 'archived' ? (
                                    <Badge variant="outline" className="gap-1">
                                        <ArchiveIcon aria-hidden />
                                        Archived
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                        {row.description ? (
                            <div className="-ml-1.5">
                                <CourseDescriptionDialog
                                    title={row.title}
                                    ownerName={row.ownerName}
                                    description={row.description}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
                {status === 'available' ? <CourseGuestLists lists={course.lists} problemCount={problemCount} /> : null}
            </div>

            {status !== 'available' && listsLoading ? (
                <CourseListsLoading count={course.lists.length} />
            ) : status !== 'available' ? (
                <CourseLists
                    courseKey={courseKey}
                    lists={lists}
                    languages={languages}
                    statuses={statuses}
                    lastSubmissions={lastSubmissions}
                />
            ) : null}
        </div>
    )
}
