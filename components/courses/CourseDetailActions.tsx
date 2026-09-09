'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
    ArchiveIcon,
    ArchiveRestoreIcon,
    BookOpenCheckIcon,
    ChevronDownIcon,
    EditIcon,
    GraduationCapIcon,
    Loader2Icon,
    LogInIcon,
    LogOutIcon,
    UsersIcon,
    type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
    archiveCourseAction,
    enrollCourseAction,
    unarchiveCourseAction,
    unenrollCourseAction,
} from '@/lib/data/coursesActions'
import { useConfirmDialog } from '@/components/administrator/ConfirmDialog'
import { SuperviseCourseMenuItem } from '@/components/supervision/SuperviseCourseMenuItem'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    canSuperviseCourse,
    courseActionSuccessMessage,
    instructorCoursePropertiesHref,
    type CourseStatus,
    type CourseStudentAction,
} from '@/lib/courses'

export type CourseViewerRole = {
    label: string
    Icon: LucideIcon
}

export function courseShowsActionsMenu(status: CourseStatus, isOwner: boolean): boolean {
    return isOwner || status === 'enrolled' || status === 'archived'
}

export function getCourseViewerRole({
    isOwner,
    isTutor,
    status,
}: {
    isOwner: boolean
    isTutor: boolean
    status: CourseStatus
}): CourseViewerRole | null {
    if (isOwner) {
        return { label: 'Instructor', Icon: GraduationCapIcon }
    }
    if (isTutor) {
        return { label: 'Tutor', Icon: UsersIcon }
    }
    if (status === 'archived') {
        return { label: 'Archived', Icon: ArchiveIcon }
    }
    if (status === 'enrolled') {
        return { label: 'Enrolled', Icon: BookOpenCheckIcon }
    }
    return null
}

const UNENROLL_CONFIRMATION =
    'Please take into account that, after unenrolling from it, your instructor will not be able to see your progress. This could have strong consequences in the event your grade depends on it. You can enroll it again at any time.'

type CourseAction = CourseStudentAction

type CourseDetailActionsProps = {
    courseKey: string
    title: string
    ownerName: string
    status: CourseStatus
    isOwner: boolean
    isTutor: boolean
    userId: string
    /**
     * Reload the course. The page fetches on the client, where router.refresh() has nothing to
     * re-run, so enrolling has to ask it to fetch again for the lists to appear.
     */
    onCourseChanged?: () => void
}

export function CourseDetailActions({
    courseKey,
    title,
    ownerName,
    status,
    isOwner,
    isTutor,
    userId,
    onCourseChanged,
}: CourseDetailActionsProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
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

    async function handleAction(action: CourseAction) {
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

        setIsPending(true)
        startTransition(async () => {
            const result = await runServerAction(courseKey, action)
            setIsPending(false)

            if (result.ok) {
                toast.success(courseActionSuccessMessage(action, title, ownerName))
                router.refresh()
                onCourseChanged?.()
                return
            }

            toast.error(result.error)
        })
    }

    const showEnrollButton = status === 'available'
    const showUnenrollMenuItem = status !== 'available' && !isOwner
    const hasMenuItems = courseShowsActionsMenu(status, isOwner)
    const viewerRole = getCourseViewerRole({ isOwner, isTutor, status })
    const RoleIcon = viewerRole?.Icon

    return (
        <>
            <div className="flex shrink-0 items-center gap-2">
                {showEnrollButton ? (
                    <Button
                        type="button"
                        onClick={() => handleAction('enroll')}
                        disabled={isPending}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                        {isPending ? <Loader2Icon className="animate-spin" aria-hidden /> : <LogInIcon aria-hidden />}
                        Enroll this course
                    </Button>
                ) : null}
                {hasMenuItems ? (
                    <DropdownMenu>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isPending}
                                            aria-label={
                                                viewerRole
                                                    ? `Course actions (${viewerRole.label})`
                                                    : `Actions for ${title}`
                                            }
                                        >
                                            {isPending ? (
                                                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                                            ) : RoleIcon ? (
                                                <RoleIcon aria-hidden />
                                            ) : null}
                                            {viewerRole?.label ?? 'Actions'}
                                            <ChevronDownIcon
                                                className="size-4 shrink-0 text-muted-foreground"
                                                aria-hidden
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="top">Course actions</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent align="end" className="min-w-40">
                            {canSuperviseCourse({ isOwner, isTutor }) ? (
                                <SuperviseCourseMenuItem userId={userId} courseKey={courseKey} />
                            ) : null}
                            {isOwner ? (
                                <DropdownMenuItem asChild>
                                    <Link href={instructorCoursePropertiesHref(courseKey)}>
                                        <EditIcon aria-hidden />
                                        Manage
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                            {status === 'enrolled' ? (
                                <>
                                    {showUnenrollMenuItem ? (
                                        <DropdownMenuItem onClick={() => handleAction('unenroll')}>
                                            <LogOutIcon aria-hidden />
                                            Unenroll
                                        </DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuItem onClick={() => handleAction('archive')}>
                                        <ArchiveIcon aria-hidden />
                                        Archive
                                    </DropdownMenuItem>
                                </>
                            ) : null}
                            {status === 'archived' ? (
                                <>
                                    {showUnenrollMenuItem ? (
                                        <DropdownMenuItem onClick={() => handleAction('unenroll')}>
                                            <LogOutIcon aria-hidden />
                                            Unenroll
                                        </DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuItem onClick={() => handleAction('unarchive')}>
                                        <ArchiveRestoreIcon aria-hidden />
                                        Unarchive
                                    </DropdownMenuItem>
                                </>
                            ) : null}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
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
