'use client'

import {
    BugIcon,
    ClipboardIcon,
    EraserIcon,
    FolderCodeIcon,
    PlayIcon,
    RotateCcwIcon,
    SquareIcon,
    StepForwardIcon,
} from 'lucide-react'
import type { editor } from 'monaco-editor'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ComponentProps, type RefObject } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { JsCppHelpDialog } from '@/components/interpreters/JsCppHelpDialog'
import { defaultJsCppInput, defaultJsCppProgram, jsCppDemos } from '@/lib/jscpp/demos'
import {
    loadJsCpp,
    readJsCppExitCode,
    readJsCppLine,
    readJsCppVariables,
    runJsCpp,
    startJsCppDebugger,
    type JsCppDebugger,
    type JsCppVariable,
} from '@/lib/jscpp/runtime'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center">
            <Spinner className="size-6" />
        </div>
    ),
})

type BlockTone = 'banner' | 'stdout' | 'stderr'

type Block = {
    id: number
    tone: BlockTone
    text: string
}

type ShownVariable = JsCppVariable & {
    updated: boolean
}

const toneClass: Record<BlockTone, string> = {
    banner: 'text-muted-foreground',
    stdout: 'text-foreground',
    stderr: 'text-destructive',
}

type ToolbarIconButtonProps = ComponentProps<typeof Button> & {
    label: string
}

function ToolbarIconButton({ label, children, ...props }: ToolbarIconButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon-sm" aria-label={label} {...props}>
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
    )
}

function errorText(error: unknown): string {
    if (error instanceof Error && error.message) return error.message
    return String(error)
}

function sameVariable(previous: JsCppVariable[], next: JsCppVariable): boolean {
    const prior = previous.find((entry) => entry.name === next.name)
    return prior != null && prior.value === next.value && prior.type === next.type
}

export function JsCppView() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [code, setCode] = useState(defaultJsCppProgram)
    const [input, setInput] = useState(defaultJsCppInput)
    const [blocks, setBlocks] = useState<Block[]>([])
    const [runtimeStatus, setRuntimeStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [runtimeError, setRuntimeError] = useState<string | null>(null)
    const [attempt, setAttempt] = useState(0)
    const [running, setRunning] = useState(false)
    const [debugging, setDebugging] = useState(false)
    const [variables, setVariables] = useState<ShownVariable[]>([])
    const [highlightLine, setHighlightLine] = useState<number | null>(null)

    const nextBlockId = useRef(1)
    const runningRef = useRef(false)
    const debuggingRef = useRef(false)
    const mountedRef = useRef(true)
    const logRef = useRef<HTMLDivElement>(null)
    const debuggerRef = useRef<JsCppDebugger | null>(null)
    const sourceBackup = useRef<string | null>(null)
    const lastVars = useRef<JsCppVariable[]>([])
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null)
    const appendRef = useRef<(tone: BlockTone, text: string) => void>(() => {})

    const editorTheme = mounted && resolvedTheme === 'dark' ? 'vs-dark' : 'vs'
    const busy = runtimeStatus === 'loading' || running

    appendRef.current = (tone, text) => {
        if (!mountedRef.current || !text) return
        setBlocks((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.tone === tone && tone === 'stdout') {
                return [...prev.slice(0, -1), { ...last, text: last.text + text }]
            }
            const id = nextBlockId.current++
            return [...prev, { id, tone, text }]
        })
    }

    useEffect(() => {
        setMounted(true)
        mountedRef.current = true
        return () => {
            mountedRef.current = false
        }
    }, [])

    useEffect(() => {
        debuggingRef.current = debugging
    }, [debugging])

    useEffect(() => {
        const log = logRef.current
        if (log) log.scrollTop = log.scrollHeight
    }, [blocks])

    useEffect(() => {
        let cancelled = false
        setRuntimeStatus('loading')
        setRuntimeError(null)
        loadJsCpp().then(
            () => {
                if (!cancelled) setRuntimeStatus('ready')
            },
            (error: unknown) => {
                if (cancelled) return
                setRuntimeStatus('error')
                setRuntimeError(errorText(error))
            },
        )
        return () => {
            cancelled = true
        }
    }, [attempt])

    useEffect(() => {
        const editorInstance = editorRef.current
        if (!editorInstance) return
        const decorations = decorationsRef.current ?? editorInstance.createDecorationsCollection()
        decorationsRef.current = decorations
        if (highlightLine == null) {
            decorations.clear()
            return
        }
        decorations.set([
            {
                range: {
                    startLineNumber: highlightLine,
                    startColumn: 1,
                    endLineNumber: highlightLine,
                    endColumn: 1,
                },
                options: {
                    isWholeLine: true,
                    className: 'jscpp-debug-line',
                },
            },
        ])
        editorInstance.revealLineInCenter(highlightLine)
    }, [highlightLine, code])

    function clearOutput() {
        setBlocks([])
    }

    function leaveDebug(restoreSource: boolean) {
        debuggerRef.current = null
        lastVars.current = []
        setDebugging(false)
        setVariables([])
        setHighlightLine(null)
        if (restoreSource && sourceBackup.current != null) setCode(sourceBackup.current)
        sourceBackup.current = null
    }

    function refreshPause(markChanges: boolean) {
        const dbg = debuggerRef.current
        if (!dbg) return
        const next = readJsCppVariables(dbg)
        const previous = lastVars.current
        setVariables(
            next.map((entry) => ({
                ...entry,
                updated: markChanges && !sameVariable(previous, entry),
            })),
        )
        lastVars.current = next
        setHighlightLine(readJsCppLine(dbg))
    }

    function stepDebugger(markChanges: boolean): boolean {
        const dbg = debuggerRef.current
        if (!dbg) return false
        const done = dbg.continue()
        if (done !== false) {
            const exitCode = readJsCppExitCode(done)
            leaveDebug(true)
            appendRef.current('banner', `\nprogram exited with code ${exitCode == null ? '?' : exitCode}.\n`)
            return true
        }
        refreshPause(markChanges)
        return false
    }

    function stopDebug() {
        if (!debuggingRef.current) return
        leaveDebug(true)
    }

    function resetProgram() {
        leaveDebug(false)
        setCode(defaultJsCppProgram)
        setInput(defaultJsCppInput)
        clearOutput()
    }

    function loadSample(demo: (typeof jsCppDemos)[number]) {
        leaveDebug(false)
        setCode(demo.code)
        setInput(demo.input)
        clearOutput()
    }

    async function run() {
        if (runningRef.current || debuggingRef.current || runtimeStatus !== 'ready') return
        runningRef.current = true
        setRunning(true)
        clearOutput()
        await new Promise((resolve) => setTimeout(resolve, 0))
        const started = performance.now()
        try {
            const exitCode = await runJsCpp(code, input, (text) => appendRef.current('stdout', text))
            const elapsed = Math.round(performance.now() - started)
            appendRef.current('banner', `\nprogram exited with code ${exitCode} in ${elapsed}ms.\n`)
        } catch (error) {
            appendRef.current('stderr', `${errorText(error)}\n`)
        } finally {
            runningRef.current = false
            if (mountedRef.current) setRunning(false)
        }
    }

    async function debug() {
        if (runningRef.current || debuggingRef.current || runtimeStatus !== 'ready') return
        debuggingRef.current = true
        clearOutput()
        const backup = code
        try {
            const dbg = await startJsCppDebugger(backup, input, (text) => appendRef.current('stdout', text))
            if (!mountedRef.current) {
                debuggingRef.current = false
                return
            }
            sourceBackup.current = backup
            debuggerRef.current = dbg
            setCode(dbg.src || backup)
            setDebugging(true)
        } catch (error) {
            debuggingRef.current = false
            appendRef.current('stderr', `${errorText(error)}\n`)
            return
        }
        try {
            stepDebugger(false)
        } catch (error) {
            appendRef.current('stderr', `${errorText(error)}\n`)
            leaveDebug(true)
        }
    }

    function step() {
        if (!debuggingRef.current) return
        try {
            stepDebugger(true)
        } catch (error) {
            appendRef.current('stderr', `${errorText(error)}\n`)
            leaveDebug(true)
        }
    }

    function copyProgram() {
        const text = debuggingRef.current && sourceBackup.current != null ? sourceBackup.current : code
        navigator.clipboard.writeText(text).then(
            () => toast.success('Copied to clipboard'),
            () => toast.error('Failed to copy'),
        )
    }

    function handleEditorMount(instance: editor.IStandaloneCodeEditor) {
        editorRef.current = instance
        decorationsRef.current = instance.createDecorationsCollection()
        instance.focus()
    }

    return (
        <div
            className="flex h-[calc(100dvh-13rem)] min-h-96 flex-col overflow-hidden rounded-xl border border-border bg-card"
            role="region"
            aria-label="JSCPP"
            aria-busy={busy}
        >
            <h1 className="sr-only">JSCPP</h1>
            <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
                <ResizablePanel defaultSize={55} minSize={20} className="flex min-h-0 flex-col">
                    <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-b border-border px-3 py-2">
                        <TooltipProvider>
                            <ButtonGroup>
                                <ToolbarIconButton
                                    label="Run"
                                    onClick={() => void run()}
                                    disabled={runtimeStatus !== 'ready' || running || debugging}
                                >
                                    {running ? <Spinner /> : <PlayIcon />}
                                </ToolbarIconButton>
                            </ButtonGroup>
                            <ButtonGroup>
                                <ToolbarIconButton
                                    label="Run with debug"
                                    onClick={() => void debug()}
                                    disabled={runtimeStatus !== 'ready' || running || debugging}
                                >
                                    <BugIcon />
                                </ToolbarIconButton>
                                <ToolbarIconButton label="Next" onClick={step} disabled={!debugging}>
                                    <StepForwardIcon />
                                </ToolbarIconButton>
                                <ToolbarIconButton label="Stop" onClick={stopDebug} disabled={!debugging}>
                                    <SquareIcon />
                                </ToolbarIconButton>
                            </ButtonGroup>
                            <ButtonGroup>
                                <ToolbarIconButton label="Clear" onClick={clearOutput} disabled={running}>
                                    <EraserIcon />
                                </ToolbarIconButton>
                                <ToolbarIconButton label="Reset" onClick={resetProgram} disabled={running}>
                                    <RotateCcwIcon />
                                </ToolbarIconButton>
                                <ToolbarIconButton label="Copy program to clipboard" onClick={copyProgram}>
                                    <ClipboardIcon />
                                </ToolbarIconButton>
                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    aria-label="Sample programs"
                                                    disabled={running}
                                                >
                                                    <FolderCodeIcon />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Sample programs</TooltipContent>
                                    </Tooltip>
                                    <DropdownMenuContent align="start" className="w-56!">
                                        {jsCppDemos.map((demo) => (
                                            <DropdownMenuItem key={demo.name} onSelect={() => loadSample(demo)}>
                                                {demo.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </ButtonGroup>
                            <JsCppHelpDialog />
                        </TooltipProvider>
                        {runtimeStatus === 'loading' ? (
                            <p className="text-xs text-muted-foreground">Loading C++…</p>
                        ) : null}
                        {debugging ? (
                            <p className="text-xs text-muted-foreground" role="status">
                                Debugging
                            </p>
                        ) : null}
                        {runtimeStatus === 'error' ? (
                            <p className="flex min-w-0 items-center gap-2 text-xs text-destructive">
                                <span className="truncate">{runtimeError ?? 'Could not load JSCPP.'}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => setAttempt((value) => value + 1)}
                                >
                                    Try again
                                </Button>
                            </p>
                        ) : null}
                    </div>
                    <div className="min-h-0 flex-1">
                        <MonacoEditor
                            height="100%"
                            language="cpp"
                            theme={editorTheme}
                            value={code}
                            onChange={(value) => {
                                if (!debuggingRef.current) setCode(value ?? '')
                            }}
                            onMount={handleEditorMount}
                            options={{
                                ariaLabel: 'C++ editor',
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 8 },
                                readOnly: debugging,
                            }}
                        />
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={45} minSize={20} className="flex min-h-0 flex-col">
                    <ResizablePanelGroup orientation="vertical" className="h-full">
                        <ResizablePanel defaultSize={40} minSize={15} className="flex min-h-0 flex-col">
                            <ConsolePane logRef={logRef} blocks={blocks} />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={30} minSize={15} className="flex min-h-0 flex-col">
                            <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
                                <label htmlFor="jscpp-stdin" className="mb-1 shrink-0 text-xs text-muted-foreground">
                                    Standard input
                                </label>
                                <Textarea
                                    id="jscpp-stdin"
                                    value={input}
                                    spellCheck={false}
                                    autoComplete="off"
                                    disabled={running || debugging}
                                    aria-label="Standard input"
                                    className="min-h-0 flex-1 resize-none overflow-auto font-mono text-sm field-sizing-fixed"
                                    onChange={(event) => setInput(event.target.value)}
                                />
                            </div>
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={30} minSize={15} className="flex min-h-0 flex-col">
                            <VariablesPane variables={variables} />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

function ConsolePane({ logRef, blocks }: { logRef: RefObject<HTMLDivElement | null>; blocks: Block[] }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
            <p id="jscpp-stdout-label" className="mb-1 shrink-0 text-xs text-muted-foreground">
                Standard output
            </p>
            <div
                ref={logRef}
                role="log"
                aria-labelledby="jscpp-stdout-label"
                className="min-h-0 flex-1 overflow-auto rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-sm leading-6 dark:bg-input/30"
            >
                <pre className="whitespace-pre-wrap break-words">
                    {blocks.map((block) => (
                        <span key={block.id} className={toneClass[block.tone]}>
                            {block.text}
                        </span>
                    ))}
                </pre>
            </div>
        </div>
    )
}

function VariablesPane({ variables }: { variables: ShownVariable[] }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
            <h2 id="jscpp-locals-heading" className="mb-1 shrink-0 text-xs text-muted-foreground">
                Local variables
            </h2>
            <div
                role="region"
                aria-labelledby="jscpp-locals-heading"
                className="min-h-0 flex-1 overflow-auto rounded-lg border border-input bg-transparent text-sm dark:bg-input/30"
            >
                {variables.length === 0 ? (
                    <p className="px-2.5 py-2 text-muted-foreground">No local variables</p>
                ) : (
                    <table className="w-full">
                        <thead className="text-left text-xs text-muted-foreground">
                            <tr>
                                <th scope="col" className="px-2.5 py-1 font-medium">
                                    Name
                                </th>
                                <th scope="col" className="px-2.5 py-1 font-medium">
                                    Value
                                </th>
                                <th scope="col" className="px-2.5 py-1 font-medium">
                                    Type
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {variables.map((variable) => (
                                <tr key={variable.name} className={variable.updated ? 'bg-primary/10' : undefined}>
                                    <th scope="row" className="px-2.5 py-1 text-left font-medium">
                                        {variable.name}
                                        {variable.updated ? <span className="sr-only">, changed</span> : null}
                                    </th>
                                    <td className="px-2.5 py-1 font-mono">{variable.value || '—'}</td>
                                    <td className="px-2.5 py-1 text-muted-foreground">{variable.type || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
