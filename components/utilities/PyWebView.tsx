'use client'

import { ClipboardIcon, EraserIcon, FolderCodeIcon, PencilIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ComponentProps, type RefObject } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { pyWebDemos } from '@/lib/pyweb/demos'
import { decodeCodeParam, decodeSolutionParam, loadSkulpt, runProgram } from '@/lib/pyweb/runtime'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center">
            <Spinner className="size-6" />
        </div>
    ),
})

const CANVAS_ID = 'pyweb-canvas'

type BlockTone = 'banner' | 'stdout' | 'input' | 'stderr'

type Block = {
    id: number
    tone: BlockTone
    text: string
}

const toneClass: Record<BlockTone, string> = {
    banner: 'text-muted-foreground',
    stdout: 'text-foreground',
    input: 'text-primary',
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

export function PyWebView() {
    const searchParams = useSearchParams()
    const codeParam = searchParams.get('code')
    const solParam = searchParams.get('sol')
    const hideTurtle = searchParams.has('ht')
    const initialCode = useMemo(() => decodeCodeParam(codeParam), [codeParam])
    const solution = useMemo(() => decodeSolutionParam(solParam), [solParam])

    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [code, setCode] = useState(initialCode)
    const [blocks, setBlocks] = useState<Block[]>([])
    const [runtimeStatus, setRuntimeStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [runtimeError, setRuntimeError] = useState<string | null>(null)
    const [attempt, setAttempt] = useState(0)
    const [running, setRunning] = useState(false)
    const [inputOpen, setInputOpen] = useState(false)
    const [inputPrompt, setInputPrompt] = useState('')
    const [inputValue, setInputValue] = useState('')

    const appliedCodeParam = useRef(codeParam)
    const nextBlockId = useRef(1)
    const runningRef = useRef(false)
    const mountedRef = useRef(true)
    const logRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const inputResolver = useRef<((value: string) => void) | null>(null)
    const appendRef = useRef<(tone: BlockTone, text: string) => void>(() => {})

    const editorTheme = mounted && resolvedTheme === 'dark' ? 'vs-dark' : 'vs'

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
        if (appliedCodeParam.current === codeParam) return
        appliedCodeParam.current = codeParam
        setCode(initialCode)
    }, [codeParam, initialCode])

    useEffect(() => {
        const log = logRef.current
        if (log) log.scrollTop = log.scrollHeight
    }, [blocks])

    useEffect(() => {
        let cancelled = false
        setRuntimeStatus('loading')
        setRuntimeError(null)
        loadSkulpt().then(
            () => {
                if (!cancelled) setRuntimeStatus('ready')
            },
            (error: unknown) => {
                if (cancelled) return
                setRuntimeStatus('error')
                setRuntimeError(error instanceof Error ? error.message : 'Could not load PyWeb')
            },
        )
        return () => {
            cancelled = true
        }
    }, [attempt])

    function clearCanvas() {
        const canvas = document.getElementById(CANVAS_ID)
        if (canvas) canvas.innerHTML = ''
    }

    function clearOutput() {
        setBlocks([])
        clearCanvas()
    }

    function resetProgram() {
        setCode(initialCode)
        clearOutput()
    }

    function showSolution() {
        if (solution == null) return
        setCode(solution)
        clearOutput()
    }

    function settleInput(value: string) {
        const resolve = inputResolver.current
        if (!resolve) return
        inputResolver.current = null
        setInputOpen(false)
        setInputValue('')
        resolve(value)
    }

    function askInput(prompt: string): Promise<string> {
        appendRef.current('stdout', prompt)
        setInputPrompt(prompt)
        setInputValue('')
        setInputOpen(true)
        return new Promise((resolve) => {
            inputResolver.current = (value) => {
                appendRef.current('input', `${value}\n`)
                resolve(value)
            }
        })
    }

    async function run() {
        if (runningRef.current || runtimeStatus !== 'ready') return
        runningRef.current = true
        setRunning(true)
        try {
            await runProgram(code, {
                canvasId: CANVAS_ID,
                output: (text) => appendRef.current('stdout', text),
                input: askInput,
            })
            appendRef.current('banner', 'End of program\n')
        } catch (error) {
            appendRef.current('stderr', `${error instanceof Error ? error.message : String(error)}\n`)
        } finally {
            runningRef.current = false
            if (mountedRef.current) setRunning(false)
        }
    }

    function copyProgram() {
        navigator.clipboard.writeText(code).then(
            () => toast.success('Copied to clipboard'),
            () => toast.error('Failed to copy'),
        )
    }

    function handleEditorMount(editor: { focus: () => void }) {
        editor.focus()
    }

    return (
        <div
            className="flex h-[calc(100dvh-13rem)] min-h-96 flex-col overflow-hidden rounded-xl border border-border bg-card"
            role="region"
            aria-label="PyWeb"
            aria-busy={runtimeStatus === 'loading' || running}
        >
            <h1 className="sr-only">PyWeb</h1>
            <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
                <ResizablePanel defaultSize={50} minSize={20} className="flex min-h-0 flex-col">
                    <div className="flex shrink-0 items-center justify-center gap-3 border-b border-border px-3 py-2">
                        <TooltipProvider>
                            <ButtonGroup>
                                <ToolbarIconButton
                                    label="Run"
                                    onClick={() => void run()}
                                    disabled={runtimeStatus !== 'ready' || running}
                                >
                                    {running ? <Spinner /> : <PlayIcon />}
                                </ToolbarIconButton>
                                <ToolbarIconButton label="Clear" onClick={clearOutput}>
                                    <EraserIcon />
                                </ToolbarIconButton>
                                <ToolbarIconButton label="Reset" onClick={resetProgram}>
                                    <RotateCcwIcon />
                                </ToolbarIconButton>
                                <ToolbarIconButton label="Copy program to clipboard" onClick={copyProgram}>
                                    <ClipboardIcon />
                                </ToolbarIconButton>
                                {solution != null ? (
                                    <ToolbarIconButton label="Show solution" onClick={showSolution}>
                                        <PencilIcon />
                                    </ToolbarIconButton>
                                ) : null}
                                <DropdownMenu>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    aria-label="Sample programs"
                                                >
                                                    <FolderCodeIcon />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Sample programs</TooltipContent>
                                    </Tooltip>
                                    <DropdownMenuContent align="start" className="w-56!">
                                        {pyWebDemos.map((demo) => (
                                            <DropdownMenuItem
                                                key={demo.name}
                                                onSelect={() => setCode(`# ${demo.name}\n${demo.code}`)}
                                            >
                                                {demo.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </ButtonGroup>
                        </TooltipProvider>
                        {runtimeStatus === 'loading' ? (
                            <p className="text-xs text-muted-foreground">Loading Python…</p>
                        ) : null}
                        {runtimeStatus === 'error' ? (
                            <p className="flex min-w-0 items-center gap-2 text-xs text-destructive">
                                <span className="truncate">{runtimeError ?? 'Could not load Python.'}</span>
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
                            language="python"
                            theme={editorTheme}
                            value={code}
                            onChange={(value) => setCode(value ?? '')}
                            onMount={handleEditorMount}
                            options={{
                                ariaLabel: 'Python editor',
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 8 },
                            }}
                        />
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={20} className="flex min-h-0 flex-col">
                    {hideTurtle ? (
                        <ConsolePane logRef={logRef} blocks={blocks} />
                    ) : (
                        <ResizablePanelGroup orientation="vertical" className="h-full">
                            <ResizablePanel defaultSize={45} minSize={15} className="flex min-h-0 flex-col">
                                <ConsolePane logRef={logRef} blocks={blocks} />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={55} minSize={15} className="flex min-h-0 flex-col">
                                <div
                                    id={CANVAS_ID}
                                    className="min-h-0 w-full flex-1 bg-white"
                                    role="region"
                                    aria-label="Turtle graphics"
                                />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>

            <Dialog
                open={inputOpen}
                onOpenChange={(open) => {
                    if (!open) settleInput('')
                }}
            >
                <DialogContent
                    onOpenAutoFocus={(event) => {
                        event.preventDefault()
                        inputRef.current?.focus()
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Input</DialogTitle>
                        <DialogDescription>{inputPrompt || 'Enter a value'}</DialogDescription>
                    </DialogHeader>
                    <Input
                        ref={inputRef}
                        id="pyweb-input"
                        value={inputValue}
                        aria-label={inputPrompt || 'Program input'}
                        onChange={(event) => setInputValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault()
                                settleInput(inputValue)
                            }
                        }}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => settleInput('')}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={() => settleInput(inputValue)}>
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ConsolePane({ logRef, blocks }: { logRef: RefObject<HTMLDivElement | null>; blocks: Block[] }) {
    return (
        <div ref={logRef} role="log" aria-label="Program output" className="min-h-0 flex-1 overflow-auto">
            <pre id="pyweb-console" className="px-4 py-3 font-mono text-sm leading-6 whitespace-pre-wrap break-words">
                {blocks.map((block) => (
                    <span key={block.id} className={toneClass[block.tone]}>
                        {block.text}
                    </span>
                ))}
            </pre>
        </div>
    )
}
