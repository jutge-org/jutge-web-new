'use client'

import { LogOutIcon, Settings2Icon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { AppearanceSettingsDialog } from '@/components/AppearanceSettingsDialog'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
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
import { examHasStarted } from '@/lib/data/liveExam'
import { siteBrand, type SiteKind } from '@/lib/siteMode'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type LiveNavItem = {
    href: string
    label: string
}

function liveNavItems(kind: SiteKind, role: 'student' | 'tutor' | null, started: boolean): LiveNavItem[] {
    if (role === 'tutor') {
        return [
            { href: '/', label: 'Home' },
            { href: '/problems', label: 'Problems' },
            { href: '/students', label: 'Students' },
            { href: '/submissions', label: 'Submissions' },
            { href: '/ranking', label: 'Ranking' },
            { href: '/statistics', label: 'Statistics' },
            { href: '/logins', label: 'Logins' },
            { href: '/documentation', label: 'Documentation' },
            { href: '/about', label: 'About' },
        ]
    }
    if (role === 'student') {
        const items: LiveNavItem[] = [
            { href: '/', label: 'Home' },
            { href: '/problems', label: 'Problems' },
            { href: '/submissions', label: 'Submissions' },
        ]
        if (kind === 'contest' && started) items.push({ href: '/ranking', label: 'Ranking' })
        items.push(
            { href: '/finish', label: 'Finish' },
            { href: '/documentation', label: 'Documentation' },
            { href: '/about', label: 'About' },
        )
        return items
    }
    const items: LiveNavItem[] = [
        { href: '/', label: 'Home' },
        { href: '/documentation', label: 'Documentation' },
        { href: '/about', label: 'About' },
    ]
    if (kind === 'contest') items.push({ href: '/watch', label: 'Watch' })
    return items
}

function navIsCurrent(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
}

export function LiveAppShell({ children }: { children: ReactNode }) {
    const site = useSiteMode()
    const pathname = usePathname() ?? '/'
    const session = useLiveSession()
    const brand = siteBrand(site.kind)
    const items = liveNavItems(site.kind, session.role, examHasStarted(session.exam))
    const allowed = isLivePath(pathname, site.kind)

    return (
        <>
            <RootShell
                header={
                    <header className="sticky top-0 z-50 border-b border-border bg-background">
                        <LayoutWidthContainer className="flex h-11 items-center justify-between gap-4 px-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-4">
                                <Link href="/" className="shrink-0 text-sm font-semibold">
                                    {brand}
                                </Link>
                                <nav aria-label="Exam" className="min-w-0 overflow-x-auto">
                                    <ul className="flex items-center gap-1">
                                        {items.map((item) => {
                                            const current = navIsCurrent(pathname, item.href)
                                            return (
                                                <li key={item.href}>
                                                    <Link
                                                        href={item.href}
                                                        aria-current={current ? 'page' : undefined}
                                                        className={cn(
                                                            'inline-flex h-8 items-center rounded-md px-2 text-sm whitespace-nowrap',
                                                            current
                                                                ? 'bg-muted text-foreground'
                                                                : 'text-muted-foreground hover:text-foreground',
                                                        )}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </nav>
                            </div>
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
                                                    onClick={() => void session.logout()}
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
        </>
    )
}
