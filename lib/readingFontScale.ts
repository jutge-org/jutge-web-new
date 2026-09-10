import {
    DEFAULT_FONT_SCALE,
    SOURCE_CODE_FONT_SCALE_KEY,
    STATEMENT_FONT_SCALE_KEY,
    TESTCASES_FONT_SCALE_KEY,
} from '@/lib/fontScale'

export const READING_FONT_SCALE_KEYS = [
    STATEMENT_FONT_SCALE_KEY,
    TESTCASES_FONT_SCALE_KEY,
    SOURCE_CODE_FONT_SCALE_KEY,
] as const

export type ReadingFontScaleKey = (typeof READING_FONT_SCALE_KEYS)[number]

export const READING_FONT_SCALE_PRESETS = [
    { value: '1', label: 'Small', scale: 1 },
    { value: '1.15', label: 'Default', scale: 1.15 },
    { value: '1.45', label: 'Large', scale: 1.45 },
    { value: '1.8', label: 'Extra large', scale: 1.8 },
] as const

export type ReadingFontScalePresetValue = (typeof READING_FONT_SCALE_PRESETS)[number]['value']

export function readingFontScalePresetFromScales(scales: Record<ReadingFontScaleKey, number>): string | undefined {
    const values = READING_FONT_SCALE_KEYS.map((key) => scales[key])
    const first = values[0]

    if (!values.every((value) => value === first)) {
        return undefined
    }

    const preset = READING_FONT_SCALE_PRESETS.find((option) => option.scale === first)
    return preset?.value
}

export function createDefaultFontScales(): Record<ReadingFontScaleKey, number> {
    return {
        [STATEMENT_FONT_SCALE_KEY]: DEFAULT_FONT_SCALE,
        [TESTCASES_FONT_SCALE_KEY]: DEFAULT_FONT_SCALE,
        [SOURCE_CODE_FONT_SCALE_KEY]: DEFAULT_FONT_SCALE,
    }
}
