'use client'

import { Settings2Icon } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { LiveBreadcrumbsInLayout } from '@/app/LiveBreadcrumbsInLayout'
import { AppearanceSettingsDialog } from '@/components/AppearanceSettingsDialog'
import { LiveAuthToolbar } from '@/components/live/LiveAuthToolbar'
import { LiveExamWidgetToolbarButton } from '@/components/live/LiveExamWidgetToolbarButton'
import { ExamFloatingWidgetNavHost } from '@/components/live/ExamFloatingWidgetNavHost'
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

    const allowed = isLivePath(pathname, site.kind)

    return (
        <>
            <ExamFloatingWidgetNavHost />
            <RootShell
                header={
                    <header className="sticky top-0 z-50 border-b border-border bg-background">
                        <LayoutWidthContainer className="flex h-11 items-center justify-between gap-4 px-4 sm:px-6">
                            <LiveBreadcrumbsInLayout />
                            <div className="flex shrink-0 items-center gap-1">
                                <LiveExamWidgetToolbarButton />
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
                                </TooltipProvider>
                                <LiveAuthToolbar />
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
        </>
    )
}