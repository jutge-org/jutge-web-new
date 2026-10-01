export type InterpretersTab = 'index' | 'pyodide' | 'pyweb' | 'jscpp'

export type InterpretersNavItem = {
    tab: InterpretersTab
    label: string
    href: string
}

export const interpretersNavItems: InterpretersNavItem[] = [
    { tab: 'index', label: 'Index', href: '/interpreters' },
    { tab: 'pyodide', label: 'Pyodide', href: '/interpreters/pyodide' },
    { tab: 'pyweb', label: 'PyWeb', href: '/interpreters/pyweb' },
    { tab: 'jscpp', label: 'JSCPP', href: '/interpreters/jscpp' },
]

export const interpretersIndexItems = [
    {
        href: '/interpreters/pyodide',
        label: 'Pyodide',
        description: 'Run Python in the browser',
    },
    {
        href: '/interpreters/pyweb',
        label: 'PyWeb',
        description: 'Run Python with turtle graphics',
    },
    {
        href: '/interpreters/jscpp',
        label: 'JSCPP',
        description: 'Run C++ in the browser',
    },
] as const
