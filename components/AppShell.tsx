'use client'

import { AuthToolbar } from '@/components/AuthToolbar'
import { CommandPalette } from '@/components/CommandPalette'
import { AppearanceSettingsDialog } from '@/components/AppearanceSettingsDialog'
import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { RecentMenu } from '@/components/RecentMenu'
import { RecentsProvider } from '@/components/RecentsProvider'
import { AppFooter } from '@/components/layout/AppFooter'
import { LayoutWidthContainer } from '@/components/layout/LayoutWidthContainer'
import { RootShell } from '@/components/RootShell'
import { MainBreadcrumbsInLayout } from '@/app/MainBreadcrumbsInLayout'
import { useAuth } from '@/components/AuthProvider'
import { SubNavInLayout } from '@/components/layout/SubNavInLayout'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { dispatchOpenAppearanceSettings } from '@/lib/appearanceSettings'
import { isContextualHeaderGradientsEnabled } from '@/lib/contextualHeaderGradients'
import { cn } from '@/lib/utils'
import { useDashboardCustomizationStore } from '@/store/dashboardCustomization'
import { Settings2Icon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

function headerBarClassName(pathname: string, gradientsEnabled: boolean): string {
    const base = 'sticky top-0 z-50 border-b border-border'

    if (gradientsEnabled && pathname.startsWith('/administrator')) {
        return cn(base, 'bg-gradient-to-r from-orange-300 to-yellow-100', 'dark:from-orange-950 dark:to-yellow-950/60')
    }
    if (gradientsEnabled && pathname.startsWith('/instructor')) {
        return cn(
            base,
            'bg-gradient-to-r from-purple-300 to-fuchsia-100',
            'dark:from-purple-950 dark:to-fuchsia-950/60',
        )
    }
    if (gradientsEnabled && pathname.startsWith('/supervision')) {
        return cn(base, 'bg-gradient-to-r from-emerald-300 to-green-100', 'dark:from-emerald-950 dark:to-green-950/60')
    }

    return cn(base, 'bg-background')
}

function AppShellInner({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const authenticated = user !== null
    const pathname = usePathname() ?? ''
    const { contextualHeaderGradients } = useAppearancePreferences()
    const gradientsEnabled = isContextualHeaderGradientsEnabled(contextualHeaderGradients)
    const stopDashboardEditing = useDashboardCustomizationStore((state) => state.stopEditing)

    // Dashboard customize mode only makes sense on the home page; leaving it discards the draft.
    useEffect(() => {
        if (pathname !== '/') {
            stopDashboardEditing()
        }
    }, [pathname, stopDashboardEditing])

    return (
        <RecentsProvider>
            <RootShell
                header={
                    <header className={headerBarClassName(pathname, gradientsEnabled)}>
                        <LayoutWidthContainer className="flex h-11 items-center justify-between gap-4 px-4 sm:px-6">
                            <MainBreadcrumbsInLayout />
                            <div className="flex shrink-0 items-center gap-1">
                                <CommandPalette />
                                {authenticated ? <RecentMenu /> : null}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SmoothButton
                                                type="button"
                                                variant="outline"
                                                size="icon-sm"
                                                className="size-8 [&_svg]:size-4.5"
                                                aria-label="Settings"
                                                onClick={dispatchOpenAppearanceSettings}
                                            >
                                                <Settings2Icon aria-hidden />
                                            </SmoothButton>
                                        </TooltipTrigger>
                                        <TooltipContent>Settings</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <AuthToolbar />
                            </div>
                        </LayoutWidthContainer>
                        <SubNavInLayout />
                    </header>
                }
                footer={<AppFooter />}
            >
                {children}
            </RootShell>
            {/* Headless: opened from the Settings button, Account menu, and command palette */}
            <AppearanceSettingsDialog />
        </RecentsProvider>
    )
}

export function AppShell({ children }: { children: React.ReactNode }) {
    return <AppShellInner>{children}</AppShellInner>
}
