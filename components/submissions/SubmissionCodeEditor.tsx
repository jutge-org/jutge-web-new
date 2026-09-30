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
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'

import { VerdictLink } from '@/components/documentation/ReferenceLink'
import { DocumentTitle } from '@/components/general/DocumentTitle'
import { MonacoThemeMenu } from '@/components/MonacoThemeMenu'
import { SubmissionNavButton } from '@/components/submissions/SubmissionNavButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFontScalePreference } from '@/hooks/use-font-scale-preference'
import { useMonacoThemePreference } from '@/hooks/use-monaco-theme-preference'
import { FONT_SCALE_STEP, MAX_FONT_SCALE, MIN_FONT_SCALE, SOURCE_CODE_FONT_SCALE_KEY } from '@/lib/fontScale'
import { monacoLanguageForExtension } from '@/lib/highlightCode'
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

type SubmissionCodeEditorProps = {
    code: string
    codeExtension: string | null
    codeFilename: string
    codeHref: string
    title: string
    submissionId: string
    verdict: string
    verdictEmoji?: string
    verdictFullName?: string
    navigation?: SubmissionNavLinks | null
    isPending?: boolean
}

export function SubmissionCodeEditor({
    code,
    codeExtension,
    codeFilename,
    title,
    submissionId,
    verdict,
    verdictEmoji,
    verdictFullName,
    navigation,
    isPending = false,
}: SubmissionCodeEditorProps) {
    const { resolvedTheme } = useTheme()
    const [editorTheme, setEditorTheme] = useMonacoThemePreference()
    const [fontScale, setFontScale] = useFontScalePreference(SOURCE_CODE_FONT_SCALE_KEY)
    const [readOnly, setReadOnly] = useState(true)
    const [showLineNumbers, setShowLineNumbers] = useState(true)
    const [showMinimap, setShowMinimap] = useState(false)
    const [mounted, setMounted] = useState(false)
    const monacoRef = useRef<Monaco | null>(null)
    const editorThemeRef = useRef(editorTheme)
    const themePreviewIdRef = useRef(0)

    editorThemeRef.current = editorTheme

    useEffect(() => {
        setMounted(true)
    }, [])

    const language = monacoLanguageForExtension(codeExtension)
    const activeMonacoTheme = resolveMonacoEditorTheme(editorTheme, mounted ? resolvedTheme : undefined)
    const fontSize = Math.round(BASE_FONT_SIZE * fontScale)

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

    async function handleBeforeMount(monaco: Monaco) {
        monacoRef.current = monaco
        registerCustomMonacoLanguages(monaco)
        await ensureMonacoThemeRegistered(monaco, activeMonacoTheme)
    }

    function handleMount(_editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
        monacoRef.current = monaco
        void applyEditorTheme()
    }

    function toggleReadOnly() {
        setReadOnly((current) => !current)
    }

    function toggleLineNumbers() {
        setShowLineNumbers((current) => !current)
    }

    function toggleMinimap() {
        setShowMinimap((current) => !current)
    }

    function copyCode() {
        navigator.clipboard.writeText(code).then(
            () => toast.success('Copied to clipboard'),
            () => toast.error('Failed to copy'),
        )
    }

    function downloadCode() {
        try {
            saveAs(new Blob([code], { type: 'text/plain;charset=utf-8' }), codeFilename)
        } catch {
            toast.error('Failed to download')
        }
    }

    return (
        <TooltipProvider>
            <div className="flex h-full min-h-0 flex-col">
                <DocumentTitle title={`${title} — ${submissionId}`} />
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-2">
                    <h1 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold text-foreground">
                        <span className="truncate">{title}</span>
                        <span className="shrink-0 text-muted-foreground">—</span>
                        <span className={cn('inline-flex shrink-0 items-center gap-1.5', isPending && 'animate-pulse')}>
                            <span>{submissionId}</span>—{verdictEmoji ? <span aria-hidden>{verdictEmoji}</span> : null}
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
                            <ToolbarIconButton label="Copy to clipboard" onClick={copyCode}>
                                <ClipboardIcon />
                            </ToolbarIconButton>
                            <ToolbarIconButton label="Download source code" onClick={downloadCode}>
                                <DownloadIcon />
                            </ToolbarIconButton>
                        </ButtonGroup>
                        <ButtonGroup>
                            <ToolbarIconButton
                                label={readOnly ? 'Enable editing' : 'Disable editing'}
                                onClick={toggleReadOnly}
                                aria-pressed={!readOnly}
                                className={cn(!readOnly && 'bg-muted')}
                            >
                                {readOnly ? <LockIcon /> : <LockOpenIcon />}
                            </ToolbarIconButton>
                            <ToolbarIconButton
                                label={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
                                onClick={toggleLineNumbers}
                                aria-pressed={showLineNumbers}
                                className={cn(showLineNumbers && 'bg-muted')}
                            >
                                {showLineNumbers ? <ListOrderedIcon /> : <ListIcon />}
                            </ToolbarIconButton>
                            <ToolbarIconButton
                                label={showMinimap ? 'Hide minimap' : 'Show minimap'}
                                onClick={toggleMinimap}
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
                <div className="min-h-0 flex-1">
                    <MonacoEditor
                        height="100%"
                        beforeMount={handleBeforeMount}
                        onMount={handleMount}
                        defaultLanguage={language}
                        defaultValue={code}
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
                            tabSize: 4,
                            wordWrap: 'off',
                        }}
                    />
                </div>
            </div>
        </TooltipProvider>
    )
}
