'use client'

import { LogOutIcon, Settings2Icon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LiveBreadcrumbsInLayout } from '@/app/LiveBreadcrumbsInLayout'
import { AppearanceSettingsDialog } from '@/components/AppearanceSettingsDialog'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { LiveSignOutDialog } from '@/components/live/LiveSignOutDialog'
import { LiveUnavailable } from '@/components/live/LiveChrome'
import { headerToolbarIconButtonClassName } from '@/components/layout/headerToolbarClasses'
import { LayoutWidthContainer } from '@/components/layout/LayoutWidthContainer'
import { SubNavInLayout } from '@/components/layout/SubNavInLayout'
import { AppFooter } from '@/components/layout/AppFooter'
import { RootShell } from '@/components/RootShell'
import SmoothButton from '@/components/smoothui/smooth-button'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { dispatchOpenAppearanceSettings } from '@/lib/appearanceSettings'
import { isLivePath } from '@/lib/livePaths'
import type { ReactNode } from 'react'

export function LiveAppShell({ children }: { children: ReactNode }) {
    const site = useSiteMode()
    const pathname = usePathname() ?? '/'
    const session = useLiveSession()
    const [signOutOpen, setSignOutOpen] = useState(false)
    const showStudentSignOutDialog = session.authenticated && session.role === 'student'

    useEffect(() => {
        if (!showStudentSignOutDialog) {
            setSignOutOpen(false)
        }
    }, [showStudentSignOutDialog])

    const allowed = isLivePath(pathname, site.kind)

    return (
        <>
            <RootShell
                header={
                    <header className="sticky top-0 z-50 border-b border-border bg-background">
                        <LayoutWidthContainer className="flex h-11 items-center justify-between gap-4 px-4 sm:px-6">
                            <LiveBreadcrumbsInLayout />
                            <div className="flex shrink-0 items-center gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SmoothButton
                                                type="button"
                                                variant="outline"
                                                size="icon-sm"
                                                className={headerToolbarIconButtonClassName}
                                                aria-label="Settings"
                                                onClick={dispatchOpenAppearanceSettings}
                                            >
                                                <Settings2Icon aria-hidden />
                                            </SmoothButton>
                                        </TooltipTrigger>
                                        <TooltipContent>Settings</TooltipContent>
                                    </Tooltip>
                                    {session.authenticated ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SmoothButton
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    className={headerToolbarIconButtonClassName}
                                                    aria-label="Sign out"
                                                    aria-haspopup={session.role === 'student' ? 'dialog' : undefined}
                                                    onClick={() => {
                                                        if (session.role === 'student') {
                                                            setSignOutOpen(true)
                                                            return
                                                        }
                                                        void session.logout()
                                                    }}
                                                >
                                                    <LogOutIcon aria-hidden />
                                                </SmoothButton>
                                            </TooltipTrigger>
                                            <TooltipContent>Sign out</TooltipContent>
                                        </Tooltip>
                                    ) : null}
                                </TooltipProvider>
                            </div>
                        </LayoutWidthContainer>
                        <SubNavInLayout />
                    </header>
                }
                footer={<AppFooter />}
            >
                {allowed ? (
                    children
                ) : (
                    <LiveUnavailable message="This page is not available during an exam or contest." />
                )}
            </RootShell>
            <AppearanceSettingsDialog />
            {showStudentSignOutDialog ? (
                <LiveSignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
            ) : null}
        </>
    )
}
