'use client'

import { CrownIcon, EyeIcon, GraduationCapIcon, LayoutDashboardIcon, SlidersHorizontalIcon } from 'lucide-react'
import Link from 'next/link'

import { PageSpinner } from '@/components/ClientGates'
import { HomeDashboardCustomizer } from '@/components/general/HomeDashboardCustomizer'
import { HOME_DASHBOARD_MODULE_COMPONENTS } from '@/components/general/HomeDashboardModuleMap'
import { HomeUpcomingExams } from '@/components/general/HomeUpcomingExams'
import { HomeYearsGithubCorner } from '@/components/general/HomeYearsGithubCorner'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { groupDashboardModules, visibleDashboardModules } from '@/lib/dashboardModules'
import { canAccessSupervision, type SessionUser } from '@/lib/session'
import { useDashboardCustomizationStore } from '@/store/dashboardCustomization'
import { useOpenWebDashboardModules, useOpenWebSettingsReady } from '@/store/openWebSettings'

type HomePageUserProps = {
    user: SessionUser | null
}

export function HomePageUser({ user }: HomePageUserProps) {
    const userName = user?.name ?? user?.nickname ?? user?.username ?? user?.email ?? 'Dashboard'
    const editing = useDashboardCustomizationStore((state) => state.editing)
    const startEditing = useDashboardCustomizationStore((state) => state.startEditing)
    const settingsReady = useOpenWebSettingsReady()

    return (
        <div className="flex flex-col gap-6">
            <HomeYearsGithubCorner />
            <MainBreadcrumbs breadcrumbs={[{ title: 'Jutge.org', url: '/' }]} />

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                        <LayoutDashboardIcon className="size-5 shrink-0 text-primary" aria-hidden />
                        <Link
                            href="/profile"
                            className="rounded-md text-xl font-bold tracking-tight text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {userName}
                        </Link>{' '}
                    </h1>
                    <div className="flex items-center gap-2">
                        <RoleButtons user={user} />
                        {!editing ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="size-7"
                                            aria-label="Customize dashboard"
                                            onClick={startEditing}
                                        >
                                            <SlidersHorizontalIcon className="size-3.5" aria-hidden />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Customize dashboard</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : null}
                    </div>
                </div>
            </div>

            {editing ? (
                settingsReady ? (
                    <HomeDashboardCustomizer administrator={Boolean(user?.administrator)} />
                ) : (
                    <PageSpinner />
                )
            ) : (
                <DashboardModulesView administrator={Boolean(user?.administrator)} />
            )}
        </div>
    )
}

/** The dashboard modules in the user's saved order. Consecutive half modules share a row. */
function DashboardModulesView({ administrator }: { administrator: boolean }) {
    const modules = visibleDashboardModules(useOpenWebDashboardModules(), administrator)
    const startEditing = useDashboardCustomizationStore((state) => state.startEditing)

    return (
        <div className="flex flex-col gap-6 pb-12">
            {/* Pinned above the customizable modules; it cannot be moved or removed. */}
            <HomeUpcomingExams />
            {modules.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
                    <p className="text-sm text-muted-foreground">Your dashboard is empty.</p>
                    <Button type="button" variant="outline" onClick={startEditing}>
                        <SlidersHorizontalIcon className="size-4" aria-hidden />
                        Customize dashboard
                    </Button>
                </div>
            ) : null}
            {groupDashboardModules(modules).map((group) => {
                if (group.full) {
                    const ModuleComponent = HOME_DASHBOARD_MODULE_COMPONENTS[group.ids[0]!]
                    return <ModuleComponent key={group.key} />
                }

                return (
                    <div key={group.key} className="grid auto-rows-fr gap-4 sm:grid-cols-2">
                        {group.ids.map((id) => {
                            const ModuleComponent = HOME_DASHBOARD_MODULE_COMPONENTS[id]
                            return <ModuleComponent key={id} />
                        })}
                    </div>
                )
            })}
        </div>
    )
}

/** Shortcuts to the areas this account can reach, if any. */
function RoleButtons({ user }: { user: SessionUser | null }) {
    if (!user) {
        return null
    }

    return (
        <>
            {canAccessSupervision(user) ? (
                <RoleButton href="/supervision" label="Supervision">
                    <EyeIcon className="size-3.5" aria-hidden />
                </RoleButton>
            ) : null}
            {user.instructor ? (
                <RoleButton href="/instructor" label="Instructor">
                    <GraduationCapIcon className="size-3.5" aria-hidden />
                </RoleButton>
            ) : null}
            {user.administrator ? (
                <RoleButton href="/administrator" label="Administrator">
                    <CrownIcon className="size-3.5" aria-hidden />
                </RoleButton>
            ) : null}
        </>
    )
}

function RoleButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
    return (
        <Button asChild variant="outline" size="sm" className="h-7 w-32 gap-1.5 px-2.5 text-xs font-semibold">
            <Link href={href}>
                {children}
                {label}
            </Link>
        </Button>
    )
}
