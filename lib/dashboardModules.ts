import {
    ActivityIcon,
    BookOpenIcon,
    ConstructionIcon,
    FileCodeIcon,
    LayersIcon,
    SendIcon,
    SparklesIcon,
    type LucideIcon,
} from 'lucide-react'

/**
 * The building blocks of the user dashboard home page. `DEFAULT_DASHBOARD_MODULES` is the order
 * modules render in for users who never customized their dashboard; a customized order (with
 * removed modules absent) is stored in the synced settings under `dashboard.modules`. The
 * upcoming-exams banner is deliberately not a module: it always renders pinned above them.
 */

export const DASHBOARD_MODULE_IDS = [
    'welcome',
    'recentCourses',
    'recentProblems',
    'recentSubmissions',
    'suggestedProblems',
    'activityStats',
    'collectibleCards',
] as const

export type DashboardModuleId = (typeof DASHBOARD_MODULE_IDS)[number]

/** Half modules pair up side by side on desktop; full modules take the whole row. */
export type DashboardModuleSize = 'half' | 'full'

export type DashboardModuleDef = {
    title: string
    description: string
    size: DashboardModuleSize
    icon: LucideIcon
}

export const DASHBOARD_MODULES: Record<DashboardModuleId, DashboardModuleDef> = {
    welcome: {
        title: 'Welcome!',
        description: 'A note about this site being under construction.',
        size: 'full',
        icon: ConstructionIcon,
    },
    recentCourses: {
        title: 'Recently visited courses',
        description: 'The courses you last opened.',
        size: 'half',
        icon: BookOpenIcon,
    },
    recentProblems: {
        title: 'Recently visited problems',
        description: 'The problems you last opened.',
        size: 'half',
        icon: FileCodeIcon,
    },
    recentSubmissions: {
        title: 'Recent submissions',
        description: 'Your latest submissions and their verdicts.',
        size: 'half',
        icon: SendIcon,
    },
    suggestedProblems: {
        title: 'Suggested problems',
        description: 'Problems to work on from your last visited course.',
        size: 'half',
        icon: SparklesIcon,
    },
    activityStats: {
        title: 'Activity',
        description: 'Submission statistics and activity calendar.',
        size: 'full',
        icon: ActivityIcon,
    },
    collectibleCards: {
        title: 'Latest collected cards',
        description: 'Your most recently collected cards.',
        size: 'full',
        icon: LayersIcon,
    },
}

/** Height of the scrollable dashboard list cards; 'large' doubles the small height. */
export type DashboardCardSize = 'small' | 'large'

export const DEFAULT_DASHBOARD_CARD_SIZE: DashboardCardSize = 'small'

export function parseDashboardCardSize(value: unknown): DashboardCardSize {
    return value === 'large' ? 'large' : DEFAULT_DASHBOARD_CARD_SIZE
}

export const DEFAULT_DASHBOARD_MODULES: readonly DashboardModuleId[] = DASHBOARD_MODULE_IDS

export function isDashboardModuleId(value: unknown): value is DashboardModuleId {
    return typeof value === 'string' && (DASHBOARD_MODULE_IDS as readonly string[]).includes(value)
}

export type DashboardModuleGroup = {
    /** Stable key derived from the member ids. */
    key: string
    /** Whether the group is a lone full-width module rather than a row of half modules. */
    full: boolean
    ids: DashboardModuleId[]
}

/** Batch consecutive half modules so they share a two-column row; full modules stand alone. */
export function groupDashboardModules(modules: readonly DashboardModuleId[]): DashboardModuleGroup[] {
    const groups: DashboardModuleGroup[] = []
    let halves: DashboardModuleId[] = []

    function flushHalves() {
        if (halves.length > 0) {
            groups.push({ key: halves.join('+'), full: false, ids: halves })
            halves = []
        }
    }

    for (const id of modules) {
        if (DASHBOARD_MODULES[id].size === 'full') {
            flushHalves()
            groups.push({ key: id, full: true, ids: [id] })
        } else {
            halves.push(id)
        }
    }

    flushHalves()
    return groups
}

/**
 * Sanitize a stored module order: drop unknown ids (including retired ones) and duplicates. A
 * missing value falls back to the default layout, while an empty array is kept — it means the
 * user removed every module.
 */
export function parseDashboardModules(value: unknown): DashboardModuleId[] {
    if (!Array.isArray(value)) {
        return [...DEFAULT_DASHBOARD_MODULES]
    }

    const seen = new Set<DashboardModuleId>()
    const modules: DashboardModuleId[] = []
    for (const item of value) {
        if (isDashboardModuleId(item) && !seen.has(item)) {
            seen.add(item)
            modules.push(item)
        }
    }

    return modules
}
