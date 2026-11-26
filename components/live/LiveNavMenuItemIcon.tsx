'use client'

import {
    ActivityIcon,
    BookText,
    ChartPieIcon,
    EyeIcon,
    FileBracesCornerIcon,
    FileTextIcon,
    House,
    Info,
    ListOrderedIcon,
    PocketKnifeIcon,
    ScrollTextIcon,
    SendIcon,
    SquareTerminalIcon,
    TrophyIcon,
    UsersIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { useSiteMode } from '@/components/SiteModeProvider'
import { cn } from '@/lib/utils'

/** Same icon mapping as the live header menu (`LiveBreadcrumbsInLayout`). */
export function LiveNavMenuItemIcon({
    href,
    className,
}: {
    href: string
    className?: string
}): ReactNode {
    const { kind } = useSiteMode()
    const iconClass = cn(className)

    switch (href) {
        case '/':
            return <House aria-hidden className={iconClass} />
        case '/problems':
            return <FileBracesCornerIcon aria-hidden className={iconClass} />
        case '/submissions':
            return <SendIcon aria-hidden className={iconClass} />
        case '/documents':
            return <FileTextIcon aria-hidden className={iconClass} />
        case '/ranking':
            return kind === 'contest' ? (
                <ListOrderedIcon aria-hidden className={iconClass} />
            ) : (
                <TrophyIcon aria-hidden className={iconClass} />
            )
        case '/students':
        case '/participants':
            return <UsersIcon aria-hidden className={iconClass} />
        case '/statistics':
            return <ChartPieIcon aria-hidden className={iconClass} />
        case '/logins':
            return <ActivityIcon aria-hidden className={iconClass} />
        case '/watch':
            return <EyeIcon aria-hidden className={iconClass} />
        case '/interpreters':
            return <SquareTerminalIcon aria-hidden className={iconClass} />
        case '/utilities':
            return <PocketKnifeIcon aria-hidden className={iconClass} />
        case '/documentation':
            return <BookText aria-hidden className={iconClass} />
        case '/about':
            return <Info aria-hidden className={iconClass} />
        default:
            return <ScrollTextIcon aria-hidden className={iconClass} />
    }
}