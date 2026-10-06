'use client'

import type { Monaco } from '@monaco-editor/react'
import { saveAs } from 'file-saver'
import {
    AArrowDownIcon,
    AArrowUpIcon,
    ChevronDownIcon,
    ClipboardIcon,
    DownloadIcon,
    ListIcon,
    ListOrderedIcon,
    LockIcon,
    LockOpenIcon,
    ExpandIcon,
    MapIcon,
    Minimize2Icon,
    UploadIcon,
} from 'lucide-react'
import type { editor } from 'monaco-editor'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from 'react'
import { toast } from 'sonner'

import { DevIcon } from '@/components/administrator/DevIcon'
import { DocumentTitle } from '@/components/general/DocumentTitle'
import { WidgetSpinner } from '@/components/general/WidgetSpinner'
import { MonacoThemeMenu } from '@/components/MonacoThemeMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFontScalePreference } from '@/hooks/use-font-scale-preference'
import { useMonacoThemePreference } from '@/hooks/use-monaco-theme-preference'
import { fetchCompilers } from '@/lib/data/tables'
import { FONT_SCALE_STEP, MAX_FONT_SCALE, MIN_FONT_SCALE, SOURCE_CODE_FONT_SCALE_KEY } from '@/lib/fontScale'
import { monacoLanguageForExtension } from '@/lib/highlightCode'
import { registerCustomMonacoLanguages } from '@/lib/monaco/registerCustomLanguages'
import { ensureMonacoThemeRegistered } from '@/lib/monaco/registerThemes'
import { resolveMonacoEditorTheme, type MonacoThemeSelection } from '@/lib/monaco/themes'
import { extensionForProglang, formatProglangName } from '@/lib/solutions'
import {
    activeCompilerLanguages,
    readUtilityEditorCode,
    readUtilityEditorProglang,
    writeUtilityEditorCode,
    writeUtilityEditorProglang,
} from '@/lib/utilityEditor'
import { cn } from '@/lib/utils'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => null,
})

const BASE_FONT_SIZE = 14
const DEFAULT_PROGLANG = 'Python3'
const UTILITY_EDITOR_VIEW_HREF = '/utilities/editor/view'

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

type UtilityCodeEditorProps = {
    variant: 'embedded' | 'fullscreen'
}

export function UtilityCodeEditor({ variant }: UtilityCodeEditorProps) {
    const uploadInputId = useId()
    const { resolvedTheme } = useTheme()
    const [editorTheme, setEditorTheme] = useMonacoThemePreference()
    const [fontScale, setFontScale] = useFontScalePreference(SOURCE_CODE_FONT_SCALE_KEY)
    const [readOnly, setReadOnly] = useState(false)
    const [showLineNumbers, setShowLineNumbers] = useState(true)
    const [showMinimap, setShowMinimap] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [code, setCode] = useState('')
    const [proglang, setProglang] = useState(DEFAULT_PROGLANG)
    const [languages, setLanguages] = useState<string[]>([])
    const [compilers, setCompilers] = useState<Awaited<ReturnType<typeof fetchCompilers>>>([])
    const [compilersLoaded, setCompilersLoaded] = useState(false)
    const monacoRef = useRef<Monaco | null>(null)
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const editorThemeRef = useRef(editorTheme)
    const themePreviewIdRef = useRef(0)
    const uploadInputRef = useRef<HTMLInputElement>(null)

    editorThemeRef.current = editorTheme

    useEffect(() => {
        setMounted(true)
        setCode(readUtilityEditorCode())
    }, [])

    useEffect(() => {
        void (async () => {
            const nextCompilers = await fetchCompilers()
            const available = activeCompilerLanguages(nextCompilers)
            setCompilers(nextCompilers)
            setLanguages(available)
            const stored = readUtilityEditorProglang(DEFAULT_PROGLANG)
            const initial =
                available.includes(stored) ? stored : available.includes(DEFAULT_PROGLANG) ? DEFAULT_PROGLANG : available[0] ?? DEFAULT_PROGLANG
            setProglang(initial)
            setCompilersLoaded(true)
        })()
    }, [])

    const codeExtension = useMemo(() => {
        if (!compilersLoaded) {
            return 'txt'
        }
        return extensionForProglang(proglang, compilers) ?? 'txt'
    }, [compilers, compilersLoaded, proglang])

    useEffect(() => {
        if (!compilersLoaded) {
            return
        }

        const extension = extensionForProglang(proglang, compilers) ?? 'txt'
        const monacoLanguage = monacoLanguageForExtension(extension) ?? 'plaintext'
        const monaco = monacoRef.current
        const editorInstance = editorRef.current
        if (monaco && editorInstance) {
            const model = editorInstance.getModel()
            if (model) {
                monaco.editor.setModelLanguage(model, monacoLanguage)
            }
        }
    }, [compilers, compilersLoaded, proglang])

    const language = monacoLanguageForExtension(codeExtension) ?? 'plaintext'
    const activeMonacoTheme = resolveMonacoEditorTheme(editorTheme, mounted ? resolvedTheme : undefined)
    const fontSize = Math.round(BASE_FONT_SIZE * fontScale)
    const downloadFilename = `editor-${proglang.replace(/[^\w+-]+/g, '_')}.${codeExtension}`

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

    function handleMount(editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) {
        editorRef.current = editorInstance
        monacoRef.current = monaco
        void applyEditorTheme()
    }

    function handleCodeChange(value: string | undefined) {
        const next = value ?? ''
        setCode(next)
        writeUtilityEditorCode(next)
    }

    function handleProglangChange(next: string) {
        setProglang(next)
        writeUtilityEditorProglang(next)
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
            saveAs(new Blob([code], { type: 'text/plain;charset=utf-8' }), downloadFilename)
        } catch {
            toast.error('Failed to download')
        }
    }

    function openUploadPicker() {
        uploadInputRef.current?.click()
    }

    function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) {
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : ''
            setCode(text)
            writeUtilityEditorCode(text)
            toast.success(`Loaded ${file.name}`)
        }
        reader.onerror = () => {
            toast.error('Failed to read file')
        }
        reader.readAsText(file)
    }

    const shellClassName =
        variant === 'fullscreen'
            ? 'flex h-full min-h-0 flex-col'
            : 'flex h-full min-h-0 flex-col rounded-xl border border-border'

    return (
        <TooltipProvider>
            <div className={shellClassName}>
                <DocumentTitle title="Editor" />
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-0">
                    <h1 className="truncate text-sm font-semibold text-foreground">Editor</h1>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        <ButtonGroup>
                            <ToolbarIconButton label="Copy to clipboard" onClick={copyCode}>
                                <ClipboardIcon />
                            </ToolbarIconButton>
                            <ToolbarIconButton label="Download source code" onClick={downloadCode}>
                                <DownloadIcon />
                            </ToolbarIconButton>
                            <ToolbarIconButton label="Upload a text file" onClick={openUploadPicker}>
                                <UploadIcon />
                            </ToolbarIconButton>
                        </ButtonGroup>
                        <input
                            ref={uploadInputRef}
                            id={uploadInputId}
                            type="file"
                            accept="text/*,.txt,.py,.cpp,.java,.c,.h,.cc,.cs,.go,.rs,.rb,.php,.swift,.kt,.scala,.sh,.pl,.lua,.r,.m,.mm,.pas,.adb,.ads,.zig,.jl,.ex,.exs,.clj,.erl,.hs,.nim,.vb,.f,.f90,.for,.pro,.scm,.ss,.sv,.v,.cmake,.mk,.make,.yml,.yaml,.json,.xml,.html,.css,.js,.ts,.sql"
                            className="sr-only"
                            onChange={handleUploadChange}
                        />
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
                                onClick={() => setFontScale((scale) => Math.max(MIN_FONT_SCALE, scale - FONT_SCALE_STEP))}
                            >
                                <AArrowDownIcon />
                            </ToolbarIconButton>
                            <ToolbarIconButton
                                label="Increase font size"
                                disabled={fontScale >= MAX_FONT_SCALE}
                                onClick={() => setFontScale((scale) => Math.min(MAX_FONT_SCALE, scale + FONT_SCALE_STEP))}
                            >
                                <AArrowUpIcon />
                            </ToolbarIconButton>
                        </ButtonGroup>
                        <ButtonGroup>
                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="max-w-44 gap-1.5"
                                                aria-label="Programming language"
                                                disabled={languages.length === 0}
                                            >
                                                <DevIcon proglang={proglang} size={16} />
                                                <span className="truncate">{formatProglangName(proglang)}</span>
                                                <ChevronDownIcon className="size-4 shrink-0 opacity-60" aria-hidden />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Programming language</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuRadioGroup value={proglang} onValueChange={handleProglangChange}>
                                        {languages.map((entry) => (
                                            <DropdownMenuRadioItem key={entry} value={entry} className="gap-2">
                                                <DevIcon proglang={entry} size={16} />
                                                <span>{formatProglangName(entry)}</span>
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <MonacoThemeMenu
                                value={editorTheme}
                                onValueChange={handleEditorThemeChange}
                                onThemePreview={(theme) => void previewEditorTheme(theme)}
                                onOpenChange={handleThemeMenuOpenChange}
                                size="icon-sm"
                                groupedSlot={<ThemeToggle size="icon-sm" />}
                            />
                        </ButtonGroup>
                        {variant === 'embedded' ? (
                            <ToolbarIconButton label="Open full screen" asChild>
                                <Link href={UTILITY_EDITOR_VIEW_HREF}>
                                    <ExpandIcon />
                                </Link>
                            </ToolbarIconButton>
                        ) : (
                            <ToolbarIconButton label="Exit full screen" asChild>
                                <Link href="/utilities/editor">
                                    <Minimize2Icon />
                                </Link>
                            </ToolbarIconButton>
                        )}
                    </div>
                </header>
                <div className="min-h-0 flex-1">
                    {!compilersLoaded ? <WidgetSpinner className="h-full min-h-48" label="Loading editor" /> : null}
                    {compilersLoaded ? (
                        <MonacoEditor
                            height="100%"
                            beforeMount={handleBeforeMount}
                            onMount={handleMount}
                            language={language}
                            value={code}
                            onChange={handleCodeChange}
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
                    ) : null}
                </div>
            </div>
        </TooltipProvider>
    )
}
