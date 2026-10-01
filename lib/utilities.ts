export type UtilitiesTab = 'index' | 'translator' | 'whiteboard' | 'pyodide' | 'pyweb' | 'jscpp'

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
    { tab: 'pyweb', label: 'PyWeb', href: '/utilities/pyweb' },
    { tab: 'jscpp', label: 'JSCPP', href: '/utilities/jscpp' },
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
    {
        href: '/utilities/pyweb',
        label: 'PyWeb',
        description: 'Run Python with turtle graphics',
    },
    {
        href: '/utilities/jscpp',
        label: 'JSCPP',
        description: 'Run C++ in the browser',
    },
] as const
