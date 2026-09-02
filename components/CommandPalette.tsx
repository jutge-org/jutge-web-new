'use client'

import { useAuth } from '@/components/AuthProvider'
import {
    fetchCommandPaletteCourses,
    fetchCommandPaletteExams,
    fetchCommandPaletteProblems,
    type CommandPaletteCourse,
} from '@/lib/data/commandPalette'
import { CommandSearchInput } from '@/components/CommandSearchInput'
import { CourseIconImage } from '@/components/courses/CourseIconImage'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { useLayoutWidth } from '@/components/layout/LayoutWidthProvider'
import { useRecents } from '@/components/RecentsProvider'
import { SignInDialog } from '@/components/SignInDialog'
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    commandPaletteSections,
    filterCommandPaletteSections,
    getCommandPaletteAppSections,
    getCommandPaletteCommands,
    getCommandPaletteProfileSections,
    type CommandPaletteSection,
} from '@/lib/commandPaletteSections'
import { dispatchOpenAppearanceSettings } from '@/lib/appearanceSettings'
import { courseHref, filterAndSortCourses, publicCourseHref, resolveCourseIconUrl } from '@/lib/courses'
import { filterAndSortExams, type ExamRow } from '@/lib/exams'
import { LAYOUT_WIDTH_CONSTRAINED, LAYOUT_WIDTH_FULL, LAYOUT_WIDTH_WIDE } from '@/lib/layoutWidth'
import { filterProblems, resolveProblemIconUrl } from '@/lib/problems'
import { filterCommandPaletteRecents, type CommandPaletteRecentItem } from '@/lib/recents'
import type { ProblemRow } from '@/lib/data/problems'
import {
    BookOpenIcon,
    BookTextIcon,
    CircleDotIcon,
    FileBracesCornerIcon,
    InfoIcon,
    LayoutGridIcon,
    LogInIcon,
    LogOutIcon,
    EyeIcon,
    RectangleHorizontalIcon,
    SchoolIcon,
    SearchIcon,
    SendIcon,
    Settings2Icon,
    SquareIcon,
    StretchHorizontalIcon,
    SunMoonIcon,
    TerminalIcon,
    UserIcon,
} from 'lucide-react'
import { useAppearanceThemePreference } from '@/components/AppearancePreferencesProvider'
import { useTheme } from 'next-themes'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

const RESULTS_LIMIT = 10

function SearchShortcutHint() {
    const [modifierKey, setModifierKey] = useState('Ctrl')

    useEffect(() => {
        const isApplePlatform =
            typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
        setModifierKey(isApplePlatform ? '⌘' : 'Ctrl')
    }, [])

    return (
        <KbdGroup className="ml-2">
            <Kbd>{modifierKey} K</Kbd>
        </KbdGroup>
    )
}

export function CommandPalette() {
    const { user, logout } = useAuth()
    const authenticated = user !== null
    const instructor = user?.instructor ?? false
    const tutor = user?.tutor ?? false
    const administrator = user?.administrator ?? false
    const router = useRouter()
    const pathname = usePathname()
    const [, setAppearanceTheme] = useAppearanceThemePreference()
    const { resolvedTheme } = useTheme()
    const { setLayoutWidth } = useLayoutWidth()
    const { recents } = useRecents()
    const [open, setOpen] = useState(false)
    const [signInOpen, setSignInOpen] = useState(false)
    const [signOutPending, startSignOut] = useTransition()
    const [query, setQuery] = useState('')
    const [problems, setProblems] = useState<ProblemRow[]>([])
    const [courses, setCourses] = useState<CommandPaletteCourse[]>([])
    const [exams, setExams] = useState<ExamRow[]>([])
    const [loading, setLoading] = useState(false)
    const [loaded, setLoaded] = useState(false)

    const navContext = useMemo(
        () => ({ authenticated, instructor, tutor, administrator }),
        [authenticated, instructor, tutor, administrator],
    )

    const loadData = useCallback(async () => {
        if (loaded) {
            return
        }

        setLoading(true)
        try {
            const [problemsData, coursesData, examsData] = await Promise.all([
                fetchCommandPaletteProblems(),
                fetchCommandPaletteCourses(),
                authenticated ? fetchCommandPaletteExams() : Promise.resolve([]),
            ])
            setProblems(problemsData)
            setCourses(coursesData)
            setExams(examsData)
            setLoaded(true)
        } finally {
            setLoading(false)
        }
    }, [authenticated, loaded])

    useEffect(() => {
        if (open) {
            void loadData()
            return
        }
        setQuery('')
    }, [open, loadData])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                setOpen((current) => !current)
            }
        }

        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [])

    const trimmedQuery = query.trim()

    const filteredProblems = useMemo(() => {
        if (!trimmedQuery) {
            return []
        }
        return filterProblems(problems, trimmedQuery).slice(0, RESULTS_LIMIT)
    }, [problems, trimmedQuery])

    const filteredCourses = useMemo(() => {
        if (!trimmedQuery) {
            return []
        }
        return filterAndSortCourses(courses, trimmedQuery, 'all', 'title').slice(0, RESULTS_LIMIT)
    }, [courses, trimmedQuery])

    const filteredExams = useMemo(() => {
        if (!trimmedQuery || !authenticated) {
            return []
        }
        return filterAndSortExams(exams, trimmedQuery, 'all', 'all', 'title').slice(0, RESULTS_LIMIT)
    }, [authenticated, exams, trimmedQuery])

    const filteredRecents = useMemo(() => {
        if (!trimmedQuery || !authenticated) {
            return []
        }
        return filterCommandPaletteRecents(recents, trimmedQuery, RESULTS_LIMIT)
    }, [authenticated, recents, trimmedQuery])

    const courseIconByKey = useMemo(() => {
        const map = new Map<string, string>()
        for (const course of courses) {
            map.set(course.course_key, course.iconUrl)
        }
        for (const exam of exams) {
            const courseKey = exam.courseHref.replace(/^\/courses\//, '')
            map.set(courseKey, exam.courseIconUrl)
        }
        return map
    }, [courses, exams])

    const problemIconByNm = useMemo(() => {
        const map = new Map<string, string>()
        for (const problem of problems) {
            if (problem.iconUrl) {
                map.set(problem.problem_nm, problem.iconUrl)
            }
        }
        return map
    }, [problems])

    const filteredSections = useMemo(() => {
        if (!trimmedQuery) {
            return { app: [], command: [], profile: [], documentation: [], about: [] }
        }

        const appSections = filterCommandPaletteSections(getCommandPaletteAppSections(navContext), trimmedQuery).slice(
            0,
            RESULTS_LIMIT,
        )
        const commandSections = filterCommandPaletteSections(getCommandPaletteCommands(navContext), trimmedQuery).slice(
            0,
            RESULTS_LIMIT,
        )
        const profileSections = filterCommandPaletteSections(
            getCommandPaletteProfileSections(navContext),
            trimmedQuery,
        ).slice(0, RESULTS_LIMIT)
        const staticSections = filterCommandPaletteSections(commandPaletteSections, trimmedQuery)

        return {
            app: appSections,
            command: commandSections,
            profile: profileSections,
            documentation: staticSections.filter((section) => section.area === 'documentation').slice(0, RESULTS_LIMIT),
            about: staticSections.filter((section) => section.area === 'about').slice(0, RESULTS_LIMIT),
        }
    }, [navContext, trimmedQuery])

    const hasResults =
        filteredProblems.length > 0 ||
        filteredCourses.length > 0 ||
        filteredExams.length > 0 ||
        filteredRecents.length > 0 ||
        filteredSections.app.length > 0 ||
        filteredSections.command.length > 0 ||
        filteredSections.profile.length > 0 ||
        filteredSections.documentation.length > 0 ||
        filteredSections.about.length > 0

    function navigate(href: string) {
        setOpen(false)
        router.push(href)
    }

    function handleSignOut() {
        startSignOut(async () => {
            await logout()
            toast.success('Signed out')
            if (pathname === '/') {
                router.refresh()
            } else {
                router.push('/')
            }
        })
    }

    function navigateToSection(section: CommandPaletteSection) {
        setOpen(false)
        if (section.external) {
            window.open(section.href, '_blank', 'noopener,noreferrer')
            return
        }
        router.push(section.href)
    }

    function runCommand(section: CommandPaletteSection) {
        setOpen(false)
        switch (section.action) {
            case 'login':
                setSignInOpen(true)
                return
            case 'logout':
                handleSignOut()
                return
            case 'open-settings':
                dispatchOpenAppearanceSettings()
                return
            case 'toggle-theme':
                setAppearanceTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                return
            case 'set-layout-width':
                if (section.layoutWidth) {
                    setLayoutWidth(section.layoutWidth)
                }
                return
            default:
                navigateToSection(section)
        }
    }

    function commandIcon(section: CommandPaletteSection) {
        if (section.external) {
            return CircleDotIcon
        }
        switch (section.action) {
            case 'login':
                return LogInIcon
            case 'logout':
                return LogOutIcon
            case 'open-settings':
                return Settings2Icon
            case 'toggle-theme':
                return SunMoonIcon
            case 'set-layout-width':
                switch (section.layoutWidth) {
                    case LAYOUT_WIDTH_CONSTRAINED:
                        return SquareIcon
                    case LAYOUT_WIDTH_WIDE:
                        return RectangleHorizontalIcon
                    case LAYOUT_WIDTH_FULL:
                        return StretchHorizontalIcon
                    default:
                        return SquareIcon
                }
            default:
                if (section.href === '/supervision') {
                    return EyeIcon
                }
                return TerminalIcon
        }
    }

    function recentIcon(item: CommandPaletteRecentItem) {
        switch (item.kind) {
            case 'course':
                return BookOpenIcon
            case 'problem':
                return FileBracesCornerIcon
            case 'submission':
                return SendIcon
        }
    }

    function resolveRecentCourseIconUrl(item: CommandPaletteRecentItem): string | undefined {
        if (item.kind !== 'course') {
            return undefined
        }

        const courseKey = item.id.slice('course:'.length)
        return resolveCourseIconUrl(courseKey, courseIconByKey, item.iconUrl)
    }

    function resolveRecentProblemIconUrl(item: CommandPaletteRecentItem): string | null {
        if (item.kind !== 'problem') {
            return null
        }

        const problemNm = item.id.slice('problem:'.length)
        return resolveProblemIconUrl(problemNm, problemIconByNm, item.iconUrl)
    }

    function renderRecentLeading(item: CommandPaletteRecentItem) {
        if (item.kind === 'course') {
            return <CourseIconImage iconUrl={resolveRecentCourseIconUrl(item)!} size="2xs" className="rounded" />
        }

        if (item.kind === 'problem') {
            const iconUrl = resolveRecentProblemIconUrl(item)
            if (iconUrl) {
                return <ProblemIconImage iconUrl={iconUrl} size="2xs" className="rounded" />
            }
        }

        const Icon = recentIcon(item)
        return <Icon className="size-3.5 shrink-0" aria-hidden />
    }

    const hasCommands = filteredSections.command.length > 0
    const hasProblems = filteredProblems.length > 0
    const hasCourses = filteredCourses.length > 0
    const hasExams = filteredExams.length > 0
    const hasRecents = filteredRecents.length > 0
    const hasSections = filteredSections.app.length > 0
    const hasProfile = filteredSections.profile.length > 0
    const hasDocumentation = filteredSections.documentation.length > 0
    const hasAbout = filteredSections.about.length > 0

    const searchHint = authenticated
        ? 'Type to search commands, problems, courses, exams, sections, and documentation.'
        : 'Type to search commands, problems, courses, sections, and documentation.'

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            aria-label="Quick search"
                            onClick={() => setOpen(true)}
                            className="hidden h-8 w-40 items-center gap-2 rounded-md border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
                        >
                            <SearchIcon className="size-4 shrink-0" aria-hidden />
                            <span className="min-w-0 flex-1 truncate text-left">Search…</span>
                            <span className="hidden shrink-0 sm:inline-flex">
                                <SearchShortcutHint />
                            </span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Quick search</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                title="Quick search"
                description="Search problems, courses, exams, sections, and documentation"
                className="max-w-4xl p-4"
            >
                <Command shouldFilter={false}>
                    <div className="px-2 pb-2 text-sm font-medium flex flex-row items-center gap-2">
                        <SearchIcon className="size-4.5" aria-hidden />
                        Quick search
                        <div className="flex-1"></div>
                        <SearchShortcutHint />
                    </div>
                    <CommandSearchInput placeholder="Search..." value={query} onValueChange={setQuery} autoFocus />
                    <CommandList className="max-h-96">
                        {loading ? <CommandEmpty>Loading…</CommandEmpty> : null}
                        {!loading && !trimmedQuery ? (
                            <CommandEmpty className="text-muted-foreground">{searchHint}</CommandEmpty>
                        ) : null}
                        {!loading && trimmedQuery && !hasResults ? (
                            <CommandEmpty>No results found.</CommandEmpty>
                        ) : null}
                        {!loading && hasCommands ? (
                            <CommandGroup heading="Commands">
                                {filteredSections.command.map((section) => {
                                    const Icon = commandIcon(section)
                                    return (
                                        <CommandItem
                                            key={section.layoutWidth ?? section.action ?? section.label}
                                            value={section.label}
                                            disabled={section.action === 'logout' && signOutPending}
                                            onSelect={() => runCommand(section)}
                                        >
                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <Icon className="size-3.5 shrink-0" aria-hidden />
                                                    <span className="truncate font-medium">{section.label}</span>
                                                </div>
                                                <span className="truncate pl-5.5 text-xs text-muted-foreground">
                                                    {section.description}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        ) : null}
                        {!loading && hasCommands && hasProblems ? <CommandSeparator /> : null}
                        {!loading && filteredProblems.length > 0 ? (
                            <CommandGroup heading="Problems">
                                {filteredProblems.map((problem) => (
                                    <CommandItem
                                        key={problem.problem_nm}
                                        value={problem.problem_nm}
                                        onSelect={() => navigate(`/problems/${problem.problem_nm}`)}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                {problem.iconUrl ? (
                                                    <ProblemIconImage
                                                        iconUrl={problem.iconUrl}
                                                        size="2xs"
                                                        className="rounded"
                                                    />
                                                ) : (
                                                    <FileBracesCornerIcon className="size-3.5 shrink-0" aria-hidden />
                                                )}
                                                <span className="truncate font-medium">{problem.title}</span>
                                            </div>
                                            <span className="truncate pl-5.5 text-xs text-muted-foreground">
                                                {problem.problem_nm}
                                                {problem.author ? ` · ${problem.author}` : ''}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}
                        {!loading && (hasCommands || hasProblems) && hasCourses ? <CommandSeparator /> : null}
                        {!loading && filteredCourses.length > 0 ? (
                            <CommandGroup heading="Courses">
                                {filteredCourses.map((course) => (
                                    <CommandItem
                                        key={course.course_key}
                                        value={course.course_key}
                                        onSelect={() =>
                                            navigate(
                                                authenticated
                                                    ? courseHref(course.course_key)
                                                    : publicCourseHref(course.course_key),
                                            )
                                        }
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <CourseIconImage
                                                    iconUrl={course.iconUrl}
                                                    size="2xs"
                                                    className="rounded"
                                                />
                                                <span className="truncate font-medium">{course.title}</span>
                                            </div>
                                            <span className="truncate pl-5.5 text-xs text-muted-foreground">
                                                {course.ownerName}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}
                        {!loading && (hasCommands || hasProblems || hasCourses) && hasExams ? (
                            <CommandSeparator />
                        ) : null}
                        {!loading && filteredExams.length > 0 ? (
                            <CommandGroup heading="Exams">
                                {filteredExams.map((exam) => (
                                    <CommandItem
                                        key={exam.exam_key}
                                        value={exam.exam_key}
                                        onSelect={() => navigate(`/exams/${exam.exam_key}`)}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <SchoolIcon className="size-3.5 shrink-0" aria-hidden />
                                                <span className="truncate font-medium">{exam.title}</span>
                                            </div>
                                            <div className="flex min-w-0 items-center gap-1.5 pl-5.5 text-xs text-muted-foreground">
                                                <CourseIconImage
                                                    iconUrl={exam.courseIconUrl}
                                                    size="2xs"
                                                    className="rounded"
                                                />
                                                <span className="truncate">
                                                    {exam.courseTitle} · {exam.ownerName}
                                                </span>
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}
                        {!loading && (hasCommands || hasProblems || hasCourses || hasExams) && hasRecents ? (
                            <CommandSeparator />
                        ) : null}
                        {!loading && filteredRecents.length > 0 ? (
                            <CommandGroup heading="Recent">
                                {filteredRecents.map((item) => (
                                    <CommandItem key={item.id} value={item.id} onSelect={() => navigate(item.href)}>
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                {renderRecentLeading(item)}
                                                <span className="truncate font-medium">{item.label}</span>
                                            </div>
                                            <span className="truncate pl-5.5 text-xs text-muted-foreground">
                                                {item.description}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}
                        {!loading &&
                        (hasCommands || hasProblems || hasCourses || hasExams || hasRecents) &&
                        hasSections ? (
                            <CommandSeparator />
                        ) : null}
                        {!loading && filteredSections.app.length > 0 ? (
                            <CommandGroup heading="Sections">
                                {filteredSections.app.map((section) => (
                                    <CommandItem
                                        key={section.href}
                                        value={section.href}
                                        onSelect={() => navigateToSection(section)}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <LayoutGridIcon className="size-3.5 shrink-0" aria-hidden />
                                                <span className="truncate font-medium">{section.label}</span>
                                            </div>
                                            <span className="truncate pl-5.5 text-xs text-muted-foreground">
                                                {section.description}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}
                        {!loading &&
                        (hasCommands || hasProblems || hasCourses || hasExams || hasRecents || hasSections) &&
                        hasProfile ? (
                            <CommandSeparator />
                        ) : null}
                        {!loading && filteredSections.profile.length > 0 ? (
                            <CommandGroup heading="Profile">
                                {filteredSections.profile.map((section) => (
                                    <CommandItem
                                        key={section.href}
                                        value={section.href}
                                        onSelect={() => navigateToSection(section)}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserIcon className="size-3.5 shrink-0" aria-hidden />
                                                <span className="truncate font-medium">{section.label}</span>
                                            </div>
                                            <span className="truncate pl-5.5 text-xs text-muted-foreground">
                                                {section.description}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}
                        {!loading &&
                        (hasCommands ||
                            hasProblems ||
                            hasCourses ||
                            hasExams ||
                            hasRecents ||
                            hasSections ||
                            hasProfile) &&
                        hasDocumentation ? (
                            <CommandSeparator />
                        ) : null}
                        {!loading && filteredSections.documentation.length > 0 ? (
                            <CommandGroup heading="Documentation">
                                {filteredSections.documentation.map((section) => (
                                    <CommandItem
                                        key={section.href}
                                        value={section.href}
                                        onSelect={() => navigateToSection(section)}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <BookTextIcon className="size-3.5 shrink-0" aria-hidden />
                                                <span className="truncate font-medium">{section.label}</span>
                                            </div>
                                            <span className="truncate pl-5.5 text-xs text-muted-foreground">
                                                {section.description}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}
                        {!loading &&
                        (hasCommands ||
                            hasProblems ||
                            hasCourses ||
                            hasExams ||
                            hasRecents ||
                            hasSections ||
                            hasProfile ||
                            hasDocumentation) &&
                        hasAbout ? (
                            <CommandSeparator />
                        ) : null}
                        {!loading && filteredSections.about.length > 0 ? (
                            <CommandGroup heading="About">
                                {filteredSections.about.map((section) => (
                                    <CommandItem
                                        key={section.href}
                                        value={section.href}
                                        onSelect={() => navigateToSection(section)}
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <InfoIcon className="size-3.5 shrink-0" aria-hidden />
                                                <span className="truncate font-medium">{section.label}</span>
                                            </div>
                                            <span className="truncate pl-5.5 text-xs text-muted-foreground">
                                                {section.description}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}
                    </CommandList>
                </Command>
            </CommandDialog>

            {!authenticated ? (
                <SignInDialog
                    open={signInOpen}
                    onOpenChange={setSignInOpen}
                    onSignedIn={() => {
                        window.location.assign(pathname)
                    }}
                />
            ) : null}
        </>
    )
}
