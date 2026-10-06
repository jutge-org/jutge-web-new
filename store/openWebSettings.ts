import dayjs from 'dayjs'
import { create } from 'zustand'

import type { DashboardCardSize, DashboardModuleId } from '@/lib/dashboardModules'
import type { SuggestionMode } from '@/lib/data/suggestedProblems'
import {
    parseCourseStatisticsPeriod,
    serializeCourseStatisticsPeriod,
    type CourseStatisticsPeriod,
} from '@/lib/instructor/courseStatisticsPeriod'
import { DEFAULT_LAYOUT_WIDTH, type LayoutWidth } from '@/lib/layoutWidth'
import type { MonacoThemeSelection } from '@/lib/monaco/themes'
import type { HljsThemeSelection } from '@/lib/hljsThemes'
import { createDefaultOpenWebSettings, type OpenWebSettings, type ThemePreference } from '@/lib/openWebSettings'
import { createDefaultFontScales, READING_FONT_SCALE_KEYS, type ReadingFontScaleKey } from '@/lib/readingFontScale'
import {
    clearAllRecents,
    clearRecentCourses,
    clearRecentProblems,
    clearRecentSubmissions,
    type RecentsData,
} from '@/lib/recents'
import type { ReducedMotionPreference } from '@/lib/reducedMotion'
import type { SoundEffectsPreference } from '@/lib/soundEffects'
import type { ContextualHeaderGradientsPreference } from '@/lib/contextualHeaderGradients'
import type { StatementEtBookPreference } from '@/lib/statementEtBook'

type HydrateOptions = {
    dirty?: boolean
}

type OpenWebSettingsStore = {
    settings: OpenWebSettings
    ready: boolean
    dirty: boolean
    hydrate: (settings: OpenWebSettings, options?: HydrateOptions) => void
    reset: () => void
    markDirty: () => void
    setTheme: (theme: ThemePreference) => void
    setLayoutWidth: (layoutWidth: LayoutWidth) => void
    setMonacoTheme: (theme: MonacoThemeSelection) => void
    setHljsTheme: (theme: HljsThemeSelection) => void
    setFontScale: (storageKey: ReadingFontScaleKey, updater: number | ((prev: number) => number)) => void
    setReadingFontScalePreset: (scale: number) => void
    setReducedMotion: (preference: ReducedMotionPreference) => void
    setSoundEffects: (preference: SoundEffectsPreference) => void
    setContextualHeaderGradients: (preference: ContextualHeaderGradientsPreference) => void
    setStatementEtBook: (preference: StatementEtBookPreference) => void
    resetAppearanceDefaults: () => void
    setDashboardModules: (modules: DashboardModuleId[]) => void
    setDashboardCardSize: (cardSize: DashboardCardSize) => void
    setDashboardSuggestionMode: (suggestionMode: SuggestionMode) => void
    setCourseListAccordionOpenItems: (courseKey: string, openItems: string[]) => void
    setCourseStatisticsPeriod: (courseKey: string, period: CourseStatisticsPeriod) => void
    getCourseStatisticsPeriod: (courseKey: string, fallback: CourseStatisticsPeriod) => CourseStatisticsPeriod
    setSupervisionLastCourse: (courseKey: string) => void
    setSupervisionLastStudent: (courseKey: string, email: string) => void
    setUpcomingExamCollapsed: (examKey: string, collapsed: boolean) => void
    setShowHeaderSearch: (show: boolean) => void
    setShowHomeGithubCorner: (show: boolean) => void
    getSupervisionLastCourse: () => string
    getSupervisionLastStudent: (courseKey: string) => string
    setRecents: (updater: RecentsData | ((prev: RecentsData) => RecentsData)) => void
    clearRecentCourses: () => void
    clearRecentProblems: () => void
    clearRecentSubmissions: () => void
    clearAllRecents: () => void
}

function patchSettings(
    current: OpenWebSettings,
    patch: (settings: OpenWebSettings) => OpenWebSettings,
): OpenWebSettings {
    return patch(current)
}

export const useOpenWebSettingsStore = create<OpenWebSettingsStore>((set, get) => ({
    settings: createDefaultOpenWebSettings(),
    ready: false,
    dirty: false,

    hydrate: (settings, options) => {
        set({
            settings,
            ready: true,
            dirty: options?.dirty ?? false,
        })
    },

    reset: () => {
        set({
            settings: createDefaultOpenWebSettings(),
            ready: true,
            dirty: false,
        })
    },

    markDirty: () => {
        set({ dirty: true })
    },

    setTheme: (theme) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: { ...settings.appearance, theme },
            })),
            dirty: true,
        }))
    },

    setLayoutWidth: (layoutWidth) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: { ...settings.appearance, layoutWidth },
            })),
            dirty: true,
        }))
    },

    setMonacoTheme: (theme) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: { ...settings.appearance, monacoTheme: theme },
            })),
            dirty: true,
        }))
    },

    setHljsTheme: (theme) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: { ...settings.appearance, hljsTheme: theme },
            })),
            dirty: true,
        }))
    },

    setFontScale: (storageKey, updater) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => {
                const current = settings.appearance.fontScales[storageKey]
                const nextValue = typeof updater === 'function' ? updater(current) : updater
                return {
                    ...settings,
                    appearance: {
                        ...settings.appearance,
                        fontScales: {
                            ...settings.appearance.fontScales,
                            [storageKey]: nextValue,
                        },
                    },
                }
            }),
            dirty: true,
        }))
    },

    setReadingFontScalePreset: (scale) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => {
                const fontScales = createDefaultFontScales()
                for (const key of READING_FONT_SCALE_KEYS) {
                    fontScales[key] = scale
                }

                return {
                    ...settings,
                    appearance: {
                        ...settings.appearance,
                        fontScales,
                    },
                }
            }),
            dirty: true,
        }))
    },

    setReducedMotion: (preference) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: { ...settings.appearance, reducedMotion: preference },
            })),
            dirty: true,
        }))
    },

    setSoundEffects: (preference) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: { ...settings.appearance, soundEffects: preference },
            })),
            dirty: true,
        }))
    },

    setContextualHeaderGradients: (preference) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: { ...settings.appearance, contextualHeaderGradients: preference },
            })),
            dirty: true,
        }))
    },

    setStatementEtBook: (preference) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: { ...settings.appearance, statementEtBook: preference },
            })),
            dirty: true,
        }))
    },

    resetAppearanceDefaults: () => {
        const defaults = createDefaultOpenWebSettings().appearance
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                appearance: {
                    ...defaults,
                    layoutWidth: DEFAULT_LAYOUT_WIDTH,
                },
            })),
            dirty: true,
        }))
    },

    setDashboardModules: (modules) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                dashboard: { ...settings.dashboard, modules },
            })),
            dirty: true,
        }))
    },

    setDashboardCardSize: (cardSize) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                dashboard: { ...settings.dashboard, cardSize },
            })),
            dirty: true,
        }))
    },

    setDashboardSuggestionMode: (suggestionMode) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                dashboard: { ...settings.dashboard, suggestionMode },
            })),
            dirty: true,
        }))
    },

    setCourseListAccordionOpenItems: (courseKey, openItems) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                ui: {
                    ...settings.ui,
                    courseListAccordions: {
                        ...settings.ui.courseListAccordions,
                        [courseKey]: openItems,
                    },
                },
            })),
            dirty: true,
        }))
    },

    setCourseStatisticsPeriod: (courseKey, period) => {
        const serialized = JSON.parse(serializeCourseStatisticsPeriod(period)) as { start: string; end: string }
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                ui: {
                    ...settings.ui,
                    courseStatisticsPeriod: {
                        ...settings.ui.courseStatisticsPeriod,
                        [courseKey]: serialized,
                    },
                },
            })),
            dirty: true,
        }))
    },

    getCourseStatisticsPeriod: (courseKey, fallback) => {
        const stored = get().settings.ui.courseStatisticsPeriod[courseKey]
        if (!stored) {
            return fallback
        }

        return parseCourseStatisticsPeriod(JSON.stringify(stored), fallback)
    },

    setSupervisionLastCourse: (courseKey) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                ui: {
                    ...settings.ui,
                    supervisionLastCourse: courseKey,
                },
            })),
            dirty: true,
        }))
    },

    setSupervisionLastStudent: (courseKey, email) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                ui: {
                    ...settings.ui,
                    supervisionLastStudentByCourse: email
                        ? {
                              ...settings.ui.supervisionLastStudentByCourse,
                              [courseKey]: email,
                          }
                        : Object.fromEntries(
                              Object.entries(settings.ui.supervisionLastStudentByCourse).filter(
                                  ([key]) => key !== courseKey,
                              ),
                          ),
                },
            })),
            dirty: true,
        }))
    },

    setUpcomingExamCollapsed: (examKey, collapsed) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                ui: {
                    ...settings.ui,
                    // Keep only collapsed exams in the map so it never grows with stale keys.
                    upcomingExamsCollapsed: collapsed
                        ? { ...settings.ui.upcomingExamsCollapsed, [examKey]: true }
                        : Object.fromEntries(
                              Object.entries(settings.ui.upcomingExamsCollapsed).filter(([key]) => key !== examKey),
                          ),
                },
            })),
            dirty: true,
        }))
    },

    setShowHeaderSearch: (show) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                ui: { ...settings.ui, showHeaderSearch: show },
            })),
            dirty: true,
        }))
    },

    setShowHomeGithubCorner: (show) => {
        set((state) => ({
            settings: patchSettings(state.settings, (settings) => ({
                ...settings,
                ui: { ...settings.ui, showHomeGithubCorner: show },
            })),
            dirty: true,
        }))
    },

    getSupervisionLastCourse: () => get().settings.ui.supervisionLastCourse,

    getSupervisionLastStudent: (courseKey) => get().settings.ui.supervisionLastStudentByCourse[courseKey] ?? '',

    setRecents: (updater) => {
        set((state) => {
            const nextRecents = typeof updater === 'function' ? updater(state.settings.recents) : updater
            if (nextRecents === state.settings.recents) {
                return state
            }

            return {
                settings: {
                    ...state.settings,
                    recents: nextRecents,
                },
                dirty: true,
            }
        })
    },

    clearRecentCourses: () => {
        get().setRecents((recents) => clearRecentCourses(recents))
    },

    clearRecentProblems: () => {
        get().setRecents((recents) => clearRecentProblems(recents))
    },

    clearRecentSubmissions: () => {
        get().setRecents((recents) => clearRecentSubmissions(recents))
    },

    clearAllRecents: () => {
        get().setRecents(() => clearAllRecents())
    },
}))

export function useOpenWebSettingsReady() {
    return useOpenWebSettingsStore((state) => state.ready)
}

export function useOpenWebAppearance() {
    return useOpenWebSettingsStore((state) => state.settings.appearance)
}

export function useOpenWebRecents() {
    return useOpenWebSettingsStore((state) => state.settings.recents)
}

export function useOpenWebDashboardModules() {
    return useOpenWebSettingsStore((state) => state.settings.dashboard.modules)
}

export function useOpenWebDashboardCardSize() {
    return useOpenWebSettingsStore((state) => state.settings.dashboard.cardSize)
}

export function useOpenWebDashboardSuggestionMode() {
    return useOpenWebSettingsStore((state) => state.settings.dashboard.suggestionMode)
}

export function useOpenWebLayoutWidth() {
    return useOpenWebSettingsStore((state) => state.settings.appearance.layoutWidth)
}

export function useOpenWebTheme() {
    return useOpenWebSettingsStore((state) => state.settings.appearance.theme)
}

export function useOpenWebShowHeaderSearch() {
    return useOpenWebSettingsStore((state) => state.settings.ui.showHeaderSearch)
}

export function useOpenWebShowHomeGithubCorner() {
    return useOpenWebSettingsStore((state) => state.settings.ui.showHomeGithubCorner)
}

export function courseStatisticsPeriodFromSettings(
    stored: { start: string; end: string } | undefined,
    fallback: CourseStatisticsPeriod,
): CourseStatisticsPeriod {
    if (!stored) {
        return fallback
    }

    const parsed = parseCourseStatisticsPeriod(JSON.stringify(stored), fallback)
    if (!dayjs(parsed.startDate).isValid() || !dayjs(parsed.endDate).isValid()) {
        return fallback
    }

    return parsed
}
