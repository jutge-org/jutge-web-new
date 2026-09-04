'use client'

import { HandIcon, XIcon } from 'lucide-react'
import Image from 'next/image'

import { ExternalLink } from '@/components/ExternalLink'
import { HomeWidgetCard } from '@/components/general/HomeWidgetCard'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { GITHUB_REPO_URL } from '@/lib/github'
import { useOpenWebSettingsStore } from '@/store/openWebSettings'
import { GithubIcon } from '../GithubIcon'

export function HomeWelcome() {
    const modules = useOpenWebSettingsStore((state) => state.settings.dashboard.modules)
    const setDashboardModules = useOpenWebSettingsStore((state) => state.setDashboardModules)

    function handleDismiss() {
        setDashboardModules(modules.filter((id) => id !== 'welcome'))
    }

    return (
        <HomeWidgetCard
            title="Welcome!"
            accentClassName="border-t-sky-500"
            icon={<HandIcon className="size-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />}
            action={
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 text-muted-foreground"
                                aria-label="Dismiss welcome message"
                                onClick={handleDismiss}
                            >
                                <XIcon className="size-4" aria-hidden />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Dismiss</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            }
        >
            <div className="flex h-full items-center gap-4 px-4 py-2">
                <Image
                    src="/jutge/modern.webp"
                    alt=""
                    width={100}
                    height={100}
                    className="size-25 shrink-0 rounded-lg"
                    aria-hidden
                />
                <div className="max-w-sm flex flex-col gap-2">
                <p className="min-w-0 text-sm leading-relaxed text-muted-foreground">
                    This site is under construction and, in the future, will be the definitive website of Jutge.org.
                    Please use{' '}
                    <ExternalLink
                        href={GITHUB_REPO_URL}
                        className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                        https://jutge.org
                    </ExternalLink>{' '}
                    if you find any problem.
                    Please report issues and contribute enhancements through the{' '}
                    <ExternalLink
                        href={GITHUB_REPO_URL}
                        className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                        GitHub repository
                    </ExternalLink>
                    .
                </p>
                </div>
            </div>
        </HomeWidgetCard>
    )
}
