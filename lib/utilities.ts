export type UtilitiesTab = 'index' | 'translator' | 'editor' | 'whiteboard' | 'blackscreen' | 'clock'

export type UtilitiesNavItem = {
    tab: UtilitiesTab
    label: string
    href: string
}

export const utilitiesNavItems: UtilitiesNavItem[] = [
    { tab: 'index', label: 'Index', href: '/utilities' },
    { tab: 'translator', label: 'Translator', href: '/utilities/translator' },
    { tab: 'editor', label: 'Editor', href: '/utilities/editor' },
    { tab: 'whiteboard', label: 'Whiteboard', href: '/utilities/whiteboard' },
    { tab: 'clock', label: 'Clock', href: '/utilities/clock' },
    { tab: 'blackscreen', label: 'Black screen', href: '/utilities/blackscreen' },
]

export const utilitiesIndexItems = [
    {
        href: '/utilities/translator',
        label: 'Translator',
        description: 'Translate text between languages',
    },
    {
        href: '/utilities/editor',
        label: 'Editor',
        description: 'Edit source code with syntax highlighting',
    },
    {
        href: '/utilities/whiteboard',
        label: 'Whiteboard',
        description: 'Sketch and annotate',
    },
    {
        href: '/utilities/blackscreen',
        label: 'Black screen',
        description: 'Show a full black screen',
    },
    {
        href: '/utilities/clock',
        label: 'Clock',
        description: 'Show the current time',
    },
] as const

export function isBlackScreenPath(pathname: string): boolean {
    return pathname === '/utilities/blackscreen'
}

export function isUtilityEditorViewPath(pathname: string): boolean {
    return pathname === '/utilities/editor/view'
}
