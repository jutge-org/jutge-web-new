import { aboutIndexItems } from '@/lib/about'
import { documentationIndexItems } from '@/lib/documentation'
import { GITHUB_ISSUES_URL } from '@/lib/github'
import { LAYOUT_WIDTH_CONSTRAINED, LAYOUT_WIDTH_FULL, LAYOUT_WIDTH_WIDE, type LayoutWidth } from '@/lib/layoutWidth'
import { profileNavItems } from '@/lib/profile'
import { getSiteNavLinkDescription, getSiteNavLinks, homeLink, type SiteNavLinksContext } from '@/lib/siteNavLinks'
import { includesForSearch } from '@/lib/utils'

export type CommandPaletteSectionArea = 'app' | 'command' | 'profile' | 'documentation' | 'about'

export type CommandPaletteSectionAction = 'login' | 'logout' | 'open-settings' | 'toggle-theme' | 'set-layout-width'

export type CommandPaletteSection = {
    label: string
    description: string
    href: string
    area: CommandPaletteSectionArea
    external?: boolean
    keywords?: string[]
    action?: CommandPaletteSectionAction
    layoutWidth?: LayoutWidth
}

export const commandPaletteSections: CommandPaletteSection[] = [
    {
        label: 'Documentation',
        description: 'Documentation index for Jutge.org',
        href: '/documentation',
        area: 'documentation',
    },
    ...documentationIndexItems.map((item) => ({
        label: item.label,
        description: item.description,
        href: item.href,
        area: 'documentation' as const,
        ...('external' in item ? { external: item.external } : {}),
    })),
    {
        label: 'About',
        description: 'About Jutge.org',
        href: '/about',
        area: 'about',
    },
    ...aboutIndexItems.map((item) => ({
        label: item.label,
        description: item.description,
        href: item.href,
        area: 'about' as const,
        ...('external' in item ? { external: item.external } : {}),
    })),
]

export function getCommandPaletteAppSections(context: SiteNavLinksContext): CommandPaletteSection[] {
    return [
        {
            label: homeLink.label,
            description: getSiteNavLinkDescription(homeLink.href, context),
            href: homeLink.href,
            area: 'app',
        },
        ...getSiteNavLinks(context).map((link) => ({
            label: link.label,
            description: getSiteNavLinkDescription(link.href, context),
            href: link.href,
            area: 'app' as const,
        })),
    ]
}

const appearanceSettingsCommand: CommandPaletteSection = {
    label: 'Settings',
    description: 'Customize appearance and preferences',
    keywords: ['Appearance', 'Theme', 'Accessibility'],
    href: '',
    area: 'command',
    action: 'open-settings',
}

const toggleThemeCommand: CommandPaletteSection = {
    label: 'Toggle theme',
    description: 'Switch between light and dark theme',
    keywords: ['Dark mode', 'Light mode', 'Theme'],
    href: '',
    area: 'command',
    action: 'toggle-theme',
}

const layoutWidthCommands: CommandPaletteSection[] = [
    {
        label: 'Comfortable page width',
        description: 'Use a narrower content area',
        keywords: ['Page width', 'Layout width', 'Constrained', 'Comfortable'],
        href: '',
        area: 'command',
        action: 'set-layout-width',
        layoutWidth: LAYOUT_WIDTH_CONSTRAINED,
    },
    {
        label: 'Wide page width',
        description: 'Use a wider content area',
        keywords: ['Page width', 'Layout width', 'Wide'],
        href: '',
        area: 'command',
        action: 'set-layout-width',
        layoutWidth: LAYOUT_WIDTH_WIDE,
    },
    {
        label: 'Full page width',
        description: 'Use the full browser width for content',
        keywords: ['Page width', 'Layout width', 'Full'],
        href: '',
        area: 'command',
        action: 'set-layout-width',
        layoutWidth: LAYOUT_WIDTH_FULL,
    },
]

const reportIssueCommand: CommandPaletteSection = {
    label: 'Report issue',
    description: 'Report a bug or suggest an improvement on GitHub',
    keywords: ['Bug', 'Feedback', 'GitHub'],
    href: GITHUB_ISSUES_URL,
    area: 'command',
    external: true,
}

const profileSectionMeta: Record<
    Exclude<(typeof profileNavItems)[number]['tab'], 'index'>,
    { description: string; keywords: string[] }
> = {
    update: {
        description: 'Edit your name, email, and other profile details',
        keywords: ['Edit profile', 'Update profile'],
    },
    avatar: {
        description: 'Change your profile picture',
        keywords: ['Profile picture', 'Photo'],
    },
    password: {
        description: 'Change your account password',
        keywords: ['Change password', 'Credentials'],
    },
    email: {
        description: 'Change your account email address',
        keywords: ['Change email', 'Email address'],
    },
}

export function getCommandPaletteProfileSections(context: SiteNavLinksContext): CommandPaletteSection[] {
    if (!context.authenticated) {
        return []
    }

    return profileNavItems
        .filter((item) => item.tab !== 'index')
        .map((item) => {
            const meta = profileSectionMeta[item.tab as keyof typeof profileSectionMeta]
            return {
                label: item.label,
                description: meta.description,
                keywords: meta.keywords,
                href: item.href,
                area: 'profile' as const,
            }
        })
}

const supervisionCommand: CommandPaletteSection = {
    label: 'Supervision',
    description: 'Supervise a student in a course you teach',
    keywords: ['Supervise', 'Student', 'Monitor', 'Watch'],
    href: '/supervision',
    area: 'command',
}

export function getCommandPaletteCommands(context: SiteNavLinksContext): CommandPaletteSection[] {
    const sharedCommands = [appearanceSettingsCommand, toggleThemeCommand, ...layoutWidthCommands]

    if (context.authenticated) {
        const supervisorCommands = context.instructor || context.tutor ? [supervisionCommand] : []

        return [
            ...sharedCommands,
            ...supervisorCommands,
            reportIssueCommand,
            {
                label: 'Sign out',
                description: 'End your session on Jutge.org',
                keywords: ['Log out', 'Logout', 'Sign out'],
                href: '',
                area: 'command',
                action: 'logout',
            },
        ]
    }

    return [
        ...sharedCommands,
        {
            label: 'Sign in',
            description: 'Log in to your Jutge.org account',
            keywords: ['Log in', 'Login', 'Sign in'],
            href: '',
            area: 'command',
            action: 'login',
        },
    ]
}

function buildSectionSearchHaystack(section: CommandPaletteSection): string {
    const keywords = section.keywords?.join(' ') ?? ''
    return `${section.label} ${section.description} ${keywords}`
}

export function filterCommandPaletteSections(
    sections: CommandPaletteSection[],
    query: string,
): CommandPaletteSection[] {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
        return []
    }

    return sections.filter((section) => includesForSearch(buildSectionSearchHaystack(section), trimmedQuery))
}
