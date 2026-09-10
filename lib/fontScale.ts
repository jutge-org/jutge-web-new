export const DEFAULT_FONT_SCALE = 1.3
export const MIN_FONT_SCALE = 1
export const MAX_FONT_SCALE = 1.8
export const FONT_SCALE_STEP = 0.1

export const STATEMENT_FONT_SCALE_KEY = 'jutge-statement-font-scale'
export const TESTCASES_FONT_SCALE_KEY = 'jutge-testcases-font-scale'
export const SOURCE_CODE_FONT_SCALE_KEY = 'jutge-source-code-font-scale'

export function parseFontScale(value: string | null): number | null {
    if (!value) {
        return null
    }

    const parsed = Number.parseFloat(value)
    if (!Number.isFinite(parsed)) {
        return null
    }

    return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, parsed))
}
