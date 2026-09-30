export type UtilitiesTab = 'index' | 'translator' | 'whiteboard'

export type UtilitiesNavItem = {
    tab: UtilitiesTab
    label: string
    href: string
}

export const utilitiesNavItems: UtilitiesNavItem[] = [
    { tab: 'index', label: 'Index', href: '/utilities' },
    { tab: 'translator', label: 'Translator', href: '/utilities/translator' },
    { tab: 'whiteboard', label: 'Whiteboard', href: '/utilities/whiteboard' },
]

export const utilitiesIndexItems = [
    {
        href: '/utilities/translator',
        label: 'Translator',
        description: 'Translate text between languages',
    },
    {
        href: '/utilities/whiteboard',
        label: 'Whiteboard',
        description: 'Sketch and annotate',
    },
] as const
