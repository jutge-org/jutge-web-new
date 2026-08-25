'use client'

import { HomeYearsRibbon } from '@/components/general/HomeYearsRibbon'
import { AccountsBlock } from '@/components/home/AccountsBlock'
import { CardsBlock } from '@/components/home/CardsBlock'
import { CoursesAndProblemsBlock } from '@/components/home/CoursesAndProblemsBlock'
import { DocumentationBlock } from '@/components/home/DocumentationBlock'
import { FeatureBlock } from '@/components/home/FeatureBlock'
import { GithubBlock } from '@/components/home/GithubBlock'
import { MerchandisingBlock } from '@/components/home/MerchandisingBlock'
import { HeroBlock } from '@/components/home/HeroBlock'
import { HomeSectionNav, type HomeSectionNavItem } from '@/components/home/HomeSectionNav'
import { LogoCloudBlock } from '@/components/home/LogoCloudBlock'
import { RelatedSitesBlock } from '@/components/home/RelatedSitesBlock'
import { SignInBlock, type AccountTabId } from '@/components/home/SignInBlock'
import { StatsBlock } from '@/components/home/StatsBlock'
import { TelegramBlock } from '@/components/home/TelegramBlock'
import { TestimonialBlock } from '@/components/home/TestimonialBlock'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { countActiveProglangs, getActiveCompilers } from '@/lib/documentation'
import { fetchHomepageStats } from '@/lib/data/misc'
import { fetchCompilers } from '@/lib/data/tables'
import type { HomepageStats } from '@/lib/jutge_api_client'
import { ArrowUpIcon, BookMarkedIcon, LogInIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const HEADER_OFFSET_PX = 56

const GUEST_SECTIONS: HomeSectionNavItem[] = [
    { id: 'home-hero', label: 'Jutge.org' },
    { id: 'home-account', label: 'Sign in' },
    { id: 'home-features', label: 'Learn and teach' },
    { id: 'home-courses-problems', label: 'Courses and problems' },
    { id: 'home-stats', label: 'Platform at a glance' },
    { id: 'home-accounts', label: 'Accounts' },
    { id: 'home-related-sites', label: 'Related sites' },
    { id: 'home-telegram', label: 'Stay informed' },
    { id: 'home-documentation', label: 'Documentation' },
    { id: 'home-github', label: 'Open source' },
    { id: 'home-collectible-cards', label: 'Collectible cards' },
    { id: 'home-merchandising', label: 'Merchandising' },
    { id: 'home-testimonials', label: 'What people say' },
    { id: 'home-sponsors', label: 'Sponsors' },
]

type PlatformStats = HomepageStats & {
    languages: number
    compilers: number
}

type BottomActionsProps = {
    onOpenAccountTab: (tab: AccountTabId) => void
}

function scrollToAccountSection() {
    const el = document.getElementById('home-account')
    if (!el) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
    }
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX
    window.scrollTo({ top, behavior: 'smooth' })
}

function BottomActions({ onOpenAccountTab }: BottomActionsProps) {
    return (
        <div className="flex justify-end px-6 pb-8">
            <TooltipProvider>
                <ButtonGroup>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Sign up"
                                onClick={() => onOpenAccountTab('signup')}
                            >
                                <BookMarkedIcon aria-hidden />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Sign up</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Sign in"
                                onClick={() => onOpenAccountTab('signin')}
                            >
                                <LogInIcon aria-hidden />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Sign in</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Back to top"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            >
                                <ArrowUpIcon aria-hidden />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Back to top</TooltipContent>
                    </Tooltip>
                </ButtonGroup>
            </TooltipProvider>
        </div>
    )
}

export function HomePageGuest() {
    const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
    const [accountTab, setAccountTab] = useState<AccountTabId>('signin')
    const [focusEmailKey, setFocusEmailKey] = useState(0)

    function openAccountTab(tab: AccountTabId) {
        setAccountTab(tab)
        setFocusEmailKey((key) => key + 1)
        scrollToAccountSection()
    }

    useEffect(() => {
        let cancelled = false

        async function loadStats() {
            const [homepageStats, compilers] = await Promise.all([fetchHomepageStats(), fetchCompilers()])
            if (cancelled || !homepageStats) {
                return
            }
            const activeCompilers = getActiveCompilers(compilers)
            setPlatformStats({
                ...homepageStats,
                languages: countActiveProglangs(compilers),
                compilers: activeCompilers.length,
            })
        }

        void loadStats()
        return () => {
            cancelled = true
        }
    }, [])

    const sections = platformStats ? GUEST_SECTIONS : GUEST_SECTIONS.filter((section) => section.id !== 'home-stats')

    return (
        <div
            className={
                '[--foreground:#000000] [--muted-foreground:#000000] [--card-foreground:#000000] [--popover-foreground:#000000] [--secondary-foreground:#000000] [--accent-foreground:#000000] ' +
                '[--color-brand:oklch(0.48_0.16_232)] [--color-brand-secondary:oklch(0.40_0.18_250)] [--color-brand-title:oklch(0.40_0.15_232)] ' +
                'dark:[--foreground:inherit] dark:[--muted-foreground:inherit] dark:[--card-foreground:inherit] dark:[--popover-foreground:inherit] dark:[--secondary-foreground:inherit] dark:[--accent-foreground:inherit] ' +
                'dark:[--color-brand:inherit] dark:[--color-brand-secondary:inherit] dark:[--color-brand-title:inherit]'
            }
        >
            <HomeYearsRibbon />
            <HomeSectionNav sections={sections} />
            <div className="mt-6 flex flex-col gap-16 md:gap-24">
                <HeroBlock />
                <SignInBlock
                    activeTab={accountTab}
                    onActiveTabChange={setAccountTab}
                    focusEmailKey={focusEmailKey}
                />
                <FeatureBlock />
                <CoursesAndProblemsBlock />
                {platformStats ? <StatsBlock stats={platformStats} /> : null}
                <AccountsBlock />
                <RelatedSitesBlock />
                <TelegramBlock />
                <CardsBlock />
                <DocumentationBlock />
                <GithubBlock />
                <TestimonialBlock />
                <MerchandisingBlock />
                <LogoCloudBlock />
                <BottomActions onOpenAccountTab={openAccountTab} />
            </div>
        </div>
    )
}
