/**
 * Historical note:
 * - Legacy values were stored as `on` (ET Book) / `off` (default sans-serif).
 * - Options: Default (sans), Source Serif 4, ET Book, Times New Roman, Palatino (system fonts).
 */

export const STATEMENT_FONT_DEFAULT = 'default' as const
export const STATEMENT_FONT_SOURCE_SERIF_4 = 'source-serif-4' as const
export const STATEMENT_FONT_ET_BOOK = 'et-book' as const
export const STATEMENT_FONT_TIMES_NEW_ROMAN = 'times-new-roman' as const
export const STATEMENT_FONT_PALATINO = 'palatino' as const

// Legacy persisted values.
const STATEMENT_ET_BOOK_ON = 'on' as const
const STATEMENT_ET_BOOK_OFF = 'off' as const

export const STATEMENT_FONT_OPTIONS = [
    STATEMENT_FONT_DEFAULT,
    STATEMENT_FONT_SOURCE_SERIF_4,
    STATEMENT_FONT_ET_BOOK,
    STATEMENT_FONT_TIMES_NEW_ROMAN,
    STATEMENT_FONT_PALATINO,
] as const

export type StatementEtBookPreference = (typeof STATEMENT_FONT_OPTIONS)[number]

export const STATEMENT_FONT_LABELS: Record<StatementEtBookPreference, string> = {
    [STATEMENT_FONT_DEFAULT]: 'Default',
    [STATEMENT_FONT_SOURCE_SERIF_4]: 'Source Serif 4',
    [STATEMENT_FONT_ET_BOOK]: 'ET Book',
    [STATEMENT_FONT_TIMES_NEW_ROMAN]: 'Times New Roman',
    [STATEMENT_FONT_PALATINO]: 'Palatino',
}

// Preserve existing default behavior: previously ET Book was the default.
export const DEFAULT_STATEMENT_ET_BOOK: StatementEtBookPreference = STATEMENT_FONT_ET_BOOK

export function parseStatementEtBook(value: string | null): StatementEtBookPreference | null {
    if (!value) {
        return null
    }

    // Legacy mappings.
    if (value === STATEMENT_ET_BOOK_ON) {
        return STATEMENT_FONT_ET_BOOK
    }
    if (value === STATEMENT_ET_BOOK_OFF) {
        return STATEMENT_FONT_DEFAULT
    }

    if ((STATEMENT_FONT_OPTIONS as readonly string[]).includes(value)) {
        return value as StatementEtBookPreference
    }

    return null
}
