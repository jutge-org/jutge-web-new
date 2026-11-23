'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
    SmoothDropdownMenuContent,
    SmoothDropdownMenuSubContent,
} from '@/components/smoothui/dropdown-menu/animated-content'
import { headerToolbarMenuIconButtonClassName } from '@/components/layout/headerToolbarClasses'
import SmoothButton from '@/components/smoothui/smooth-button'
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ExternalLink } from '@/components/ExternalLink'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { aboutNavItems } from '@/lib/about'
import { documentationNavItems } from '@/lib/documentation'
import {
    liveFallbackBreadcrumbs,
    liveNavItemsForSession,
    liveSiteBrand,
    navIsCurrent,
    type LiveNavItem,
} from '@/lib/liveNav'
import { interpretersNavItems } from '@/lib/interpreters'
import { utilitiesNavItems } from '@/lib/utilities'
import { pathsHrefEqual } from '@/lib/siteNavLinks'
import { useMainBreadcrumbs } from '@/store/MainBreadcrumbs'
import { cn } from '@/lib/utils'
import {
    AccessibilityIcon,
    ActivityIcon,
    BookMarkedIcon,
    BookText,
    CameraIcon,
    ChartPieIcon,
    ClockIcon,
    Code2Icon,
    EyeIcon,
    FileBracesCornerIcon,
    FileCodeIcon,
    FileTextIcon,
    FolderGit2Icon,
    GavelIcon,
    HelpCircleIcon,
    House,
    Info,
    LanguagesIcon,
    LineSquiggleIcon,
    MegaphoneIcon,
    MenuIcon,
    MonitorOffIcon,
    PocketKnifeIcon,
    ScrollTextIcon,
    SendIcon,
    ServerCogIcon,
    ShieldIcon,
    ShoppingBagIcon,
    SquareTerminalIcon,
    SquareTextIcon,
    TerminalIcon,
    TrophyIcon,
    TurtleIcon,
    UsersIcon,
    WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect, useMemo, useRef, type ComponentType } from 'react'

type LiveNavSubmenuItem = {
    href: string
    label: string
    external?: boolean
}

const interpretersSubmenuItems: readonly LiveNavSubmenuItem[] = interpretersNavItems
    .filter((item) => item.tab !== 'index')
    .map(({ href, label }) => ({ href, label }))

const utilitiesSubmenuItems: readonly LiveNavSubmenuItem[] = utilitiesNavItems
    .filter((item) => item.tab !== 'index')
    .map(({ href, label }) => ({ href, label }))

const documentationSubmenuItems: readonly LiveNavSubmenuItem[] = documentationNavItems
    .filter((item) => item.tab !== 'index')
    .map(({ href, label, external }) => ({ href, label, external }))

const aboutSubmenuItems: readonly LiveNavSubmenuItem[] = aboutNavItems
    .filter((item) => item.tab !== 'index')
    .map(({ href, label, external }) => ({ href, label, external }))

function navSubItemIsCurrent(pathname: string, href: string, indexHref: string): boolean {
    if (href === indexHref) return pathname === indexHref
    return pathname === href || pathname.startsWith(`${href}/`)
}

function LiveNavInterpretersSubItemIcon({ href }: { href: string }) {
    switch (href) {
        case '/interpreters/pyodide':
            return <TerminalIcon aria-hidden />
        case '/interpreters/pyweb':
            return <TurtleIcon aria-hidden />
        case '/interpreters/jscpp':
            return <FileCodeIcon aria-hidden />
        default:
            return null
    }
}

function LiveNavUtilitiesSubItemIcon({ href }: { href: string }) {
    switch (href) {
        case '/utilities/translator':
            return <LanguagesIcon aria-hidden />
        case '/utilities/editor':
            return <SquareTextIcon aria-hidden />
        case '/utilities/whiteboard':
            return <LineSquiggleIcon aria-hidden />
        case '/utilities/blackscreen':
            return <MonitorOffIcon aria-hidden />
        case '/utilities/clock':
            return <ClockIcon aria-hidden />
        default:
            return null
    }
}

function LiveNavDocumentationSubItemIcon({ href }: { href: string }) {
    switch (href) {
        case '/documentation/faq':
            return <HelpCircleIcon aria-hidden />
        case '/documentation/compilers':
            return <Code2Icon aria-hidden />
        case '/documentation/verdicts':
            return <GavelIcon aria-hidden />
        case 'https://github.com/jutge-org/jutge-toolkit':
            return <WrenchIcon aria-hidden />
        case 'https://api.jutge.org':
            return <ServerCogIcon aria-hidden />
        case '/documentation/references':
            return <BookMarkedIcon aria-hidden />
        case 'https://github.com/jutge-org/':
            return <FolderGit2Icon aria-hidden />
        default:
            return null
    }
}

function LiveNavAboutSubItemIcon({ href }: { href: string }) {
    switch (href) {
        case 'https://t.me/jutge':
            return <SendIcon aria-hidden />
        case '/about/terms-of-service':
            return <MegaphoneIcon aria-hidden />
        case '/about/honor-code':
            return <ShieldIcon aria-hidden />
        case '/about/accessibility':
            return <AccessibilityIcon aria-hidden />
        case '/about/gallery':
            return <CameraIcon aria-hidden />
        case '/about/publications':
            return <FileTextIcon aria-hidden />
        case '/about/merchandising':
            return <ShoppingBagIcon aria-hidden />
        case '/about/credits':
            return <UsersIcon aria-hidden />
        default:
            return null
    }
}

function LiveNavSubmenu({
    href,
    label,
    indexHref,
    items,
    pathname,
    isCurrentSection,
    subItemIcon: SubItemIcon,
}: {
    href: string
    label: string
    indexHref: string
    items: readonly LiveNavSubmenuItem[]
    pathname: string
    isCurrentSection: boolean
    subItemIcon: ComponentType<{ href: string }>
}) {
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger className={cn(isCurrentSection && 'font-semibold text-foreground')}>
                <LiveNavMenuItemIcon href={href} />
                {label}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <SmoothDropdownMenuSubContent className="min-w-52 shadow-lg **:data-[slot=dropdown-menu-item]:py-1.5 **:data-[slot=dropdown-menu-item]:text-base">
                    <DropdownMenuItem asChild>
                        <Link
                            href={indexHref}
                            className={cn(
                                navSubItemIsCurrent(pathname, indexHref, indexHref) && 'text-foreground',
                            )}
                        >
                            <LiveNavMenuItemIcon href={href} />
                            Index
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {items.map((item) =>
                        item.external ? (
                            <DropdownMenuItem asChild key={item.href}>
                                <ExternalLink href={item.href} icon={false}>
                                    <SubItemIcon href={item.href} />
                                    {item.label}
                                </ExternalLink>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem asChild key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        navSubItemIsCurrent(pathname, item.href, indexHref) &&
                                            'font-semibold text-foreground',
                                    )}
                                >
                                    <SubItemIcon href={item.href} />
                                    {item.label}
                                </Link>
                            </DropdownMenuItem>
                        ),
                    )}
                </SmoothDropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    )
}

function LiveNavMenuItemIcon({ href }: { href: string }) {
    switch (href) {
        case '/':
            return <House aria-hidden />
        case '/problems':
            return <FileBracesCornerIcon aria-hidden />
        case '/submissions':
            return <SendIcon aria-hidden />
        case '/ranking':
            return <TrophyIcon aria-hidden />
        case '/students':
            return <UsersIcon aria-hidden />
        case '/statistics':
            return <ChartPieIcon aria-hidden />
        case '/logins':
            return <ActivityIcon aria-hidden />
        case '/watch':
            return <EyeIcon aria-hidden />
        case '/interpreters':
            return <SquareTerminalIcon aria-hidden />
        case '/utilities':
            return <PocketKnifeIcon aria-hidden />
        case '/documentation':
            return <BookText aria-hidden />
        case '/about':
            return <Info aria-hidden />
        default:
            return <ScrollTextIcon aria-hidden />
    }
}

function menuSeparatorBefore(href: string): boolean {
    return href === '/interpreters' || href === '/documentation'
}

export function LiveBreadcrumbsInLayout() {
    const site = useSiteMode()
    const session = useLiveSession()
    const pathname = usePathname() ?? '/'
    const brand = liveSiteBrand(site.kind)
    const menuItems = useMemo(
        () => liveNavItemsForSession(site.kind, session.role, session.exam),
        [site.kind, session.role, session.exam],
    )
    const storedBreadcrumbs = useMainBreadcrumbs((s) => s.breadcrumbs)
    const breadcrumbs = useMemo(() => {
        if (storedBreadcrumbs.length > 0) return storedBreadcrumbs
        return liveFallbackBreadcrumbs(pathname, brand, menuItems)
    }, [storedBreadcrumbs, pathname, brand, menuItems])

    const menuAnchor = breadcrumbs[0]
    const trail = breadcrumbs.length > 0 ? breadcrumbs.slice(1) : []
    const scrollRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.scrollLeft = el.scrollWidth - el.clientWidth
    }, [breadcrumbs])

    function linkIsCurrent(item: LiveNavItem): boolean {
        if (menuAnchor) return pathsHrefEqual(menuAnchor.url, item.href)
        return navIsCurrent(pathname, item.href)
    }

    return (
        <div className="flex min-w-0 flex-1 items-center font-bold tracking-tight">
            <div className="flex shrink-0 items-center gap-1">
                <DropdownMenu>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <SmoothButton
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        className={headerToolbarMenuIconButtonClassName}
                                        aria-haspopup="menu"
                                        aria-label={
                                            menuAnchor
                                                ? `Open main menu (current section: ${menuAnchor.title})`
                                                : 'Open main menu'
                                        }
                                    >
                                        <MenuIcon className="shrink-0" aria-hidden />
                                    </SmoothButton>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Main menu</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <SmoothDropdownMenuContent
                        align="start"
                        className="min-w-52 -translate-y-2 translate-x-4 overflow-visible shadow-lg **:data-[slot=dropdown-menu-item]:py-1.5 **:data-[slot=dropdown-menu-item]:text-base **:data-[slot=dropdown-menu-sub-trigger]:py-1.5 **:data-[slot=dropdown-menu-sub-trigger]:text-base"
                    >
                        {menuItems.map((item) => (
                            <Fragment key={item.href}>
                                {menuSeparatorBefore(item.href) ? <DropdownMenuSeparator /> : null}
                                {item.href === '/interpreters' ? (
                                    <LiveNavSubmenu
                                        href={item.href}
                                        label={item.label}
                                        indexHref="/interpreters"
                                        items={interpretersSubmenuItems}
                                        pathname={pathname}
                                        isCurrentSection={linkIsCurrent(item)}
                                        subItemIcon={LiveNavInterpretersSubItemIcon}
                                    />
                                ) : item.href === '/utilities' ? (
                                    <LiveNavSubmenu
                                        href={item.href}
                                        label={item.label}
                                        indexHref="/utilities"
                                        items={utilitiesSubmenuItems}
                                        pathname={pathname}
                                        isCurrentSection={linkIsCurrent(item)}
                                        subItemIcon={LiveNavUtilitiesSubItemIcon}
                                    />
                                ) : item.href === '/documentation' ? (
                                    <LiveNavSubmenu
                                        href={item.href}
                                        label={item.label}
                                        indexHref="/documentation"
                                        items={documentationSubmenuItems}
                                        pathname={pathname}
                                        isCurrentSection={linkIsCurrent(item)}
                                        subItemIcon={LiveNavDocumentationSubItemIcon}
                                    />
                                ) : item.href === '/about' ? (
                                    <LiveNavSubmenu
                                        href={item.href}
                                        label={item.label}
                                        indexHref="/about"
                                        items={aboutSubmenuItems}
                                        pathname={pathname}
                                        isCurrentSection={linkIsCurrent(item)}
                                        subItemIcon={LiveNavAboutSubItemIcon}
                                    />
                                ) : (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                linkIsCurrent(item) && 'font-semibold text-foreground',
                                            )}
                                        >
                                            <LiveNavMenuItemIcon href={item.href} />
                                            {item.label}
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                            </Fragment>
                        ))}
                    </SmoothDropdownMenuContent>
                </DropdownMenu>
            </div>
            <Breadcrumb
                ref={scrollRef}
                className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]"
            >
                <BreadcrumbList className="flex-nowrap gap-2 text-base text-foreground sm:gap-2">
                    <BreadcrumbItem className="shrink-0">
                        <div className="flex items-center gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <BreadcrumbLink asChild>
                                            <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src="/logos/jutge.svg"
                                                    alt={brand}
                                                    className="ml-3 h-6 w-auto dark:invert"
                                                />
                                            </Link>
                                        </BreadcrumbLink>
                                    </TooltipTrigger>
                                    <TooltipContent>Home</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            {menuAnchor && menuAnchor.url !== '/' ? (
                                <BreadcrumbLink asChild className="ml-3">
                                    <Link
                                        href={menuAnchor.url}
                                        className="shrink-0 font-semibold text-foreground transition-colors hover:text-primary hover:underline hover:underline-offset-4"
                                    >
                                        {menuAnchor.title}
                                    </Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage className="ml-3 shrink-0 font-bold">{brand}</BreadcrumbPage>
                            )}
                        </div>
                    </BreadcrumbItem>

                    {trail.map((segment, index) => {
                        const isLast = index === trail.length - 1

                        return (
                            <Fragment key={`${segment.url}::${index}`}>
                                <BreadcrumbSeparator className="shrink-0" />
                                <BreadcrumbItem className="min-w-0 max-w-48 shrink-0 sm:max-w-md">
                                    {isLast ? (
                                        <BreadcrumbPage className="truncate font-semibold">
                                            {segment.title}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link
                                                href={segment.url}
                                                className="truncate font-semibold text-foreground hover:text-primary hover:underline hover:underline-offset-4"
                                            >
                                                {segment.title}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </Fragment>
                        )
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    )
}