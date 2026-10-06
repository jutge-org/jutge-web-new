import { getCompilerStatus } from '@/lib/documentation'
import type { Compiler } from '@/lib/jutge_api_client'

const UTILITY_EDITOR_STATE_STORAGE_KEY = 'utility-editor-documents'
const UTILITY_EDITOR_CODE_STORAGE_KEY = 'utility-editor-code'
const UTILITY_EDITOR_PROGLANG_STORAGE_KEY = 'utility-editor-proglang'

let utilityEditorEpoch = 0

export function readUtilityEditorEpoch(): number {
    return utilityEditorEpoch
}

export function clearUtilityEditorState(): void {
    utilityEditorEpoch += 1
    try {
        window.localStorage.removeItem(UTILITY_EDITOR_STATE_STORAGE_KEY)
        window.localStorage.removeItem(UTILITY_EDITOR_CODE_STORAGE_KEY)
        window.localStorage.removeItem(UTILITY_EDITOR_PROGLANG_STORAGE_KEY)
    } catch {
        // Ignore private mode or blocked storage.
    }
}

export type UtilityEditorDocument = {
    id: string
    name: string
    code: string
    proglang: string
}

export type UtilityEditorState = {
    activeId: string
    documents: UtilityEditorDocument[]
}

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

export function fallbackUtilityEditorProglang(available: readonly string[], preferred = 'Python'): string {
    if (available.includes(preferred)) {
        return preferred
    }
    return available[0] ?? preferred
}

export function createUtilityEditorDocument(name: string, proglang: string, code = ''): UtilityEditorDocument {
    return {
        id: crypto.randomUUID(),
        name,
        code,
        proglang,
    }
}

export function nextUtilityEditorDocumentName(documents: readonly Pick<UtilityEditorDocument, 'name'>[]): string {
    const names = new Set(documents.map((document) => document.name.trim()))
    if (!names.has('Untitled')) {
        return 'Untitled'
    }

    let index = 2
    while (names.has(`Untitled ${index}`)) {
        index += 1
    }
    return `Untitled ${index}`
}

function isUtilityEditorDocument(value: unknown): value is UtilityEditorDocument {
    if (!value || typeof value !== 'object') {
        return false
    }

    const document = value as Partial<UtilityEditorDocument>
    return (
        typeof document.id === 'string' &&
        typeof document.name === 'string' &&
        typeof document.code === 'string' &&
        typeof document.proglang === 'string'
    )
}

function readLegacyUtilityEditorState(fallbackProglang: string): UtilityEditorState {
    let code = ''
    let proglang = fallbackProglang

    try {
        code = window.localStorage.getItem(UTILITY_EDITOR_CODE_STORAGE_KEY) ?? ''
        proglang = window.localStorage.getItem(UTILITY_EDITOR_PROGLANG_STORAGE_KEY) ?? fallbackProglang
    } catch {
        // Ignore private mode or blocked storage.
    }

    const document = createUtilityEditorDocument('Untitled', proglang, code)
    return { activeId: document.id, documents: [document] }
}

export function readUtilityEditorState(fallbackProglang: string): UtilityEditorState {
    if (typeof window === 'undefined') {
        const document = createUtilityEditorDocument('Untitled', fallbackProglang)
        return { activeId: document.id, documents: [document] }
    }

    try {
        const raw = window.localStorage.getItem(UTILITY_EDITOR_STATE_STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<UtilityEditorState>
            const documents = Array.isArray(parsed.documents) ? parsed.documents.filter(isUtilityEditorDocument) : []
            if (documents.length > 0) {
                const activeId = documents.some((document) => document.id === parsed.activeId)
                    ? parsed.activeId!
                    : documents[0].id
                return { activeId, documents }
            }
        }
    } catch {
        // Fall back to the previous single-buffer storage.
    }

    return readLegacyUtilityEditorState(fallbackProglang)
}

export function writeUtilityEditorState(state: UtilityEditorState): void {
    try {
        window.localStorage.setItem(UTILITY_EDITOR_STATE_STORAGE_KEY, JSON.stringify(state))
    } catch {
        // Ignore quota or private mode errors.
    }
}
