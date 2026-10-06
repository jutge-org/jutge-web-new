import { getCompilerStatus } from '@/lib/documentation'
import type { Compiler } from '@/lib/jutge_api_client'

export const UTILITY_EDITOR_CODE_STORAGE_KEY = 'utility-editor-code'
export const UTILITY_EDITOR_PROGLANG_STORAGE_KEY = 'utility-editor-proglang'

export function activeCompilerLanguages(compilers: Compiler[]): string[] {
    const seen = new Set<string>()
    const languages: string[] = []

    for (const compiler of compilers) {
        if (getCompilerStatus(compiler).defunct) {
            continue
        }
        if (seen.has(compiler.language)) {
            continue
        }
        seen.add(compiler.language)
        languages.push(compiler.language)
    }

    return languages.sort((a, b) => a.localeCompare(b))
}

export function readUtilityEditorCode(): string {
    if (typeof window === 'undefined') {
        return ''
    }

    try {
        return window.localStorage.getItem(UTILITY_EDITOR_CODE_STORAGE_KEY) ?? ''
    } catch {
        return ''
    }
}

export function writeUtilityEditorCode(code: string): void {
    try {
        window.localStorage.setItem(UTILITY_EDITOR_CODE_STORAGE_KEY, code)
    } catch {
        // Ignore quota or private mode errors.
    }
}

export function readUtilityEditorProglang(fallback: string): string {
    if (typeof window === 'undefined') {
        return fallback
    }

    try {
        return window.localStorage.getItem(UTILITY_EDITOR_PROGLANG_STORAGE_KEY) ?? fallback
    } catch {
        return fallback
    }
}

export function writeUtilityEditorProglang(proglang: string): void {
    try {
        window.localStorage.setItem(UTILITY_EDITOR_PROGLANG_STORAGE_KEY, proglang)
    } catch {
        // Ignore quota or private mode errors.
    }
}
