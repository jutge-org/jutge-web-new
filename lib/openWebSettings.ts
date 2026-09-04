import {
    DEFAULT_HLJS_THEME,
    HLJS_THEME_STORAGE_KEY,
    parseHljsThemeSelection,
    type HljsThemeSelection,
} from '@/lib/hljsThemes'
import {
    DEFAULT_DASHBOARD_CARD_SIZE,
    DEFAULT_DASHBOARD_MODULES,
    parseDashboardCardSize,
    parseDashboardModules,
    type DashboardCardSize,
    type DashboardModuleId,
} from '@/lib/dashboardModules'
import type { SuggestionMode } from '@/lib/data/suggestedProblems'
import { parseCourseStatisticsPeriod, serializeCourseStatisticsPeriod } from '@/lib/instructor/courseStatisticsPeriod'
import { DEFAULT_LAYOUT_WIDTH, LAYOUT_WIDTH_STORAGE_KEY, parseLayoutWidth, type LayoutWidth } from '@/lib/layoutWidth'
import {
    DEFAULT_MONACO_THEME,
    MONACO_THEME_STORAGE_KEY,
    parseMonacoThemeSelection,
    type MonacoThemeSelection,
} from '@/lib/monaco/themes'
import {
    parseFontScale,
    SOURCE_CODE_FONT_SCALE_KEY,
    STATEMENT_FONT_SCALE_KEY,
    TESTCASES_FONT_SCALE_KEY,
} from '@/lib/fontScale'
import { createDefaultFontScales, READING_FONT_SCALE_KEYS, type ReadingFontScaleKey } from '@/lib/readingFontScale'
import {
    DEFAULT_REDUCED_MOTION,
    parseReducedMotion,
    REDUCED_MOTION_STORAGE_KEY,
    type ReducedMotionPreference,
} from '@/lib/reducedMotion'
import { emptyRecents, parseRecentsData, type RecentsData } from '@/lib/recents'
import {
    DEFAULT_SOUND_EFFECTS,
    parseSoundEffects,
    SOUND_EFFECTS_STORAGE_KEY,
    type SoundEffectsPreference,
} from '@/lib/soundEffects'
import {
    DEFAULT_CONTEXTUAL_HEADER_GRADIENTS,
    parseContextualHeaderGradients,
    type ContextualHeaderGradientsPreference,
} from '@/lib/contextualHeaderGradients'
import { DEFAULT_STATEMENT_ET_BOOK, parseStatementEtBook, type StatementEtBookPreference } from '@/lib/statementEtBook'

export const OPENWEB_SETTINGS_API_KEY = 'openweb'
export const LOCAL_SETTINGS_STORAGE_KEY = 'settings'
/** Bumped to 2 when the welcome dashboard module was introduced, so existing layouts get it once. */
export const OPENWEB_SETTINGS_VERSION = 2 as const

export type ThemePreference = 'light' | 'dark' | 'system'

export type OpenWebAppearanceSettings = {
    theme: ThemePreference
    layoutWidth: LayoutWidth
    monacoTheme: MonacoThemeSelection
    hljsTheme: HljsThemeSelection
    fontScales: Record<ReadingFontScaleKey, number>
    reducedMotion: ReducedMotionPreference
    soundEffects: SoundEffectsPreference
    contextualHeaderGradients: ContextualHeaderGradientsPreference
    statementEtBook: StatementEtBookPreference
}

export type OpenWebUiSettings = {
    courseListAccordions: Record<string, string[]>
    courseStatisticsPeriod: Record<string, { start: string; end: string }>
    supervisionLastCourse: string
    supervisionLastStudentByCourse: Record<string, string>
    upcomingExamsCollapsed: Record<string, boolean>
}

export type OpenWebDashboardSettings = {
    /** Dashboard modules in display order; removed modules are simply absent. */
    modules: DashboardModuleId[]
    cardSize: DashboardCardSize
    /** Last mode chosen in the suggested-problems widget. */
    suggestionMode: SuggestionMode
}

export type OpenWebSettings = {
    version: typeof OPENWEB_SETTINGS_VERSION
    appearance: OpenWebAppearanceSettings
    ui: OpenWebUiSettings
    dashboard: OpenWebDashboardSettings
    recents: RecentsData
}

const LEGACY_THEME_STORAGE_KEY = 'theme'
const LEGACY_RECENTS_PREFIX = 'jutge-recents:'
const LEGACY_COURSE_LIST_ACCORDION_PREFIX = 'course-list-accordion:'
const LEGACY_COURSE_STATISTICS_PERIOD_PREFIX = 'instructor-course-statistics-period:'
const LEGACY_SUPERVISION_COURSE_PREFIX = 'jutge-supervision-course:'
const LEGACY_SUPERVISION_STUDENT_PREFIX = 'jutge-supervision-student:'

export function createDefaultOpenWebSettings(): OpenWebSettings {
    return {
        version: OPENWEB_SETTINGS_VERSION,
        appearance: {
            theme: 'system',
            layoutWidth: DEFAULT_LAYOUT_WIDTH,
            monacoTheme: DEFAULT_MONACO_THEME,
            hljsTheme: DEFAULT_HLJS_THEME,
            fontScales: createDefaultFontScales(),
            reducedMotion: DEFAULT_REDUCED_MOTION,
            soundEffects: DEFAULT_SOUND_EFFECTS,
            contextualHeaderGradients: DEFAULT_CONTEXTUAL_HEADER_GRADIENTS,
            statementEtBook: DEFAULT_STATEMENT_ET_BOOK,
        },
        ui: {
            courseListAccordions: {},
            courseStatisticsPeriod: {},
            supervisionLastCourse: '',
            supervisionLastStudentByCourse: {},
            upcomingExamsCollapsed: {},
        },
        dashboard: {
            modules: [...DEFAULT_DASHBOARD_MODULES],
            cardSize: DEFAULT_DASHBOARD_CARD_SIZE,
            suggestionMode: 'continue',
        },
        recents: emptyRecents(),
    }
}

function parseSuggestionMode(value: unknown): SuggestionMode {
    return value === 'retry' || value === 'random' ? value : 'continue'
}

function parseThemePreference(value: unknown): ThemePreference {
    if (value === 'light' || value === 'dark' || value === 'system') {
        return value
    }

    return 'system'
}

function parseFontScales(value: unknown): Record<ReadingFontScaleKey, number> {
    const defaults = createDefaultFontScales()
    if (typeof value !== 'object' || value === null) {
        return defaults
    }

    for (const key of READING_FONT_SCALE_KEYS) {
        const raw = (value as Record<string, unknown>)[key]
        if (typeof raw === 'number' && Number.isFinite(raw)) {
            defaults[key] = parseFontScale(String(raw)) ?? defaults[key]
        }
    }

    return defaults
}

function parseCourseListAccordions(value: unknown): Record<string, string[]> {
    if (typeof value !== 'object' || value === null) {
        return {}
    }

    const result: Record<string, string[]> = {}
    for (const [courseKey, items] of Object.entries(value)) {
        if (!Array.isArray(items)) {
            continue
        }

        const filtered = items.filter((item): item is string => typeof item === 'string')
        result[courseKey] = filtered
    }

    return result
}

function parseCourseStatisticsPeriodMap(value: unknown): Record<string, { start: string; end: string }> {
    if (typeof value !== 'object' || value === null) {
        return {}
    }

    const result: Record<string, { start: string; end: string }> = {}
    for (const [courseKey, period] of Object.entries(value)) {
        if (typeof period !== 'object' || period === null) {
            continue
        }

        const start = (period as { start?: unknown }).start
        const end = (period as { end?: unknown }).end
        if (typeof start === 'string' && typeof end === 'string') {
            result[courseKey] = { start, end }
        }
    }

    return result
}

function parseUpcomingExamsCollapsed(value: unknown): Record<string, boolean> {
    if (typeof value !== 'object' || value === null) {
        return {}
    }

    const result: Record<string, boolean> = {}
    for (const [examKey, collapsed] of Object.entries(value)) {
        if (typeof collapsed === 'boolean' && examKey) {
            result[examKey] = collapsed
        }
    }

    return result
}

function parseSupervisionLastStudentByCourse(value: unknown): Record<string, string> {
    if (typeof value !== 'object' || value === null) {
        return {}
    }

    const result: Record<string, string> = {}
    for (const [courseKey, email] of Object.entries(value)) {
        if (typeof email === 'string' && email.trim()) {
            result[courseKey] = email.trim()
        }
    }

    return result
}

export function parseOpenWebSettings(raw: unknown): OpenWebSettings {
    const defaults = createDefaultOpenWebSettings()
    if (typeof raw !== 'object' || raw === null) {
        return defaults
    }

    const parsed = raw as Partial<OpenWebSettings>
    const appearance = parsed.appearance
    const ui = parsed.ui
    const rawVersion = typeof parsed.version === 'number' ? parsed.version : 0
    let modules = parseDashboardModules(parsed.dashboard?.modules)
    // Settings saved before v2 never listed `welcome`; prepend it once so existing users see it
    // until they dismiss it (which persists a v2 layout without the module).
    if (rawVersion < 2 && !modules.includes('welcome')) {
        modules = ['welcome', ...modules]
    }

    return {
        version: OPENWEB_SETTINGS_VERSION,
        appearance: {
            theme: parseThemePreference(appearance?.theme ?? defaults.appearance.theme),
            layoutWidth: parseLayoutWidth(String(appearance?.layoutWidth ?? '')) ?? defaults.appearance.layoutWidth,
            monacoTheme:
                parseMonacoThemeSelection(String(appearance?.monacoTheme ?? '')) ?? defaults.appearance.monacoTheme,
            hljsTheme: parseHljsThemeSelection(String(appearance?.hljsTheme ?? '')) ?? defaults.appearance.hljsTheme,
            fontScales: parseFontScales(appearance?.fontScales),
            reducedMotion:
                parseReducedMotion(String(appearance?.reducedMotion ?? '')) ?? defaults.appearance.reducedMotion,
            soundEffects: parseSoundEffects(String(appearance?.soundEffects ?? '')) ?? defaults.appearance.soundEffects,
            contextualHeaderGradients:
                parseContextualHeaderGradients(String(appearance?.contextualHeaderGradients ?? '')) ??
                defaults.appearance.contextualHeaderGradients,
            statementEtBook:
                parseStatementEtBook(String(appearance?.statementEtBook ?? '')) ?? defaults.appearance.statementEtBook,
        },
        ui: {
            courseListAccordions: parseCourseListAccordions(ui?.courseListAccordions),
            courseStatisticsPeriod: parseCourseStatisticsPeriodMap(ui?.courseStatisticsPeriod),
            supervisionLastCourse:
                typeof ui?.supervisionLastCourse === 'string'
                    ? ui.supervisionLastCourse
                    : defaults.ui.supervisionLastCourse,
            supervisionLastStudentByCourse: parseSupervisionLastStudentByCourse(ui?.supervisionLastStudentByCourse),
            upcomingExamsCollapsed: parseUpcomingExamsCollapsed(ui?.upcomingExamsCollapsed),
        },
        dashboard: {
            modules,
            cardSize: parseDashboardCardSize(parsed.dashboard?.cardSize),
            suggestionMode: parseSuggestionMode(parsed.dashboard?.suggestionMode),
        },
        recents: parseRecentsData(JSON.stringify(parsed.recents ?? defaults.recents)),
    }
}

export function parseOpenWebSettingsJson(raw: string | null): OpenWebSettings {
    if (!raw) {
        return createDefaultOpenWebSettings()
    }

    try {
        return parseOpenWebSettings(JSON.parse(raw))
    } catch {
        return createDefaultOpenWebSettings()
    }
}

export function serializeOpenWebSettings(settings: OpenWebSettings): string {
    return JSON.stringify(settings)
}

function readLegacyAppearanceSettings(): OpenWebAppearanceSettings {
    const defaults = createDefaultOpenWebSettings().appearance
    if (typeof window === 'undefined') {
        return defaults
    }

    const fontScales = createDefaultFontScales()
    for (const key of READING_FONT_SCALE_KEYS) {
        const stored = parseFontScale(localStorage.getItem(key))
        if (stored !== null) {
            fontScales[key] = stored
        }
    }

    return {
        theme: parseThemePreference(localStorage.getItem(LEGACY_THEME_STORAGE_KEY)),
        layoutWidth: parseLayoutWidth(localStorage.getItem(LAYOUT_WIDTH_STORAGE_KEY)) ?? defaults.layoutWidth,
        monacoTheme: parseMonacoThemeSelection(localStorage.getItem(MONACO_THEME_STORAGE_KEY)) ?? defaults.monacoTheme,
        hljsTheme: parseHljsThemeSelection(localStorage.getItem(HLJS_THEME_STORAGE_KEY)) ?? defaults.hljsTheme,
        fontScales,
        reducedMotion: parseReducedMotion(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)) ?? defaults.reducedMotion,
        soundEffects: parseSoundEffects(localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY)) ?? defaults.soundEffects,
        contextualHeaderGradients: defaults.contextualHeaderGradients,
        statementEtBook: defaults.statementEtBook,
    }
}

function readLegacyUiSettings(): OpenWebUiSettings {
    const ui = createDefaultOpenWebSettings().ui
    if (typeof window === 'undefined') {
        return ui
    }

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (!key) {
            continue
        }

        if (key.startsWith(LEGACY_COURSE_LIST_ACCORDION_PREFIX)) {
            const courseKey = key.slice(LEGACY_COURSE_LIST_ACCORDION_PREFIX.length)
            try {
                const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '')
                if (Array.isArray(parsed)) {
                    ui.courseListAccordions[courseKey] = parsed.filter(
                        (item): item is string => typeof item === 'string',
                    )
                }
            } catch {
                // ignore invalid legacy value
            }
            continue
        }

        if (key.startsWith(LEGACY_COURSE_STATISTICS_PERIOD_PREFIX)) {
            const courseKey = key.slice(LEGACY_COURSE_STATISTICS_PERIOD_PREFIX.length)
            const period = parseCourseStatisticsPeriod(localStorage.getItem(key), {
                startDate: new Date(),
                endDate: new Date(),
            })
            ui.courseStatisticsPeriod[courseKey] = JSON.parse(serializeCourseStatisticsPeriod(period))
            continue
        }

        if (key.startsWith(LEGACY_SUPERVISION_COURSE_PREFIX)) {
            const courseKey = localStorage.getItem(key)?.trim()
            if (courseKey) {
                ui.supervisionLastCourse = courseKey
            }
            continue
        }

        if (key.startsWith(LEGACY_SUPERVISION_STUDENT_PREFIX)) {
            const suffix = key.slice(LEGACY_SUPERVISION_STUDENT_PREFIX.length)
            const separatorIndex = suffix.indexOf(':')
            if (separatorIndex === -1) {
                continue
            }

            const courseKey = suffix.slice(separatorIndex + 1)
            const email = localStorage.getItem(key)?.trim()
            if (courseKey && email) {
                ui.supervisionLastStudentByCourse[courseKey] = email
            }
        }
    }

    return ui
}

function readLegacyRecentsSettings(): RecentsData {
    if (typeof window === 'undefined') {
        return emptyRecents()
    }

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (key?.startsWith(LEGACY_RECENTS_PREFIX)) {
            return parseRecentsData(localStorage.getItem(key))
        }
    }

    return emptyRecents()
}

export function migrateLegacyLocalStorageSettings(): OpenWebSettings {
    return {
        version: OPENWEB_SETTINGS_VERSION,
        appearance: readLegacyAppearanceSettings(),
        ui: readLegacyUiSettings(),
        dashboard: {
            modules: [...DEFAULT_DASHBOARD_MODULES],
            cardSize: DEFAULT_DASHBOARD_CARD_SIZE,
            suggestionMode: 'continue',
        },
        recents: readLegacyRecentsSettings(),
    }
}

export function readLocalOpenWebSettings(): OpenWebSettings {
    if (typeof window === 'undefined') {
        return createDefaultOpenWebSettings()
    }

    const stored = localStorage.getItem(LOCAL_SETTINGS_STORAGE_KEY)
    if (stored) {
        return parseOpenWebSettingsJson(stored)
    }

    return migrateLegacyLocalStorageSettings()
}

export function writeLocalOpenWebSettings(settings: OpenWebSettings): void {
    if (typeof window === 'undefined') {
        return
    }

    localStorage.setItem(LOCAL_SETTINGS_STORAGE_KEY, serializeOpenWebSettings(settings))
}

export function clearLocalOpenWebSettings(): void {
    if (typeof window === 'undefined') {
        return
    }

    localStorage.removeItem(LOCAL_SETTINGS_STORAGE_KEY)
}

export function clearLegacySettingsStorage(): void {
    if (typeof window === 'undefined') {
        return
    }

    const keysToRemove: string[] = [
        LEGACY_THEME_STORAGE_KEY,
        LAYOUT_WIDTH_STORAGE_KEY,
        MONACO_THEME_STORAGE_KEY,
        HLJS_THEME_STORAGE_KEY,
        SOUND_EFFECTS_STORAGE_KEY,
        REDUCED_MOTION_STORAGE_KEY,
        STATEMENT_FONT_SCALE_KEY,
        TESTCASES_FONT_SCALE_KEY,
        SOURCE_CODE_FONT_SCALE_KEY,
    ]

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (!key) {
            continue
        }

        if (
            key.startsWith(LEGACY_RECENTS_PREFIX) ||
            key.startsWith(LEGACY_COURSE_LIST_ACCORDION_PREFIX) ||
            key.startsWith(LEGACY_COURSE_STATISTICS_PERIOD_PREFIX) ||
            key.startsWith(LEGACY_SUPERVISION_COURSE_PREFIX) ||
            key.startsWith(LEGACY_SUPERVISION_STUDENT_PREFIX)
        ) {
            keysToRemove.push(key)
        }
    }

    for (const key of keysToRemove) {
        localStorage.removeItem(key)
    }
}
