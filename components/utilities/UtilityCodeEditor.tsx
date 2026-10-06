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
    FileXIcon,
    FolderXIcon,
    MapIcon,
    Minimize2Icon,
    PlusIcon,
    UploadIcon,
} from 'lucide-react'
import type { editor } from 'monaco-editor'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
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
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
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
    createUtilityEditorDocument,
    fallbackUtilityEditorProglang,
    nextUtilityEditorDocumentName,
    readUtilityEditorState,
    readUtilityEditorEpoch,
    writeUtilityEditorState,
    type UtilityEditorDocument,
    type UtilityEditorState,
} from '@/lib/utilityEditor'
import { cn } from '@/lib/utils'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => null,
})

const BASE_FONT_SIZE = 14
const DEFAULT_PROGLANG = 'Python'
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
    const { user } = useAuth()
    const uploadInputId = useId()
    const { resolvedTheme } = useTheme()
    const [editorTheme, setEditorTheme] = useMonacoThemePreference()
    const [fontScale, setFontScale] = useFontScalePreference(SOURCE_CODE_FONT_SCALE_KEY)
    const [readOnly, setReadOnly] = useState(false)
    const [showLineNumbers, setShowLineNumbers] = useState(true)
    const [showMinimap, setShowMinimap] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [editorState, setEditorState] = useState<UtilityEditorState | null>(null)
    const [languages, setLanguages] = useState<string[]>([])
    const [compilers, setCompilers] = useState<Awaited<ReturnType<typeof fetchCompilers>>>([])
    const [compilersLoaded, setCompilersLoaded] = useState(false)
    const monacoRef = useRef<Monaco | null>(null)
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const editorThemeRef = useRef(editorTheme)
    const themePreviewIdRef = useRef(0)
    const uploadInputRef = useRef<HTMLInputElement>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)
    const pendingNameFocusRef = useRef(false)
    const signedInRef = useRef(false)

    editorThemeRef.current = editorTheme

    const activeDocument = editorState?.documents.find((document) => document.id === editorState.activeId) ?? null

    useEffect(() => {
        let cancelled = false
        setMounted(true)
        void (async () => {
            const epoch = readUtilityEditorEpoch()
            const nextCompilers = await fetchCompilers()
            if (cancelled || epoch !== readUtilityEditorEpoch()) {
                return
            }

            const available = activeCompilerLanguages(nextCompilers)
            const fallback = fallbackUtilityEditorProglang(available, DEFAULT_PROGLANG)
            const stored = readUtilityEditorState(fallback)
            const documents = stored.documents.map((document) => ({
                ...document,
                name: document.name.trim() || 'Untitled',
                proglang: available.length === 0 || available.includes(document.proglang) ? document.proglang : fallback,
            }))
            setCompilers(nextCompilers)
            setLanguages(available)
            setEditorState({ activeId: stored.activeId, documents })
            setCompilersLoaded(true)
        })()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!compilersLoaded || !editorState) {
            return
        }
        writeUtilityEditorState(editorState)
    }, [compilersLoaded, editorState])

    useEffect(() => {
        if (user) {
            signedInRef.current = true
            return
        }
        if (!signedInRef.current) {
            return
        }
        signedInRef.current = false
        const fallback = fallbackUtilityEditorProglang(languages, DEFAULT_PROGLANG)
        const document = createUtilityEditorDocument('Untitled', fallback)
        setEditorState({ activeId: document.id, documents: [document] })
    }, [languages, user])

    useEffect(() => {
        if (!pendingNameFocusRef.current) {
            return
        }
        pendingNameFocusRef.current = false
        nameInputRef.current?.focus()
        nameInputRef.current?.select()
    }, [editorState?.activeId])

    const codeExtension = useMemo(() => {
        if (!compilersLoaded || !activeDocument) {
            return 'txt'
        }
        return extensionForProglang(activeDocument.proglang, compilers) ?? 'txt'
    }, [activeDocument, compilers, compilersLoaded])

    useEffect(() => {
        if (!compilersLoaded || !activeDocument) {
            return
        }

        const extension = extensionForProglang(activeDocument.proglang, compilers) ?? 'txt'
        const monacoLanguage = monacoLanguageForExtension(extension) ?? 'plaintext'
        const monaco = monacoRef.current
        const editorInstance = editorRef.current
        if (monaco && editorInstance) {
            const model = editorInstance.getModel()
            if (model && model.getLanguageId() !== monacoLanguage) {
                monaco.editor.setModelLanguage(model, monacoLanguage)
            }
        }
    }, [activeDocument, compilers, compilersLoaded])

    const language = monacoLanguageForExtension(codeExtension) ?? 'plaintext'
    const activeMonacoTheme = resolveMonacoEditorTheme(editorTheme, mounted ? resolvedTheme : undefined)
    const fontSize = Math.round(BASE_FONT_SIZE * fontScale)
    const documentName = activeDocument?.name.trim() || 'Untitled'
    const downloadFilename = `${documentName.replace(/[^\w.+-]+/g, '_') || 'document'}.${codeExtension}`

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

    function updateDocument(id: string, patch: Partial<Pick<UtilityEditorDocument, 'name' | 'code' | 'proglang'>>) {
        setEditorState((current) => {
            if (!current) {
                return current
            }

            let changed = false
            const documents = current.documents.map((document) => {
                if (document.id !== id) {
                    return document
                }
                const next = { ...document, ...patch }
                if (next.name === document.name && next.code === document.code && next.proglang === document.proglang) {
                    return document
                }
                changed = true
                return next
            })

            return changed ? { ...current, documents } : current
        })
    }

    function handleCodeChange(documentId: string, value: string | undefined) {
        if (value === undefined) {
            return
        }
        updateDocument(documentId, { code: value })
    }

    function handleProglangChange(next: string) {
        if (!activeDocument) {
            return
        }
        updateDocument(activeDocument.id, { proglang: next })
    }

    function handleNameChange(name: string) {
        if (!activeDocument) {
            return
        }
        updateDocument(activeDocument.id, { name })
    }

    function commitDocumentName() {
        if (!activeDocument) {
            return
        }
        const trimmed = activeDocument.name.trim()
        if (trimmed === activeDocument.name) {
            return
        }
        updateDocument(activeDocument.id, { name: trimmed || 'Untitled' })
    }

    function selectDocument(id: string) {
        setEditorState((current) => {
            if (!current || !current.documents.some((document) => document.id === id)) {
                return current
            }
            return { ...current, activeId: id }
        })
    }

    function addDocument() {
        const proglang = activeDocument?.proglang ?? fallbackUtilityEditorProglang(languages, DEFAULT_PROGLANG)
        const document = createUtilityEditorDocument(
            nextUtilityEditorDocumentName(editorState?.documents ?? []),
            proglang,
        )
        pendingNameFocusRef.current = true
        setEditorState((current) => {
            if (!current) {
                return { activeId: document.id, documents: [document] }
            }
            return { activeId: document.id, documents: [...current.documents, document] }
        })
    }

    function deleteActiveDocument() {
        setEditorState((current) => {
            if (!current || current.documents.length < 2) {
                return current
            }
            const index = current.documents.findIndex((document) => document.id === current.activeId)
            const documents = current.documents.filter((document) => document.id !== current.activeId)
            const next = documents[Math.max(0, index - 1)] ?? documents[0]
            return { activeId: next.id, documents }
        })
    }

    function deleteAllDocuments() {
        const fallback = fallbackUtilityEditorProglang(languages, DEFAULT_PROGLANG)
        const document = createUtilityEditorDocument('Untitled', fallback)
        setEditorState({ activeId: document.id, documents: [document] })
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
        navigator.clipboard.writeText(activeDocument?.code ?? '').then(
            () => toast.success('Copied to clipboard'),
            () => toast.error('Failed to copy'),
        )
    }

    function downloadCode() {
        try {
            saveAs(new Blob([activeDocument?.code ?? ''], { type: 'text/plain;charset=utf-8' }), downloadFilename)
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
            if (activeDocument) {
                updateDocument(activeDocument.id, { code: text })
            }
            toast.success(`Loaded ${file.name}`)
        }
        reader.onerror = () => {
            toast.error('Failed to read file')
        }
        reader.readAsText(file)
    }

    return (
        <TooltipProvider>
            <div className="flex h-full min-h-0 flex-col">
                <DocumentTitle title={documentName} />
                <header
                    className={cn(
                        'flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border pb-2',
                        variant === 'fullscreen' && 'pt-2 px-2',
                    )}
                >
                    <h1 className="sr-only">{documentName}</h1>
                    <div className="flex min-w-0 items-center">
                        <Input
                            ref={nameInputRef}
                            value={activeDocument?.name ?? ''}
                            onChange={(event) => handleNameChange(event.target.value)}
                            onBlur={commitDocumentName}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.currentTarget.blur()
                                }
                            }}
                            aria-label="Document name"
                            disabled={!activeDocument}
                            spellCheck={false}
                            className="h-7 w-40 rounded-r-none px-2 text-sm focus-visible:z-10 md:text-sm"
                        />
                        <ButtonGroup className="-ml-px">
                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon-sm"
                                                className="rounded-none"
                                                aria-label="Select document"
                                                disabled={!editorState}
                                            >
                                                <ChevronDownIcon />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Select document</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuRadioGroup
                                        value={editorState?.activeId}
                                        onValueChange={selectDocument}
                                    >
                                        {editorState?.documents.map((document) => (
                                            <DropdownMenuRadioItem key={document.id} value={document.id} className="gap-2">
                                                <DevIcon proglang={document.proglang} size={14} />
                                                <span className="truncate">{document.name.trim() || 'Untitled'}</span>
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        disabled={!editorState || editorState.documents.length < 2}
                                        onSelect={deleteActiveDocument}
                                    >
                                        <FileXIcon aria-hidden />
                                        Delete document
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={!editorState} onSelect={deleteAllDocuments}>
                                        <FolderXIcon aria-hidden />
                                        Delete all documents
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <ToolbarIconButton label="New document" onClick={addDocument} disabled={!editorState}>
                                <PlusIcon />
                            </ToolbarIconButton>
                        </ButtonGroup>
                    </div>
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
                                                <DevIcon proglang={activeDocument?.proglang ?? DEFAULT_PROGLANG} size={16} />
                                                <span className="truncate">
                                                    {formatProglangName(activeDocument?.proglang ?? DEFAULT_PROGLANG)}
                                                </span>
                                                <ChevronDownIcon className="size-4 shrink-0 opacity-60" aria-hidden />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Programming language</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuRadioGroup
                                        value={activeDocument?.proglang ?? DEFAULT_PROGLANG}
                                        onValueChange={handleProglangChange}
                                    >
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
                    {compilersLoaded && activeDocument ? (
                        <MonacoEditor
                            key={activeDocument.id}
                            height="100%"
                            beforeMount={handleBeforeMount}
                            onMount={handleMount}
                            language={language}
                            value={activeDocument.code}
                            onChange={(value) => handleCodeChange(activeDocument.id, value)}
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
