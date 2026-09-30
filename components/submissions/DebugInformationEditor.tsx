'use client'

import type { Monaco } from '@monaco-editor/react'
import { saveAs } from 'file-saver'
import {
    AArrowDownIcon,
    AArrowUpIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsRightIcon,
    ClipboardIcon,
    DownloadIcon,
    ListIcon,
    ListOrderedIcon,
    LockIcon,
    LockOpenIcon,
    MapIcon,
} from 'lucide-react'
import type { editor } from 'monaco-editor'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'

import { VerdictLink } from '@/components/documentation/ReferenceLink'
import { DocumentTitle } from '@/components/general/DocumentTitle'
import { MonacoThemeMenu } from '@/components/MonacoThemeMenu'
import { SubmissionNavButton } from '@/components/submissions/SubmissionNavButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFontScalePreference } from '@/hooks/use-font-scale-preference'
import { useMonacoThemePreference } from '@/hooks/use-monaco-theme-preference'
import { FONT_SCALE_STEP, MAX_FONT_SCALE, MIN_FONT_SCALE, SOURCE_CODE_FONT_SCALE_KEY } from '@/lib/fontScale'
import type { DebugInformationField } from '@/lib/debugInformation'
import { registerCustomMonacoLanguages } from '@/lib/monaco/registerCustomLanguages'
import { ensureMonacoThemeRegistered } from '@/lib/monaco/registerThemes'
import { resolveMonacoEditorTheme, type MonacoThemeSelection } from '@/lib/monaco/themes'
import type { SubmissionNavLinks } from '@/lib/submissions'
import { cn } from '@/lib/utils'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => null,
})

const BASE_FONT_SIZE = 14

type ToolbarIconButtonProps = ComponentProps<typeof Button> & {
    label: string
}

function ToolbarIconButton({ label, className, children, ...props }: ToolbarIconButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={label}
                    className={className}
                    {...props}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
    )
}

type DebugInformationEditorProps = {
    fields: DebugInformationField[]
    problemId: string
    submissionId: string
    verdict: string
    verdictEmoji?: string
    verdictFullName?: string
    isPending?: boolean
    navigation?: SubmissionNavLinks | null
}

function findModelKey(
    model: editor.ITextModel,
    models: Map<DebugInformationField['key'], editor.ITextModel>,
): DebugInformationField['key'] | null {
    for (const [key, entry] of models) {
        if (entry === model) {
            return key
        }
    }

    return null
}

export function DebugInformationEditor({
    fields,
    problemId,
    submissionId,
    verdict,
    verdictEmoji,
    verdictFullName,
    isPending = false,
    navigation,
}: DebugInformationEditorProps) {
    const { resolvedTheme } = useTheme()
    const [editorTheme, setEditorTheme] = useMonacoThemePreference()
    const [fontScale, setFontScale] = useFontScalePreference(SOURCE_CODE_FONT_SCALE_KEY)
    const [readOnly, setReadOnly] = useState(true)
    const [showLineNumbers, setShowLineNumbers] = useState(true)
    const [showMinimap, setShowMinimap] = useState(false)
    const [activeTab, setActiveTab] = useState(fields[0]?.key ?? '')
    const [mounted, setMounted] = useState(false)
    const monacoRef = useRef<Monaco | null>(null)
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const editorThemeRef = useRef(editorTheme)
    const themePreviewIdRef = useRef(0)
    const modelsRef = useRef<Map<DebugInformationField['key'], editor.ITextModel>>(new Map())
    const viewStatesRef = useRef<Map<DebugInformationField['key'], editor.ICodeEditorViewState | null>>(new Map())

    editorThemeRef.current = editorTheme

    const activeField = useMemo(() => fields.find((field) => field.key === activeTab) ?? fields[0], [activeTab, fields])

    useEffect(() => {
        setMounted(true)
    }, [])

    const activeMonacoTheme = resolveMonacoEditorTheme(editorTheme, mounted ? resolvedTheme : undefined)
    const fontSize = Math.round(BASE_FONT_SIZE * fontScale)

    const disposeModels = useCallback(() => {
        for (const model of modelsRef.current.values()) {
            model.dispose()
        }

        modelsRef.current.clear()
        viewStatesRef.current.clear()
    }, [])

    const ensureModels = useCallback((monaco: Monaco, nextFields: DebugInformationField[]) => {
        const nextKeys = new Set(nextFields.map((field) => field.key))

        for (const [key, model] of modelsRef.current) {
            if (!nextKeys.has(key)) {
                model.dispose()
                modelsRef.current.delete(key)
                viewStatesRef.current.delete(key)
            }
        }

        for (const field of nextFields) {
            const uri = monaco.Uri.parse(`debug://${field.filename}`)
            const existingModel = monaco.editor.getModel(uri)

            if (existingModel) {
                existingModel.setValue(field.content)
                modelsRef.current.set(field.key, existingModel)
                continue
            }

            const model = monaco.editor.createModel(field.content, field.language, uri)
            modelsRef.current.set(field.key, model)
        }
    }, [])

    const switchToTab = useCallback((key: DebugInformationField['key']) => {
        const editorInstance = editorRef.current
        if (!editorInstance) {
            return
        }

        const currentModel = editorInstance.getModel()
        if (currentModel) {
            const currentKey = findModelKey(currentModel, modelsRef.current)
            if (currentKey) {
                viewStatesRef.current.set(currentKey, editorInstance.saveViewState())
            }
        }

        const nextModel = modelsRef.current.get(key)
        if (!nextModel) {
            return
        }

        editorInstance.setModel(nextModel)
        editorInstance.restoreViewState(viewStatesRef.current.get(key) ?? null)
    }, [])

    const applyMonacoTheme = useCallback(
        async (themeId: string) => {
            const monaco = monacoRef.current
            if (!monaco || !mounted) {
                return
            }

            await ensureMonacoThemeRegistered(monaco, themeId)
            monaco.editor.setTheme(themeId)
        },
        [mounted],
    )

    const applyEditorTheme = useCallback(async () => {
        await applyMonacoTheme(activeMonacoTheme)
    }, [activeMonacoTheme, applyMonacoTheme])

    const previewEditorTheme = useCallback(
        async (selection: MonacoThemeSelection) => {
            const previewId = ++themePreviewIdRef.current
            const themeId = resolveMonacoEditorTheme(selection, mounted ? resolvedTheme : undefined)

            await applyMonacoTheme(themeId)
            if (previewId !== themePreviewIdRef.current) {
                return
            }
        },
        [applyMonacoTheme, mounted, resolvedTheme],
    )

    const handleEditorThemeChange = useCallback(
        (theme: MonacoThemeSelection) => {
            editorThemeRef.current = theme
            setEditorTheme(theme)
        },
        [setEditorTheme],
    )

    const handleThemeMenuOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                return
            }

            themePreviewIdRef.current += 1
            const themeId = resolveMonacoEditorTheme(editorThemeRef.current, mounted ? resolvedTheme : undefined)
            void applyMonacoTheme(themeId)
        },
        [applyMonacoTheme, mounted, resolvedTheme],
    )

    useEffect(() => {
        void applyEditorTheme()
    }, [applyEditorTheme])

    useEffect(() => {
        editorRef.current?.updateOptions({
            fontSize,
            lineNumbers: showLineNumbers ? 'on' : 'off',
            minimap: { enabled: showMinimap },
            readOnly,
        })
    }, [fontSize, readOnly, showLineNumbers, showMinimap])

    useEffect(() => {
        const monaco = monacoRef.current
        if (!monaco || fields.length === 0) {
            return
        }

        ensureModels(monaco, fields)

        if (editorRef.current) {
            switchToTab(activeTab)
        }
    }, [activeTab, ensureModels, fields, switchToTab])

    useEffect(() => {
        return () => {
            disposeModels()
        }
    }, [disposeModels])

    async function handleBeforeMount(monaco: Monaco) {
        monacoRef.current = monaco
        registerCustomMonacoLanguages(monaco)
        await ensureMonacoThemeRegistered(monaco, activeMonacoTheme)
    }

    function handleMount(editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) {
        monacoRef.current = monaco
        editorRef.current = editorInstance

        if (fields.length === 0) {
            return
        }

        ensureModels(monaco, fields)
        switchToTab(activeTab || fields[0].key)
        void applyEditorTheme()
    }

    function getActiveContent(): string {
        return editorRef.current?.getValue() ?? activeField?.content ?? ''
    }

    function copyActiveContent() {
        navigator.clipboard.writeText(getActiveContent()).then(
            () => toast.success('Copied to clipboard'),
            () => toast.error('Failed to copy'),
        )
    }

    function downloadActiveContent() {
        if (!activeField) {
            return
        }

        const blob = new Blob([getActiveContent()], { type: 'text/plain;charset=utf-8' })
        saveAs(blob, activeField.filename)
    }

    return (
        <TooltipProvider>
            <div className="flex h-full min-h-0 flex-col">
                <DocumentTitle title={`${submissionId} — debug information`} />
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-2">
                    <h1 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold text-foreground">
                        <span className="truncate">Debug information</span>
                        <span className="shrink-0 text-muted-foreground">—</span>
                        <span className="shrink-0 truncate">{problemId}</span>
                        <span className="shrink-0 text-muted-foreground">—</span>
                        <span className="shrink-0 truncate">{submissionId}</span>
                        <span className="shrink-0 text-muted-foreground">—</span>
                        <span className={cn('inline-flex shrink-0 items-center gap-1.5', isPending && 'animate-pulse')}>
                            {verdictEmoji ? <span aria-hidden>{verdictEmoji}</span> : null}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <VerdictLink verdictId={verdict} />
                                    </span>
                                </TooltipTrigger>
                                {verdictFullName ? (
                                    <TooltipContent side="bottom">{verdictFullName}</TooltipContent>
                                ) : null}
                            </Tooltip>
                        </span>
                    </h1>
                    <div className="flex shrink-0 items-center gap-2">
                        {navigation ? (
                            <ButtonGroup>
                                <SubmissionNavButton href={navigation.previousHref} label="Previous submission">
                                    <ChevronLeftIcon />
                                </SubmissionNavButton>
                                <SubmissionNavButton href={navigation.nextHref} label="Next submission">
                                    <ChevronRightIcon />
                                </SubmissionNavButton>
                                <SubmissionNavButton href={navigation.lastHref} label="Last submission">
                                    <ChevronsRightIcon />
                                </SubmissionNavButton>
                            </ButtonGroup>
                        ) : null}
                        <ButtonGroup>
                            <ToolbarIconButton label="Copy to clipboard" onClick={copyActiveContent}>
                                <ClipboardIcon />
                            </ToolbarIconButton>
                            <ToolbarIconButton label="Download active tab" onClick={downloadActiveContent}>
                                <DownloadIcon />
                            </ToolbarIconButton>
                        </ButtonGroup>
                        <ButtonGroup>
                            <ToolbarIconButton
                                label={readOnly ? 'Enable editing' : 'Disable editing'}
                                onClick={() => setReadOnly((current) => !current)}
                                aria-pressed={!readOnly}
                                className={cn(!readOnly && 'bg-muted')}
                            >
                                {readOnly ? <LockIcon /> : <LockOpenIcon />}
                            </ToolbarIconButton>
                            <ToolbarIconButton
                                label={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
                                onClick={() => setShowLineNumbers((current) => !current)}
                                aria-pressed={showLineNumbers}
                                className={cn(showLineNumbers && 'bg-muted')}
                            >
                                {showLineNumbers ? <ListOrderedIcon /> : <ListIcon />}
                            </ToolbarIconButton>
                            <ToolbarIconButton
                                label={showMinimap ? 'Hide minimap' : 'Show minimap'}
                                onClick={() => setShowMinimap((current) => !current)}
                                aria-pressed={showMinimap}
                                className={cn(showMinimap && 'bg-muted')}
                            >
                                <MapIcon />
                            </ToolbarIconButton>
                        </ButtonGroup>
                        <ButtonGroup>
                            <ToolbarIconButton
                                label="Decrease font size"
                                disabled={fontScale <= MIN_FONT_SCALE}
                                onClick={() =>
                                    setFontScale((scale) => Math.max(MIN_FONT_SCALE, scale - FONT_SCALE_STEP))
                                }
                            >
                                <AArrowDownIcon />
                            </ToolbarIconButton>
                            <ToolbarIconButton
                                label="Increase font size"
                                disabled={fontScale >= MAX_FONT_SCALE}
                                onClick={() =>
                                    setFontScale((scale) => Math.min(MAX_FONT_SCALE, scale + FONT_SCALE_STEP))
                                }
                            >
                                <AArrowUpIcon />
                            </ToolbarIconButton>
                        </ButtonGroup>
                        <MonacoThemeMenu
                            value={editorTheme}
                            onValueChange={handleEditorThemeChange}
                            onThemePreview={(theme) => void previewEditorTheme(theme)}
                            onOpenChange={handleThemeMenuOpenChange}
                            size="icon-sm"
                            groupedSlot={<ThemeToggle size="icon-sm" />}
                        />
                    </div>
                </header>

                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as DebugInformationField['key'])}
                    className="shrink-0 gap-0"
                >
                    <div className="overflow-x-auto border-b border-border px-4 py-2">
                        <TabsList className="w-full">
                            {fields.map((field) => (
                                <TabsTrigger key={field.key} value={field.key} className="w-32 truncate">
                                    {field.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </Tabs>

                <div className="min-h-0 flex-1">
                    <MonacoEditor
                        height="100%"
                        beforeMount={handleBeforeMount}
                        onMount={handleMount}
                        theme={activeMonacoTheme}
                        options={{
                            automaticLayout: true,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize,
                            folding: true,
                            foldingHighlight: true,
                            showFoldingControls: 'always',
                            lineNumbers: showLineNumbers ? 'on' : 'off',
                            minimap: { enabled: showMinimap },
                            readOnly,
                            scrollBeyondLastLine: false,
                            tabSize: 2,
                            wordWrap: 'off',
                        }}
                    />
                </div>
            </div>
        </TooltipProvider>
    )
}
