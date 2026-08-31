'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/components/AuthProvider'
import { fetchEnrolledCoursesNavItems } from '@/lib/data/courses'
import jutge from '@/lib/jutge'
import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { ExternalLink } from '@/components/ExternalLink'
import { aboutNavItems } from '@/lib/about'
import { administratorIndexItems } from '@/lib/administrator'
import { documentationNavItems } from '@/lib/documentation'
import { instructorIndexItems } from '@/lib/instructor'
import type { CoursesNavItem } from '@/lib/courses'
import { getSiteNavLinks, homeLink, pathsHrefEqual, type SiteNavLink } from '@/lib/siteNavLinks'
import { cn } from '@/lib/utils'
import { useMainBreadcrumbs } from '@/store/MainBreadcrumbs'
import {
    AccessibilityIcon,
    Award,
    AudioLinesIcon,
    BookMarkedIcon,
    BookOpen,
    BookOpenCheckIcon,
    BookText,
    ActivityIcon,
    BotIcon,
    BoxesIcon,
    CalendarIcon,
    CameraIcon,
    ChartPieIcon,
    Code2Icon,
    FileCode2Icon,
    FileIcon,
    FilePenIcon,
    FileTextIcon,
    GavelIcon,
    HelpCircleIcon,
    LayoutDashboardIcon,
    ListIcon,
    MegaphoneIcon,
    ScrollTextIcon,
    SendIcon,
    FileBracesCornerIcon,
    CrownIcon,
    EyeIcon,
    GraduationCap,
    House,
    SchoolIcon,
    Info,
    LayersIcon,
    MenuIcon,
    SearchIcon,
    ShieldIcon,
    ShoppingBagIcon,
    StampIcon,
    StethoscopeIcon,
    TableIcon,
    TrophyIcon,
    UserRoundPenIcon,
    UsersIcon,
    User,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect, useRef, useState, type ComponentType } from 'react'

type MainNavSubmenuItem = {
    href: string
    label: string
    external?: boolean
    iconUrl?: string
}

function orderMainNavMenuLinks(links: readonly SiteNavLink[]): SiteNavLink[] {
    const withoutProfile = links.filter((l) => l.href !== '/profile')
    const documentation = withoutProfile.find((l) => l.href === '/documentation')
    const about = withoutProfile.find((l) => l.href === '/about')
    const withoutMeta = withoutProfile.filter((l) => l.href !== '/about' && l.href !== '/documentation')
    const metaLinks = [documentation, about].filter((l): l is SiteNavLink => l != null)
    return [homeLink, ...withoutMeta, ...metaLinks]
}

function MainNavMenuItemIcon({ href }: { href: string }) {
    switch (href) {
        case '/':
            return <House aria-hidden />
        case '/problems':
            return <FileBracesCornerIcon aria-hidden />
        case '/submissions':
            return <SendIcon aria-hidden />
        case '/exams':
            return <SchoolIcon aria-hidden />
        case '/courses':
            return <BookOpen aria-hidden />
        case '/activity':
            return <ActivityIcon aria-hidden />
        case '/collectible-cards':
            return <LayersIcon aria-hidden />
        case '/awards':
            return <Award aria-hidden />
        case '/profile':
            return <User aria-hidden />
        case '/supervision':
            return <EyeIcon aria-hidden />
        case '/instructor':
            return <GraduationCap aria-hidden />
        case '/administrator':
            return <CrownIcon aria-hidden />
        case '/documentation':
            return <BookText aria-hidden />
        case '/about':
            return <Info aria-hidden />
        default:
            return null
    }
}

function MainNavSubmenuItemIcon({
    item,
    SubItemIcon,
}: {
    item: Pick<MainNavSubmenuItem, 'href' | 'iconUrl'>
    SubItemIcon: ComponentType<{ href: string }>
}) {
    if (item.iconUrl) {
        return <CourseIconImage iconUrl={item.iconUrl} size="xs" className="rounded" />
    }

    return <SubItemIcon href={item.href} />
}

function MainNavInstructorSubItemIcon({ href }: { href: string }) {
    switch (href) {
        case '/instructor/courses':
            return <TableIcon aria-hidden />
        case '/instructor/lists':
            return <ListIcon aria-hidden />
        case '/instructor/exams':
            return <FilePenIcon aria-hidden />
        case '/instructor/documents':
            return <FileIcon aria-hidden />
        case '/instructor/problems':
            return <FileBracesCornerIcon aria-hidden />
        case '/instructor/search':
            return <SearchIcon aria-hidden />
        case '/instructor/jutgeai':
            return <BotIcon aria-hidden />
        default:
            return null
    }
}

function MainNavAdministratorSubItemIcon({ href }: { href: string }) {
    switch (href) {
        case '/administrator/dashboard':
            return <LayoutDashboardIcon aria-hidden />
        case '/administrator/queue':
            return <ScrollTextIcon aria-hidden />
        case '/administrator/exams':
            return <CalendarIcon aria-hidden />
        case '/administrator/users':
            return <UsersIcon aria-hidden />
        case '/administrator/instructors':
            return <UserRoundPenIcon aria-hidden />
        case '/administrator/courses':
            return <BookOpenCheckIcon aria-hidden />
        case '/administrator/statistics':
            return <ChartPieIcon aria-hidden />
        case '/administrator/heatmaps':
            return <AudioLinesIcon aria-hidden />
        case '/administrator/ranking':
            return <TrophyIcon aria-hidden />
        default:
            return null
    }
}

function MainNavDocumentationSubItemIcon({ href }: { href: string }) {
    switch (href) {
        case '/documentation/faq':
            return <HelpCircleIcon aria-hidden />
        case '/documentation/compilers':
            return <Code2Icon aria-hidden />
        case '/documentation/verdicts':
            return <GavelIcon aria-hidden />
        case '/documentation/code-metrics':
            return <StethoscopeIcon aria-hidden />
        case '/documentation/pylibs':
            return <BoxesIcon aria-hidden />
        case '/documentation/certificates':
            return <StampIcon aria-hidden />
        case '/documentation/markdown':
            return <FileCode2Icon aria-hidden />
        case '/documentation/references':
            return <BookMarkedIcon aria-hidden />
        default:
            return null
    }
}

function MainNavAboutSubItemIcon({ href }: { href: string }) {
    switch (href) {
        case 'https://t.me/jutge':
            return <SendIcon aria-hidden />
        case '/about/terms-of-service':
            return <MegaphoneIcon aria-hidden />
        case '/about/honor-code':
            return <ShieldIcon aria-hidden />
        case '/about/accessibility':
            return <AccessibilityIcon aria-hidden />
        case '/about/pictures':
            return <CameraIcon aria-hidden />
        case '/about/publications':
            return <FileTextIcon aria-hidden />
        case '/about/merchandising':
            return <ShoppingBagIcon aria-hidden />
        case '/about/credits':
            return <Info aria-hidden />
        default:
            return null
    }
}

const documentationSubmenuItems = documentationNavItems
    .filter((item) => item.tab !== 'index')
    .map(({ href, label, external }) => ({ href, label, external }))

const aboutSubmenuItems = aboutNavItems
    .filter((item) => item.tab !== 'index')
    .map(({ href, label, external }) => ({ href, label, external }))

function navSubItemIsCurrent(pathname: string, href: string, indexHref: string): boolean {
    if (href === indexHref) return pathname === indexHref
    return pathname === href || pathname.startsWith(`${href}/`)
}

type MainNavRoleSubmenuProps = {
    href: string
    label: string
    indexHref: string
    items: readonly MainNavSubmenuItem[]
    pathname: string
    isCurrentSection: boolean
    subItemIcon: ComponentType<{ href: string }>
}

function MainNavRoleSubmenu({
    href,
    label,
    indexHref,
    items,
    pathname,
    isCurrentSection,
    subItemIcon: SubItemIcon,
}: MainNavRoleSubmenuProps) {
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger className={cn(isCurrentSection && 'font-semibold text-foreground')}>
                <MainNavMenuItemIcon href={href} />
                {label}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent className="min-w-52 shadow-lg **:data-[slot=dropdown-menu-item]:py-1.5 **:data-[slot=dropdown-menu-item]:text-base">
                    <DropdownMenuItem asChild>
                        <Link
                            href={indexHref}
                            className={cn(navSubItemIsCurrent(pathname, indexHref, indexHref) && 'text-foreground')}
                        >
                            <MainNavMenuItemIcon href={href} />
                            Index
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {items.map((item) =>
                        item.external ? (
                            <DropdownMenuItem asChild key={item.href}>
                                <ExternalLink href={item.href}>
                                    <MainNavSubmenuItemIcon item={item} SubItemIcon={SubItemIcon} />
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
                                    <MainNavSubmenuItemIcon item={item} SubItemIcon={SubItemIcon} />
                                    {item.label}
                                </Link>
                            </DropdownMenuItem>
                        ),
                    )}
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    )
}

export function MainBreadcrumbsInLayout() {
    const { user } = useAuth()
    const authenticated = user !== null
    const instructor = user?.instructor ?? false
    const tutor = user?.tutor ?? false
    const administrator = user?.administrator ?? false
    const [enrolledCoursesNavItems, setEnrolledCoursesNavItems] = useState<readonly CoursesNavItem[]>([])

    useEffect(() => {
        if (!authenticated || !jutge.meta?.token) {
            setEnrolledCoursesNavItems([])
            return
        }
        void fetchEnrolledCoursesNavItems(jutge)
            .then(setEnrolledCoursesNavItems)
            .catch(() => setEnrolledCoursesNavItems([]))
    }, [authenticated, user?.id])

    const breadcrumbs = useMainBreadcrumbs((s) => s.breadcrumbs)
    const pathname = usePathname()
    const navLinks = getSiteNavLinks({ authenticated, instructor, tutor, administrator })
    const mainMenuLinks = orderMainNavMenuLinks(navLinks)
    const scrollRef = useRef<HTMLElement>(null)

    /** First crumb encodes the main-menu section shown next to Jutge.org. */
    const menuAnchor = breadcrumbs[0]
    const trail = breadcrumbs.length > 0 ? breadcrumbs.slice(1) : []

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.scrollLeft = el.scrollWidth
    }, [breadcrumbs])

    function linkIsCurrentMainSection(linkHref: string): boolean {
        if (menuAnchor) return pathsHrefEqual(menuAnchor.url, linkHref)
        const link = linkHref === homeLink.href ? homeLink : navLinks.find((l) => l.href === linkHref)
        return link?.match(pathname) ?? false
    }

    return (
        <Breadcrumb
            ref={scrollRef}
            className="min-w-0 flex-1 overflow-x-auto font-bold tracking-tight [scrollbar-width:thin]"
        >
            <BreadcrumbList className="flex-nowrap gap-2 text-base text-foreground sm:gap-2">
                <BreadcrumbItem className="shrink-0">
                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-haspopup="menu"
                                                aria-label={
                                                    menuAnchor
                                                        ? `Open main menu (current section: ${menuAnchor.title})`
                                                        : 'Open main menu'
                                                }
                                            >
                                                <MenuIcon className="size-4 shrink-0" aria-hidden />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Main menu</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent
                                align="start"
                                className="min-w-52 -translate-y-2 translate-x-4 overflow-visible shadow-lg **:data-[slot=dropdown-menu-item]:py-1.5 **:data-[slot=dropdown-menu-item]:text-base **:data-[slot=dropdown-menu-sub-trigger]:py-1.5 **:data-[slot=dropdown-menu-sub-trigger]:text-base"
                            >
                                {mainMenuLinks.map(({ href, label }) => (
                                    <Fragment key={href}>
                                        {href === '/documentation' ? <DropdownMenuSeparator /> : null}
                                        {href === '/supervision' || href === '/instructor' ? (
                                            <DropdownMenuSeparator />
                                        ) : null}
                                        {href === '/instructor' ? (
                                            <MainNavRoleSubmenu
                                                href={href}
                                                label={label}
                                                indexHref="/instructor"
                                                items={instructorIndexItems}
                                                pathname={pathname}
                                                isCurrentSection={linkIsCurrentMainSection(href)}
                                                subItemIcon={MainNavInstructorSubItemIcon}
                                            />
                                        ) : href === '/administrator' ? (
                                            <MainNavRoleSubmenu
                                                href={href}
                                                label={label}
                                                indexHref="/administrator"
                                                items={administratorIndexItems}
                                                pathname={pathname}
                                                isCurrentSection={linkIsCurrentMainSection(href)}
                                                subItemIcon={MainNavAdministratorSubItemIcon}
                                            />
                                        ) : href === '/courses' && authenticated ? (
                                            <MainNavRoleSubmenu
                                                href={href}
                                                label={label}
                                                indexHref="/courses"
                                                items={enrolledCoursesNavItems}
                                                pathname={pathname}
                                                isCurrentSection={linkIsCurrentMainSection(href)}
                                                subItemIcon={MainNavMenuItemIcon}
                                            />
                                        ) : href === '/documentation' ? (
                                            <MainNavRoleSubmenu
                                                href={href}
                                                label={label}
                                                indexHref="/documentation"
                                                items={documentationSubmenuItems}
                                                pathname={pathname}
                                                isCurrentSection={linkIsCurrentMainSection(href)}
                                                subItemIcon={MainNavDocumentationSubItemIcon}
                                            />
                                        ) : href === '/about' ? (
                                            <MainNavRoleSubmenu
                                                href={href}
                                                label={label}
                                                indexHref="/about"
                                                items={aboutSubmenuItems}
                                                pathname={pathname}
                                                isCurrentSection={linkIsCurrentMainSection(href)}
                                                subItemIcon={MainNavAboutSubItemIcon}
                                            />
                                        ) : (
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={href}
                                                    className={cn(
                                                        linkIsCurrentMainSection(href) &&
                                                            'font-semibold text-foreground',
                                                    )}
                                                >
                                                    <MainNavMenuItemIcon href={href} />
                                                    {label}
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                    </Fragment>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <BreadcrumbLink asChild>
                                        <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src="/logos/jutge.svg"
                                                alt="Jutge.org"
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
                            <BreadcrumbPage className="ml-3 shrink-0 font-bold">Jutge.org</BreadcrumbPage>
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
                                    <BreadcrumbPage className="truncate font-semibold">{segment.title}</BreadcrumbPage>
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
    )
}
