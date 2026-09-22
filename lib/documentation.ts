import type { Compiler } from '@/lib/jutge_api_client'

export type DocumentationTab = 'index' | 'faq' | 'compilers' | 'verdicts' | 'references' | 'certificates' | 'markdown'

export type DocumentationNavItem = {
    tab: DocumentationTab
    label: string
    href: string
    external?: boolean
}

export const documentationNavItems: DocumentationNavItem[] = [
    { tab: 'index', label: 'Index', href: '/documentation' },
    { tab: 'faq', label: 'FAQ', href: '/documentation/faq' },
    { tab: 'compilers', label: 'Compilers', href: '/documentation/compilers' },
    { tab: 'verdicts', label: 'Verdicts', href: '/documentation/verdicts' },
    { tab: 'references', label: 'References', href: '/documentation/references' },
]

export const documentationIndexItems = [
    {
        href: '/documentation/faq',
        label: 'FAQ',
        description: 'Common questions about problems, solutions, verdicts, code metrics, and Python libraries',
    },
    {
        href: '/documentation/compilers',
        label: 'Compilers',
        description: 'Languages and compilers available on Jutge.org',
    },
    {
        href: '/documentation/verdicts',
        label: 'Verdicts',
        description: 'What each submission verdict means',
    },
    {
        href: 'https://github.com/jutge-org/jutge-toolkit',
        label: 'Toolkit',
        description: 'Official Jutge toolkit on GitHub',
        external: true,
    },
    {
        href: 'https://api.jutge.org',
        label: 'API',
        description: 'Jutge.org API documentation',
        external: true,
    },
    {
        href: '/documentation/references',
        label: 'References',
        description: 'Language references and cheat sheets',
    },
    {
        href: 'https://github.com/jutge-org/',
        label: 'GitHub repos',
        description: 'Jutge.org code repositories',
        external: true,
    },
] as const

export function compilerIdToSlug(compilerId: string): string {
    return compilerId.replace(/\+\+/g, 'XX')
}

export function slugToCompilerId(slug: string): string {
    return slug.replace(/XX/g, '++')
}

export function getCompilerStatus(compiler: Compiler): { icon: string; label: string; defunct: boolean } {
    if (compiler.status === 'Defunct') {
        return { icon: '💀', label: 'Defunct', defunct: true }
    }
    if (compiler.status) {
        return { icon: '🔴', label: compiler.status, defunct: false }
    }
    return { icon: '🟢', label: 'Ok', defunct: false }
}

export function getActiveCompilers(compilers: Compiler[]): Compiler[] {
    return compilers.filter((compiler) => !getCompilerStatus(compiler).defunct)
}

export function countActiveProglangs(compilers: Compiler[]): number {
    return new Set(getActiveCompilers(compilers).map((compiler) => compiler.language)).size
}

export function findCompilerBySlug(compilers: Compiler[], slug: string): Compiler | undefined {
    const compilerId = slugToCompilerId(slug)
    return compilers.find((c) => c.compiler_id === compilerId)
}
