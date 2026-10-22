'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
    ArchiveIcon,
    ArchiveRestoreIcon,
    BookOpenCheckIcon,
    EditIcon,
    GraduationCap,
    Loader2Icon,
    LogOutIcon,
    EllipsisVerticalIcon,
    SearchIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import {
    archiveAllCoursesAction,
    archiveCourseAction,
    enrollCourseAction,
    unarchiveCourseAction,
    unenrollCourseAction,
} from '@/lib/data/coursesActions'
import { notifyEnrolledCoursesNavChanged } from '@/lib/enrolledCoursesNav'
import { useConfirmDialog } from '@/components/administrator/ConfirmDialog'
import { CourseCardIdentity, CourseCardShell, CourseStats, CourseStatsLoading } from '@/components/courses/CourseCard'
import { CoursesListToolbar } from '@/components/courses/CoursesListToolbar'
import { SuperviseCourseMenuItem } from '@/components/supervision/SuperviseCourseMenuItem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CourseProgress } from '@/lib/data/coursesProgress'
import {
    canSuperviseCourse,
    courseActionSuccessMessage,
    courseHref,
    instructorCoursePropertiesHref,
    type CourseRow,
    type CourseStudentAction,
    type CoursesInstructorFilter,
    type CoursesOfficialFilter,
    type CoursesSortField,
    type CoursesTab,
    filterAndSortCourses,
    partitionAvailableCoursesByAccess,
} from '@/lib/courses'

const UNENROLL_CONFIRMATION =
    'Please take into account that, after unenrolling from it, your instructor will not be able to see your progress. This could have strong consequences in the event your grade depends on it. You can enroll it again at any time.'

const ARCHIVE_ALL_PENDING_KEY = '*'
const ARCHIVE_ALL_MIN_COURSES = 4

type AvailableAccessTab = 'invited' | 'public'

type CourseCardsListProps = {
    courses: CourseRow[]
    tab: CoursesTab
    pendingKey: string | null
    userId: string
    progress?: Record<string, CourseProgress>
    progressLoading: boolean
    showArchiveAll: boolean
    onAction: (course: CourseRow, action: CourseAction) => void
    onArchiveAll: () => void
}

function CourseCardsList({
    courses,
    tab,
    pendingKey,
    userId,
    progress,
    progressLoading,
    showArchiveAll,
    onAction,
    onArchiveAll,
}: CourseCardsListProps) {
    return (
        <div className="flex flex-col gap-4">
            {courses.map((course) => (
                <StudentCourseCard
                    key={course.course_key}
                    course={course}
                    tab={tab}
                    pendingKey={pendingKey}
                    userId={userId}
                    progress={progress?.[course.course_key]}
                    progressLoading={progressLoading}
                    showArchiveAll={showArchiveAll}
                    onAction={onAction}
                    onArchiveAll={onArchiveAll}
                />
            ))}
        </div>
    )
}

type AvailableCoursesTabPanelProps = CourseCardsListProps & {
    accessTab: AvailableAccessTab
    totalInAccessTab: number
}

function AvailableCoursesTabPanel({
    courses,
    accessTab,
    totalInAccessTab,
    ...listProps
}: AvailableCoursesTabPanelProps) {
    if (courses.length > 0) {
        return <CourseCardsList courses={courses} {...listProps} />
    }

    if (totalInAccessTab === 0) {
        const empty =
            accessTab === 'invited'
                ? {
                      title: 'No invited courses',
                      description: 'When an instructor invites you to a private course, it will appear here.',
                  }
                : {
                      title: 'No public courses',
                      description: 'There are no public courses you can join right now.',
                  }

        return (
            <Empty className="border border-dashed border-border bg-muted/20 py-12">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <GraduationCap aria-hidden />
                    </EmptyMedia>
                    <EmptyTitle>{empty.title}</EmptyTitle>
                    <EmptyDescription>{empty.description}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        )
    }

    return (
        <Empty className="border border-dashed border-border bg-muted/20 py-12">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <SearchIcon aria-hidden />
                </EmptyMedia>
                <EmptyTitle>No matching courses</EmptyTitle>
                <EmptyDescription>Try a different search term, adjust filters, or clear the search box.</EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}

type AvailableCoursesTabsProps = Omit<CourseCardsListProps, 'courses'> & {
    invitedCourses: CourseRow[]
    publicCourses: CourseRow[]
    invitedTotal: number
    publicTotal: number
    accessTab: AvailableAccessTab
    onAccessTabChange: (tab: AvailableAccessTab) => void
}

function AvailableCoursesTabs({
    invitedCourses,
    publicCourses,
    invitedTotal,
    publicTotal,
    accessTab,
    onAccessTabChange,
    ...listProps
}: AvailableCoursesTabsProps) {
    if (invitedTotal === 0) {
        return (
            <AvailableCoursesTabPanel
                courses={publicCourses}
                accessTab="public"
                totalInAccessTab={publicTotal}
                {...listProps}
            />
        )
    }

    return (
        <Tabs
            value={accessTab}
            onValueChange={(value) => onAccessTabChange(value as AvailableAccessTab)}
            className="gap-4"
        >
            <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 sm:grid-cols-2 sm:h-auto">
                <TabsTrigger value="invited" className="h-auto min-h-8 px-2 py-1.5 text-left sm:text-center">
                    <span className="text-pretty">Courses where you are invited</span>
                    <Badge variant="secondary" className="ml-1 shrink-0 px-1.5 tabular-nums">
                        {invitedTotal}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger value="public" className="h-auto min-h-8 px-2 py-1.5 text-left sm:text-center">
                    Public courses
                    {publicTotal > 0 ? (
                        <Badge variant="secondary" className="ml-1 shrink-0 px-1.5 tabular-nums">
                            {publicTotal}
                        </Badge>
                    ) : null}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="invited" className="mt-0">
                <AvailableCoursesTabPanel
                    courses={invitedCourses}
                    accessTab="invited"
                    totalInAccessTab={invitedTotal}
                    {...listProps}
                />
            </TabsContent>
            <TabsContent value="public" className="mt-0">
                <AvailableCoursesTabPanel
                    courses={publicCourses}
                    accessTab="public"
                    totalInAccessTab={publicTotal}
                    {...listProps}
                />
            </TabsContent>
        </Tabs>
    )
}

type CoursesListProps = {
    tab: CoursesTab
    courses: CourseRow[]
    userId: string
    loading?: boolean
    /** Per-course progress, keyed by course key. Loaded after the cards first render. */
    progress?: Record<string, CourseProgress>
    progressLoading?: boolean
    /** Re-fetch the list. This page loads on the client, so router.refresh() does not re-run it. */
    onCoursesChanged?: () => void
}

type CourseAction = CourseStudentAction

type StudentCourseCardProps = {
    course: CourseRow
    tab: CoursesTab
    pendingKey: string | null
    userId: string
    progress?: CourseProgress
    progressLoading: boolean
    showArchiveAll: boolean
    onAction: (course: CourseRow, action: CourseAction) => void
    onArchiveAll: () => void
}

function StudentCourseCard({
    course,
    tab,
    pendingKey,
    userId,
    progress,
    progressLoading,
    showArchiveAll,
    onAction,
    onArchiveAll,
}: StudentCourseCardProps) {
    const isPending = pendingKey === course.course_key || pendingKey === ARCHIVE_ALL_PENDING_KEY

    return (
        <CourseCardShell>
            <CourseCardIdentity
                iconUrl={course.iconUrl}
                title={course.title}
                href={courseHref(course.course_key)}
                ownerName={course.ownerName}
                isOwner={course.isOwner}
                isTutor={course.isTutor}
                isOfficial={course.isOfficial}
                isPublic={course.isPublic}
                isInvited={tab === 'available' && !course.isPublic}
            />

            {progressLoading && !progress ? (
                <CourseStatsLoading />
            ) : (
                <CourseStats counts={progress?.counts} problemCount={course.problemCount} />
            )}

            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                disabled={isPending}
                                aria-label={`Actions for ${course.title}`}
                            >
                                {isPending ? (
                                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                                ) : (
                                    <EllipsisVerticalIcon className="size-4" aria-hidden />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Course actions</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                    {canSuperviseCourse(course) ? (
                        <SuperviseCourseMenuItem userId={userId} courseKey={course.course_key} />
                    ) : null}
                    {course.isOwner ? (
                        <DropdownMenuItem asChild>
                            <Link href={instructorCoursePropertiesHref(course.course_key)}>
                                <EditIcon aria-hidden />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                    ) : null}
                    {tab === 'available' ? (
                        <DropdownMenuItem onClick={() => onAction(course, 'enroll')}>
                            <GraduationCap aria-hidden />
                            Enroll
                        </DropdownMenuItem>
                    ) : null}
                    {tab === 'enrolled' ? (
                        <>
                            {!course.isOwner ? (
                                <DropdownMenuItem onClick={() => onAction(course, 'unenroll')}>
                                    <LogOutIcon aria-hidden />
                                    Unenroll
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={() => onAction(course, 'archive')}>
                                <ArchiveIcon aria-hidden />
                                Archive
                            </DropdownMenuItem>
                            {showArchiveAll ? (
                                <DropdownMenuItem onClick={onArchiveAll}>
                                    <ArchiveIcon aria-hidden />
                                    Archive all
                                </DropdownMenuItem>
                            ) : null}
                        </>
                    ) : null}
                    {tab === 'archived' ? (
                        <>
                            {!course.isOwner ? (
                                <DropdownMenuItem onClick={() => onAction(course, 'unenroll')}>
                                    <LogOutIcon aria-hidden />
                                    Unenroll
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={() => onAction(course, 'unarchive')}>
                                <ArchiveRestoreIcon aria-hidden />
                                Unarchive
                            </DropdownMenuItem>
                        </>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        </CourseCardShell>
    )
}

const emptyStateByTab: Record<CoursesTab, { title: string; description: string; icon: typeof BookOpenCheckIcon }> = {
    enrolled: {
        title: 'No enrolled courses',
        description: 'Browse available courses and enroll into them.',
        icon: BookOpenCheckIcon,
    },
    available: {
        title: 'No courses available',
        description: 'There are no avaiable courses you can join right now. Check back later.',
        icon: GraduationCap,
    },
    archived: {
        title: 'No archived courses',
        description:
            'Archived courses will appear here. You can archive enrolled courses from the Enrolled tab. Archived courses will not be visible in the Enrolled tab but you still be enrolled in them.',
        icon: ArchiveIcon,
    },
}

export function CoursesList({
    tab,
    courses,
    userId,
    loading = false,
    progress,
    progressLoading = false,
    onCoursesChanged,
}: CoursesListProps) {
    const router = useRouter()
    const [pendingKey, setPendingKey] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [officialFilter, setOfficialFilter] = useState<CoursesOfficialFilter>('all')
    const [instructorFilter, setInstructorFilter] = useState<CoursesInstructorFilter>('all')
    const [sortField, setSortField] = useState<CoursesSortField>('title')
    const [availableAccessTab, setAvailableAccessTab] = useState<AvailableAccessTab>('invited')
    const [, startTransition] = useTransition()
    const [runConfirmDialog, ConfirmDialogComponent] = useConfirmDialog({
        title: 'Are you sure?',
        acceptLabel: 'Confirm',
        cancelLabel: 'Cancel',
    })
    const [runUnenrollDialog, UnenrollDialogComponent] = useConfirmDialog({
        title: 'Unenroll from course',
        acceptLabel: 'Unenroll',
        cancelLabel: 'Cancel',
    })

    const visibleCourses = useMemo(
        () => filterAndSortCourses(courses, searchQuery, officialFilter, sortField, instructorFilter),
        [courses, instructorFilter, officialFilter, searchQuery, sortField],
    )

    const availableByAccess = useMemo(() => {
        if (tab !== 'available') {
            return null
        }
        return {
            all: partitionAvailableCoursesByAccess(courses),
            visible: partitionAvailableCoursesByAccess(visibleCourses),
        }
    }, [courses, tab, visibleCourses])

    const availableAccessTabEffective: AvailableAccessTab =
        availableByAccess && availableByAccess.all.invited.length === 0 ? 'public' : availableAccessTab

    const toolbarVisibleCount =
        availableByAccess && tab === 'available'
            ? availableByAccess.visible[availableAccessTabEffective].length
            : visibleCourses.length
    const toolbarTotalCount =
        availableByAccess && tab === 'available'
            ? availableByAccess.all[availableAccessTabEffective].length
            : courses.length

    const showArchiveAll = tab === 'enrolled' && courses.length >= ARCHIVE_ALL_MIN_COURSES

    async function handleAction(course: CourseRow, action: CourseAction) {
        const title = course.title
        let confirmed = false

        switch (action) {
            case 'enroll':
                confirmed = await runConfirmDialog(`Are you sure you want to enroll in “${title}”?`)
                break
            case 'archive':
                confirmed = await runConfirmDialog(`Are you sure you want to archive “${title}”?`)
                break
            case 'unarchive':
                confirmed = await runConfirmDialog(`Are you sure you want to unarchive “${title}”?`)
                break
            case 'unenroll':
                confirmed = await runUnenrollDialog(UNENROLL_CONFIRMATION)
                break
        }

        if (!confirmed) {
            return
        }

        setPendingKey(course.course_key)
        startTransition(async () => {
            const result = await runServerAction(course.course_key, action)
            setPendingKey(null)

            if (result.ok) {
                toast.success(courseActionSuccessMessage(action, course.title, course.ownerName))
                if (action === 'enroll' || action === 'unenroll') {
                    notifyEnrolledCoursesNavChanged()
                }
                router.refresh()
                onCoursesChanged?.()
                return
            }

            toast.error(result.error)
        })
    }

    async function handleArchiveAll() {
        const count = courses.length
        const confirmed = await runConfirmDialog(
            `Are you sure you want to archive all ${count} enrolled courses? (You can unarchive them later.)`,
        )
        if (!confirmed) {
            return
        }

        setPendingKey(ARCHIVE_ALL_PENDING_KEY)
        startTransition(async () => {
            const result = await archiveAllCoursesAction(courses.map((course) => course.course_key))
            setPendingKey(null)

            if (result.ok) {
                toast.success(`Archived ${count} courses`)
                router.refresh()
                onCoursesChanged?.()
                return
            }

            toast.error(result.error)
            onCoursesChanged?.()
        })
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <CoursesListToolbar
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    officialFilter={officialFilter}
                    onOfficialFilterChange={setOfficialFilter}
                    instructorFilter={instructorFilter}
                    onInstructorFilterChange={setInstructorFilter}
                    sortField={sortField}
                    onSortFieldChange={setSortField}
                    showHelp
                />
                <div
                    aria-busy="true"
                    aria-label="Loading courses"
                    className="flex justify-center border border-dashed border-border bg-muted/20 py-16"
                >
                    <Spinner className="size-8 text-muted-foreground" />
                </div>
            </div>
        )
    }

    if (courses.length === 0) {
        const empty = emptyStateByTab[tab]
        const EmptyIcon = empty.icon

        return (
            <Empty className="border border-dashed border-border bg-muted/20 py-12">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <EmptyIcon aria-hidden />
                    </EmptyMedia>
                    <EmptyTitle>{empty.title}</EmptyTitle>
                    <EmptyDescription>{empty.description}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <CoursesListToolbar
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    officialFilter={officialFilter}
                    onOfficialFilterChange={setOfficialFilter}
                    instructorFilter={instructorFilter}
                    onInstructorFilterChange={setInstructorFilter}
                    sortField={sortField}
                    onSortFieldChange={setSortField}
                    visibleCount={toolbarVisibleCount}
                    totalCount={toolbarTotalCount}
                    showHelp
                />

                <TooltipProvider>
                    {availableByAccess ? (
                        <AvailableCoursesTabs
                            invitedCourses={availableByAccess.visible.invited}
                            publicCourses={availableByAccess.visible.public}
                            invitedTotal={availableByAccess.all.invited.length}
                            publicTotal={availableByAccess.all.public.length}
                            accessTab={availableAccessTab}
                            onAccessTabChange={setAvailableAccessTab}
                            tab={tab}
                            pendingKey={pendingKey}
                            userId={userId}
                            progress={progress}
                            progressLoading={progressLoading}
                            showArchiveAll={showArchiveAll}
                            onAction={handleAction}
                            onArchiveAll={handleArchiveAll}
                        />
                    ) : visibleCourses.length === 0 ? (
                        <Empty className="border border-dashed border-border bg-muted/20 py-12">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <SearchIcon aria-hidden />
                                </EmptyMedia>
                                <EmptyTitle>No matching courses</EmptyTitle>
                                <EmptyDescription>
                                    Try a different search term, adjust filters, or clear the search box.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <CourseCardsList
                            courses={visibleCourses}
                            tab={tab}
                            pendingKey={pendingKey}
                            userId={userId}
                            progress={progress}
                            progressLoading={progressLoading}
                            showArchiveAll={showArchiveAll}
                            onAction={handleAction}
                            onArchiveAll={handleArchiveAll}
                        />
                    )}
                </TooltipProvider>
            </div>
            <ConfirmDialogComponent />
            <UnenrollDialogComponent />
        </>
    )
}

async function runServerAction(courseKey: string, action: CourseAction) {
    switch (action) {
        case 'enroll':
            return enrollCourseAction(courseKey)
        case 'unenroll':
            return unenrollCourseAction(courseKey)
        case 'archive':
            return archiveCourseAction(courseKey)
        case 'unarchive':
            return unarchiveCourseAction(courseKey)
    }
}
