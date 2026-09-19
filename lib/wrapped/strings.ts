import en from './en.json'

type Dict = Record<string, unknown>

function lookup(path: string): unknown {
    const parts = path.split('.')
    let cur: unknown = en
    for (const part of parts) {
        if (cur == null || typeof cur !== 'object') return undefined
        cur = (cur as Dict)[part]
    }
    return cur
}

function interpolate(template: string, params?: Record<string, string | number | undefined>): string {
    if (!params) return template
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
        const value = params[key]
        return value == null ? '' : String(value)
    })
}

/**
 * Lightweight English string lookup (replaces i18next for the wrapped feature).
 * Supports nested keys, `{{param}}` interpolation, and `_one` / `_other` plurals.
 */
export function t(key: string, params?: Record<string, string | number | undefined> & { defaultValue?: string }): string {
    const count = params?.count
    if (typeof count === 'number') {
        const pluralKey = count === 1 ? `${key}_one` : `${key}_other`
        const plural = lookup(pluralKey)
        if (typeof plural === 'string') return interpolate(plural, params)
    }

    const value = lookup(key)
    if (typeof value === 'string') return interpolate(value, params)
    if (params?.defaultValue != null) return String(params.defaultValue)
    return key
}

export function formatSubmissions(count: number): string {
    return t('submission', { count })
}

export function formatDays(count: number): string {
    return t('day', { count })
}

export function formatHours(count: number): string {
    return t('hour', { count })
}

export function formatMinutes(count: number): string {
    return t('minute', { count })
}
