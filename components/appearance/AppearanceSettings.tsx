'use client'

import { HljsThemeSelect } from '@/components/appearance/HljsThemeSelect'
import { MonacoThemeSelect } from '@/components/appearance/MonacoThemeSelect'
import { useAppearancePreferences, useAppearanceThemePreference } from '@/components/AppearancePreferencesProvider'
import { useAuth } from '@/components/AuthProvider'
import { useLayoutWidth } from '@/components/layout/LayoutWidthProvider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { LAYOUT_WIDTH_CONSTRAINED, LAYOUT_WIDTH_FULL, LAYOUT_WIDTH_WIDE, type LayoutWidth } from '@/lib/layoutWidth'
import { READING_FONT_SCALE_PRESETS, readingFontScalePresetFromScales } from '@/lib/readingFontScale'
import { REDUCED_MOTION_FULL, REDUCED_MOTION_REDUCE, REDUCED_MOTION_SYSTEM } from '@/lib/reducedMotion'
import { SOUND_EFFECTS_OFF, SOUND_EFFECTS_ON, type SoundEffectsPreference } from '@/lib/soundEffects'
import {
    CONTEXTUAL_HEADER_GRADIENTS_OFF,
    CONTEXTUAL_HEADER_GRADIENTS_ON,
    type ContextualHeaderGradientsPreference,
} from '@/lib/contextualHeaderGradients'
import {
    STATEMENT_FONT_DEFAULT,
    STATEMENT_FONT_ET_BOOK,
    STATEMENT_FONT_SOURCE_SERIF_4,
    STATEMENT_FONT_PALATINO,
    STATEMENT_FONT_TIMES_NEW_ROMAN,
    type StatementEtBookPreference,
} from '@/lib/statementEtBook'
import type { DashboardCardSize } from '@/lib/dashboardModules'
import type { ThemePreference } from '@/lib/openWebSettings'
import { cn } from '@/lib/utils'
import { useDashboardCustomizationStore } from '@/store/dashboardCustomization'
import { useOpenWebDashboardCardSize, useOpenWebSettingsStore } from '@/store/openWebSettings'
import {
    AccessibilityIcon,
    AArrowDownIcon,
    AArrowUpIcon,
    ALargeSmallIcon,
    AudioLinesIcon,
    BlendIcon,
    CodeIcon,
    LayoutDashboardIcon,
    LayoutTemplateIcon,
    MonitorIcon,
    MoonIcon,
    RectangleHorizontalIcon,
    RotateCcwIcon,
    ScanTextIcon,
    SquareIcon,
    StretchHorizontalIcon,
    SunIcon,
    SunMoonIcon,
    TypeIcon,
    Volume2Icon,
    VolumeXIcon,
    ZapIcon,
    type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type ReactNode } from 'react'
import { toast } from 'sonner'

/**
 * The settings panel is one scrolling list of sections grouped into categories. Hosts (the
 * settings dialog) can show a category nav that jumps to a section via its DOM id.
 */

export type SettingsCategoryId = 'theme' | 'layout' | 'reading' | 'code' | 'feedback' | 'dashboard'

export type SettingsCategory = {
    id: SettingsCategoryId
    label: string
    icon: LucideIcon
    /** Categories that only make sense for signed-in users are hidden for guests. */
    requiresAuth?: boolean
}

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
    { id: 'theme', label: 'Theme & colors', icon: SunMoonIcon },
    { id: 'layout', label: 'Layout', icon: LayoutTemplateIcon },
    { id: 'reading', label: 'Reading & text', icon: TypeIcon },
    { id: 'code', label: 'Code', icon: CodeIcon },
    { id: 'feedback', label: 'Motion & sound', icon: AudioLinesIcon },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, requiresAuth: true },
]

export function settingsSectionDomId(id: SettingsCategoryId): string {
    return `settings-section-${id}`
}

type SettingsCategorySectionProps = {
    category: SettingsCategory
    children: ReactNode
}

function SettingsCategorySection({ category, children }: SettingsCategorySectionProps) {
    const domId = settingsSectionDomId(category.id)
    const CategoryIcon = category.icon

    return (
        <section id={domId} aria-labelledby={`${domId}-heading`} className="scroll-mt-2 space-y-6">
            <h3
                id={`${domId}-heading`}
                className="flex items-center gap-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
                <CategoryIcon className="size-3.5" aria-hidden />
                {category.label}
            </h3>
            {children}
        </section>
    )
}

type SettingSectionProps = {
    title: string
    description: string
    children: ReactNode
}

function SettingSection({ title, description, children }: SettingSectionProps) {
    return (
        <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{title}</legend>
            <p className="text-sm text-muted-foreground">{description}</p>
            {children}
        </fieldset>
    )
}

type SegmentedOptionProps = {
    value: string
    label: string
    icon: ReactNode
    className?: string
}

const READING_FONT_SCALE_ICONS: Record<string, ReactNode> = {
    '0.85': <AArrowDownIcon className="size-4" aria-hidden />,
    '1': <ALargeSmallIcon className="size-4" aria-hidden />,
    '1.25': <AArrowUpIcon className="size-4" aria-hidden />,
    '1.5': <ScanTextIcon className="size-4" aria-hidden />,
}

function readingFontScalePresetIcon(value: string) {
    return READING_FONT_SCALE_ICONS[value] ?? <ALargeSmallIcon className="size-4" aria-hidden />
}

function SegmentedOption({ value, label, icon, className }: SegmentedOptionProps) {
    return (
        <ToggleGroupItem
            value={value}
            aria-label={label}
            className={cn(
                'flex h-auto min-h-16 flex-col items-center justify-center gap-1.5 px-2 py-3 text-xs font-normal',
                className,
            )}
        >
            {icon}
            <span>{label}</span>
        </ToggleGroupItem>
    )
}

function categoryById(id: SettingsCategoryId): SettingsCategory {
    return SETTINGS_CATEGORIES.find((category) => category.id === id)!
}

type AppearanceSettingsProps = {
    className?: string
    /** Called right before a setting navigates away (e.g. dashboard customization), so the host can close itself. */
    onNavigateAway?: () => void
}

export function AppearanceSettings({ className, onNavigateAway }: AppearanceSettingsProps) {
    const [theme, setTheme] = useAppearanceThemePreference()
    const { layoutWidth, setLayoutWidth } = useLayoutWidth()
    const { user } = useAuth()
    const router = useRouter()
    const startEditing = useDashboardCustomizationStore((state) => state.startEditing)
    const dashboardCardSize = useOpenWebDashboardCardSize()
    const setDashboardCardSize = useOpenWebSettingsStore((state) => state.setDashboardCardSize)
    const {
        monacoTheme,
        setMonacoTheme,
        hljsTheme,
        setHljsTheme,
        fontScales,
        setReadingFontScalePreset,
        reducedMotion,
        setReducedMotion,
        soundEffects,
        setSoundEffects,
        contextualHeaderGradients,
        setContextualHeaderGradients,
        statementEtBook,
        setStatementEtBook,
        resetAppearanceDefaults,
    } = useAppearancePreferences()

    const readingFontScalePreset = readingFontScalePresetFromScales(fontScales)

    function handleResetDefaults() {
        resetAppearanceDefaults()
        toast.success('Appearance settings reset to defaults')
    }

    function handleCustomizeDashboard() {
        onNavigateAway?.()
        startEditing()
        router.push('/')
    }

    return (
        <div className={cn('space-y-8', className)}>
            <SettingsCategorySection category={categoryById('theme')}>
                <SettingSection title="Theme" description="Choose a color theme for the interface.">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={0}
                        value={theme ?? 'system'}
                        onValueChange={(value) => value && setTheme(value as ThemePreference)}
                        className="grid w-full grid-cols-3"
                    >
                        <SegmentedOption
                            value="system"
                            label="System"
                            icon={<MonitorIcon className="size-4" aria-hidden />}
                        />
                        <SegmentedOption
                            value="light"
                            label="Light"
                            icon={<SunIcon className="size-4" aria-hidden />}
                        />
                        <SegmentedOption value="dark" label="Dark" icon={<MoonIcon className="size-4" aria-hidden />} />
                    </ToggleGroup>
                </SettingSection>
                <SettingSection
                    title="Contextual header"
                    description="Tint the header bar on administrator, instructor, and supervision pages."
                >
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={0}
                        value={contextualHeaderGradients}
                        onValueChange={(value) =>
                            value && setContextualHeaderGradients(value as ContextualHeaderGradientsPreference)
                        }
                        className="grid w-full grid-cols-2"
                    >
                        <SegmentedOption
                            value={CONTEXTUAL_HEADER_GRADIENTS_ON}
                            label="On"
                            icon={<BlendIcon className="size-4" aria-hidden />}
                        />
                        <SegmentedOption
                            value={CONTEXTUAL_HEADER_GRADIENTS_OFF}
                            label="Off"
                            icon={<SquareIcon className="size-4" aria-hidden />}
                        />
                    </ToggleGroup>
                </SettingSection>
            </SettingsCategorySection>

            <SettingsCategorySection category={categoryById('layout')}>
                <SettingSection title="Page width" description="Choose how wide the main content area should be.">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={0}
                        value={layoutWidth}
                        onValueChange={(value) => value && setLayoutWidth(value as LayoutWidth)}
                        className="grid w-full grid-cols-3"
                    >
                        <SegmentedOption
                            value={LAYOUT_WIDTH_CONSTRAINED}
                            label="Comfortable"
                            icon={<SquareIcon className="size-4" aria-hidden />}
                        />
                        <SegmentedOption
                            value={LAYOUT_WIDTH_WIDE}
                            label="Wide"
                            icon={<RectangleHorizontalIcon className="size-4" aria-hidden />}
                        />
                        <SegmentedOption
                            value={LAYOUT_WIDTH_FULL}
                            label="Full"
                            icon={<StretchHorizontalIcon className="size-4" aria-hidden />}
                        />
                    </ToggleGroup>
                </SettingSection>
            </SettingsCategorySection>

            <SettingsCategorySection category={categoryById('reading')}>
                <SettingSection
                    title="Reading text size"
                    description="Adjust text size for problem statements, test cases, and source code."
                >
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={0}
                        value={readingFontScalePreset ?? ''}
                        onValueChange={(value) => {
                            if (!value) {
                                return
                            }

                            const preset = READING_FONT_SCALE_PRESETS.find((option) => option.value === value)
                            if (preset) {
                                setReadingFontScalePreset(preset.scale)
                            }
                        }}
                        className="grid w-full grid-cols-4"
                    >
                        {READING_FONT_SCALE_PRESETS.map((preset) => (
                            <SegmentedOption
                                key={preset.value}
                                value={preset.value}
                                label={preset.label}
                                icon={readingFontScalePresetIcon(preset.value)}
                                className="min-h-14"
                            />
                        ))}
                    </ToggleGroup>
                    {!readingFontScalePreset ? (
                        <p className="text-xs text-muted-foreground">
                            Custom sizes are set per page. Choose a preset to apply the same size everywhere.
                        </p>
                    ) : null}
                </SettingSection>
                <SettingSection title="Statement font" description="Choose the font used in problem statements.">
                    <Select
                        value={statementEtBook}
                        onValueChange={(value) => setStatementEtBook(value as StatementEtBookPreference)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Statement font" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={STATEMENT_FONT_DEFAULT}>Default</SelectItem>
                            <SelectItem value={STATEMENT_FONT_SOURCE_SERIF_4}>Source Serif 4</SelectItem>
                            <SelectItem value={STATEMENT_FONT_ET_BOOK}>ET Book</SelectItem>
                            <SelectItem value={STATEMENT_FONT_TIMES_NEW_ROMAN}>Times New Roman</SelectItem>
                            <SelectItem value={STATEMENT_FONT_PALATINO}>Palatino</SelectItem>
                        </SelectContent>
                    </Select>
                </SettingSection>
            </SettingsCategorySection>

            <SettingsCategorySection category={categoryById('code')}>
                <SettingSection title="Code syntax" description="Choose themes for highlighted and editable code.">
                    <div className="space-y-4">
                        <HljsThemeSelect id="appearance-hljs-theme" value={hljsTheme} onValueChange={setHljsTheme} />
                        <MonacoThemeSelect
                            id="appearance-monaco-theme"
                            value={monacoTheme}
                            onValueChange={setMonacoTheme}
                        />
                    </div>
                </SettingSection>
            </SettingsCategorySection>

            <SettingsCategorySection category={categoryById('feedback')}>
                <SettingSection title="Motion" description="Control animations and transitions.">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={0}
                        value={reducedMotion}
                        onValueChange={(value) =>
                            value &&
                            setReducedMotion(
                                value as
                                    | typeof REDUCED_MOTION_SYSTEM
                                    | typeof REDUCED_MOTION_REDUCE
                                    | typeof REDUCED_MOTION_FULL,
                            )
                        }
                        className="grid w-full grid-cols-3"
                    >
                        <SegmentedOption
                            value={REDUCED_MOTION_SYSTEM}
                            label="System"
                            icon={<MonitorIcon className="size-4" aria-hidden />}
                        />
                        <SegmentedOption
                            value={REDUCED_MOTION_REDUCE}
                            label="Reduce"
                            icon={<AccessibilityIcon className="size-4" aria-hidden />}
                        />
                        <SegmentedOption
                            value={REDUCED_MOTION_FULL}
                            label="Full"
                            icon={<ZapIcon className="size-4" aria-hidden />}
                        />
                    </ToggleGroup>
                </SettingSection>
                <SettingSection title="Sound effects" description="Play sounds for celebratory moments and feedback.">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        spacing={0}
                        value={soundEffects}
                        onValueChange={(value) => value && setSoundEffects(value as SoundEffectsPreference)}
                        className="grid w-full grid-cols-2"
                    >
                        <SegmentedOption
                            value={SOUND_EFFECTS_ON}
                            label="On"
                            icon={<Volume2Icon className="size-4" aria-hidden />}
                        />
                        <SegmentedOption
                            value={SOUND_EFFECTS_OFF}
                            label="Off"
                            icon={<VolumeXIcon className="size-4" aria-hidden />}
                        />
                    </ToggleGroup>
                </SettingSection>
            </SettingsCategorySection>

            {user ? (
                <SettingsCategorySection category={categoryById('dashboard')}>
                    <SettingSection
                        title="Dashboard modules"
                        description="Choose which modules appear on your dashboard and arrange them to your liking."
                    >
                        <Button type="button" variant="outline" onClick={handleCustomizeDashboard}>
                            <LayoutDashboardIcon className="size-4" aria-hidden />
                            Customize dashboard
                        </Button>
                    </SettingSection>
                    <SettingSection
                        title="Card size"
                        description="Height of the scrollable dashboard cards. Suggested problems always stays small."
                    >
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            spacing={0}
                            value={dashboardCardSize}
                            onValueChange={(value) => value && setDashboardCardSize(value as DashboardCardSize)}
                            className="grid w-full grid-cols-2"
                        >
                            <SegmentedOption
                                value="small"
                                label="Small"
                                icon={<RectangleHorizontalIcon className="size-4" aria-hidden />}
                            />
                            <SegmentedOption
                                value="large"
                                label="Double"
                                icon={<SquareIcon className="size-4" aria-hidden />}
                            />
                        </ToggleGroup>
                    </SettingSection>
                </SettingsCategorySection>
            ) : null}

            <div className="pt-2">
                <Button type="button" variant="outline" onClick={handleResetDefaults}>
                    <RotateCcwIcon className="size-4" aria-hidden />
                    Reset appearance to defaults
                </Button>
            </div>
        </div>
    )
}
