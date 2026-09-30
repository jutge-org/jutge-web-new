export type UtilitiesTab = 'index' | 'translator' | 'whiteboard' | 'pyodide'

export type UtilitiesNavItem = {
    tab: UtilitiesTab
    label: string
    href: string
}

export const utilitiesNavItems: UtilitiesNavItem[] = [
    { tab: 'index', label: 'Index', href: '/utilities' },
    { tab: 'translator', label: 'Translator', href: '/utilities/translator' },
    { tab: 'whiteboard', label: 'Whiteboard', href: '/utilities/whiteboard' },
    { tab: 'pyodide', label: 'Pyodide', href: '/utilities/pyodide' },
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
    {
        href: '/utilities/pyodide',
        label: 'Pyodide',
        description: 'Run Python in the browser',
    },
] as const
