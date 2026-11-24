'use client'

import { useState } from 'react'

import { headerToolbarIconButtonClassName } from '@/components/layout/headerToolbarClasses'
import { LiveSignOutDialog, type LiveStudentDialogIntent } from '@/components/live/LiveSignOutDialog'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
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
import { useAuth } from '@/components/AuthProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { dispatchOpenAppearanceSettings } from '@/lib/appearanceSettings'
import { openExamFloatingWidget } from '@/lib/openExamFloatingWidget'
import Link from 'next/link'
import {
    CrownIcon,
    FlagIcon,
    GraduationCapIcon,
    LogOut as SignOut,
    PictureInPicture2Icon,
    Settings2Icon,
    User,
} from 'lucide-react'

export function LiveAuthToolbar() {
    const site = useSiteMode()
    const session = useLiveSession()
    const { user } = useAuth()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogIntent, setDialogIntent] = useState<LiveStudentDialogIntent>('sign-out')
    const noun = site.kind === 'contest' ? 'contest' : 'exam'
    const floatingWidgetLabel = ' Floating widget'
    const isStudent = session.role === 'student'

    if (!session.authenticated) return null

    const userName = session.name ?? user?.name ?? null
    const userNickname = user?.nickname

    function openDialog(intent: LiveStudentDialogIntent) {
        setDialogIntent(intent)
        setDialogOpen(true)
    }

    function handleSignOutClick() {
        if (isStudent) {
            openDialog('sign-out')
            return
        }
        void session.logout()
    }

    return (
        <>
            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <SmoothButton
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    className={headerToolbarIconButtonClassName}
                                    aria-label="User menu"
                                >
                                    {session.administrator ? (
                                        <CrownIcon aria-hidden />
                                    ) : session.instructor ? (
                                        <GraduationCapIcon aria-hidden />
                                    ) : (
                                        <User aria-hidden />
                                    )}
                                </SmoothButton>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{userName ?? user?.email ?? 'User menu'}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <SmoothDropdownMenuContent
                    align="end"
                    className="min-w-48 **:data-[slot=dropdown-menu-item]:py-1.5 **:data-[slot=dropdown-menu-item]:text-base mr-4"
                >
                    <DropdownMenuLabel className="text-base font-bold text-foreground">
                        {userName ?? user?.email ?? 'Account'}
                        {userNickname ? (
                            <span className="font-normal text-muted-foreground"> ({userNickname})</span>
                        ) : null}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/profile">
                            <User aria-hidden />
                            Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            void openExamFloatingWidget()
                        }}
                    >
                        <PictureInPicture2Icon aria-hidden />
                        {floatingWidgetLabel}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={dispatchOpenAppearanceSettings}>
                        <Settings2Icon aria-hidden />
                        Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOutClick}>
                        <SignOut aria-hidden />
                        Sign out
                    </DropdownMenuItem>
                    {isStudent ? (
                        <DropdownMenuItem onClick={() => openDialog('finish')}>
                            <FlagIcon aria-hidden />
                            Finish {noun}
                        </DropdownMenuItem>
                    ) : null}
                </SmoothDropdownMenuContent>
            </DropdownMenu>
            {isStudent ? (
                <LiveSignOutDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    intent={dialogIntent}
                />
            ) : null}
        </>
    )
}