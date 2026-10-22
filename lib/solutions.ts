import type { Compiler } from '@/lib/jutge_api_client'

export const MAKE_SOLUTION_PROGLANG = 'Make'

export function isMakeSolutionProglang(proglang: string): boolean {
    return proglang === MAKE_SOLUTION_PROGLANG
}

export function extensionForProglang(proglang: string, compilers: Compiler[]): string | null {
    const compiler = compilers.find((entry) => entry.language === proglang)
    return compiler?.extension ?? null
}

export function solutionFilename(problem_nm: string, proglang: string, extension: string | null): string {
    const suffix = extension ? `.${extension}` : '.txt'
    const safeProglang = proglang.replace(/[^\w+-]+/g, '_')
    return `${problem_nm}-${safeProglang}${suffix}`
}

export function decodeSolutionB64(contentB64: string): string {
    return Buffer.from(contentB64, 'base64').toString('utf-8')
}

export function solutionProglangPathSegment(proglang: string): string {
    return encodeURIComponent(proglang)
}

export function solutionViewHref(pageKey: string, proglang: string): string {
    return `/problems/${pageKey}/solutions/${solutionProglangPathSegment(proglang)}/view`
}

export function solutionDownloadHref(pageKey: string, proglang: string): string {
    return `/problems/${pageKey}/solutions/${solutionProglangPathSegment(proglang)}`
}

export function formatProglangName(proglang: string): string {
    return proglang.replace(/_/g, ' ')
}
