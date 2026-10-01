'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PyodideHelpDialog } from '@/components/utilities/PyodideHelpDialog'
import { createPyodideSession, loadPyodideRuntime, setPyodideStdin, type PyodideSession } from '@/lib/pyodideRuntime'
import { EraserIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'

type BlockTone = 'banner' | 'input' | 'stdout' | 'stderr'

type Block = {
    id: number
    tone: BlockTone
    text: string
}

const toneClass: Record<BlockTone, string> = {
    banner: 'text-muted-foreground',
    input: 'text-foreground',
    stdout: 'text-foreground',
    stderr: 'text-destructive',
}

const HISTORY_LIMIT = 200

export function PyodideView() {
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [error, setError] = useState<string | null>(null)
    const [attempt, setAttempt] = useState(0)
    const [blocks, setBlocks] = useState<Block[]>([])
    const [draft, setDraft] = useState('')
    const [incomplete, setIncomplete] = useState(false)
    const [busy, setBusy] = useState(false)

    const sessionRef = useRef<PyodideSession | null>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const logRef = useRef<HTMLDivElement>(null)
    const mountedRef = useRef(true)
    const busyRef = useRef(false)
    const incompleteRef = useRef(false)
    const nextBlockId = useRef(1)
    const historyRef = useRef<string[]>([])
    const historyPos = useRef<number | null>(null)
    const historyStash = useRef('')
    const appendRef = useRef<(tone: BlockTone, text: string) => void>(() => {})

    appendRef.current = (tone, text) => {
        if (!mountedRef.current || !text) return
        setBlocks((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.tone === tone && tone !== 'input') {
                return [...prev.slice(0, -1), { ...last, text: last.text + text }]
            }
            const id = nextBlockId.current++
            return [...prev, { id, tone, text }]
        })
    }

    useEffect(() => {
        const log = logRef.current
        if (log) log.scrollTop = log.scrollHeight
    }, [blocks])

    useEffect(() => {
        const input = inputRef.current
        if (!input) return
        input.style.height = '0px'
        input.style.height = `${input.scrollHeight}px`
    }, [draft, status])

    useEffect(() => {
        mountedRef.current = true
        let cancelled = false
        setBlocks([])
        setDraft('')
        setIncomplete(false)
        incompleteRef.current = false
        nextBlockId.current = 1

        setPyodideStdin(() => {
            const value = window.prompt('input()')
            const line = value ?? ''
            appendRef.current('stdout', `${line}\n`)
            return `${line}\n`
        })

        ;(async () => {
            try {
                const pyodide = await loadPyodideRuntime()
                if (cancelled) return
                const session = createPyodideSession(pyodide, {
                    stdout: (text) => appendRef.current('stdout', text),
                    stderr: (text) => appendRef.current('stderr', text),
                })
                if (cancelled) {
                    session.destroy()
                    return
                }
                sessionRef.current = session
                appendRef.current('banner', session.banner)
                setStatus('ready')
                requestAnimationFrame(() => inputRef.current?.focus())
            } catch (loadError) {
                if (cancelled) return
                setError(loadError instanceof Error ? loadError.message : 'Could not load Pyodide.')
                setStatus('error')
            }
        })()

        return () => {
            cancelled = true
            mountedRef.current = false
            sessionRef.current?.destroy()
            sessionRef.current = null
        }
    }, [attempt])

    function remember(line: string) {
        if (!line) return
        const history = historyRef.current
        if (history[history.length - 1] === line) return
        history.push(line)
        if (history.length > HISTORY_LIMIT) history.shift()
        historyPos.current = null
    }

    function replaceDraft(value: string, cursor = value.length) {
        setDraft(value)
        requestAnimationFrame(() => {
            const input = inputRef.current
            if (!input) return
            input.setSelectionRange(cursor, cursor)
        })
    }

    async function submitLine(line: string) {
        const session = sessionRef.current
        if (!session) return
        const prompt = incompleteRef.current ? '... ' : '>>> '
        appendRef.current('input', `${prompt}${line}\n`)
        try {
            const syntax = await session.pushLine(line)
            if (!mountedRef.current) return
            const nextIncomplete = syntax === 'incomplete'
            incompleteRef.current = nextIncomplete
            setIncomplete(nextIncomplete)
        } catch (runError) {
            if (!mountedRef.current) return
            const message = runError instanceof Error ? runError.message : String(runError)
            appendRef.current('stderr', `${message}\n`)
            incompleteRef.current = false
            setIncomplete(false)
        }
    }

    function runLines(lines: string[]) {
        if (busyRef.current || !sessionRef.current || lines.length === 0) return
        busyRef.current = true
        let showedBusy = false
        const timer = window.setTimeout(() => {
            showedBusy = true
            if (mountedRef.current) setBusy(true)
        }, 150)
        void (async () => {
            try {
                for (const line of lines) {
                    remember(line)
                    await submitLine(line)
                    if (!mountedRef.current) return
                }
            } finally {
                window.clearTimeout(timer)
                busyRef.current = false
                if (mountedRef.current && showedBusy) setBusy(false)
            }
        })()
    }

    function submitDraft() {
        if (busyRef.current || !sessionRef.current) return
        const line = draft
        setDraft('')
        runLines([line])
    }

    function interrupt() {
        const session = sessionRef.current
        if (!session || busyRef.current) return
        if (draft) appendRef.current('input', `${incompleteRef.current ? '... ' : '>>> '}${draft}\n`)
        session.clearBuffer()
        incompleteRef.current = false
        setIncomplete(false)
        setDraft('')
        historyPos.current = null
        appendRef.current('stderr', 'KeyboardInterrupt\n')
    }

    function clearConsole() {
        const session = sessionRef.current
        if (!session) return
        session.clearBuffer()
        incompleteRef.current = false
        setIncomplete(false)
        setDraft('')
        historyPos.current = null
        nextBlockId.current = 1
        setBlocks([{ id: nextBlockId.current++, tone: 'banner', text: session.banner }])
        inputRef.current?.focus()
    }

    function completeAtCursor() {
        const session = sessionRef.current
        const input = inputRef.current
        if (!session || !input || busyRef.current) return
        const cursor = input.selectionStart ?? draft.length
        const before = draft.slice(0, cursor)
        const after = draft.slice(cursor)
        if (before.trim() === '') {
            replaceDraft(`${before}    ${after}`, before.length + 4)
            return
        }
        let result: { completions: string[]; start: number }
        try {
            result = session.complete(before)
        } catch {
            return
        }
        const { completions, start } = result
        if (completions.length === 0) return
        const token = before.slice(start)
        const prefix = sharedPrefix(completions)
        if (completions.length === 1 || prefix.length > token.length) {
            const insertion = completions.length === 1 ? completions[0] : prefix
            replaceDraft(`${before.slice(0, start)}${insertion}${after}`, start + insertion.length)
            return
        }
        appendRef.current('stdout', `${completions.join('  ')}\n`)
    }

    function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.nativeEvent.isComposing) return
        if (busyRef.current) {
            if (event.key === 'Enter') event.preventDefault()
            return
        }
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submitDraft()
            return
        }
        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault()
            completeAtCursor()
            return
        }
        if (event.key === 'c' && event.ctrlKey && !event.metaKey && !event.altKey) {
            const input = inputRef.current
            if (input && input.selectionStart !== input.selectionEnd) return
            event.preventDefault()
            interrupt()
            return
        }
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
        const input = inputRef.current
        if (!input) return
        const atStart = input.selectionStart === 0 && input.selectionEnd === 0
        const atEnd = input.selectionStart === draft.length && input.selectionEnd === draft.length
        if (event.key === 'ArrowUp' && !atStart) return
        if (event.key === 'ArrowDown' && !atEnd) return
        const history = historyRef.current
        if (history.length === 0) return
        event.preventDefault()
        if (event.key === 'ArrowUp') {
            if (historyPos.current === null) {
                historyStash.current = draft
                historyPos.current = history.length - 1
            } else if (historyPos.current > 0) {
                historyPos.current -= 1
            }
            replaceDraft(history[historyPos.current] ?? '')
            return
        }
        if (historyPos.current === null) return
        if (historyPos.current < history.length - 1) {
            historyPos.current += 1
            replaceDraft(history[historyPos.current] ?? '')
            return
        }
        historyPos.current = null
        replaceDraft(historyStash.current)
    }

    function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
        const pasted = event.clipboardData.getData('text').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        if (!pasted.includes('\n') || busyRef.current || !sessionRef.current) return
        event.preventDefault()
        const input = inputRef.current
        const start = input?.selectionStart ?? draft.length
        const end = input?.selectionEnd ?? draft.length
        const merged = `${draft.slice(0, start)}${pasted}${draft.slice(end)}`
        const finished = merged.endsWith('\n')
        const parts = merged.replace(/\n$/, '').split('\n')
        if (!finished) {
            const rest = parts.pop() ?? ''
            setDraft(rest)
            runLines(parts)
            return
        }
        setDraft('')
        runLines(parts)
    }

    const prompt = incomplete ? '... ' : '>>> '

    return (
        <div
            className="flex h-[calc(100dvh-13rem)] min-h-96 flex-col overflow-hidden rounded-xl border border-border bg-card"
            role="region"
            aria-label="Pyodide Python REPL"
            aria-busy={status === 'loading' || busy}
        >
            <h1 className="sr-only">Pyodide</h1>
            {status === 'loading' ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <Spinner className="size-6" />
                    <div>
                        <p className="text-sm font-medium text-foreground">Loading Pyodide…</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Downloading the Python runtime, about 10 MB.
                        </p>
                    </div>
                </div>
            ) : null}
            {status === 'error' ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-sm font-medium text-foreground">Could not load Pyodide.</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setError(null)
                            setStatus('loading')
                            setAttempt((value) => value + 1)
                        }}
                    >
                        Try again
                    </Button>
                </div>
            ) : null}
            {status === 'ready' ? (
                <>
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
                        <p id="pyodide-input-hint" className="min-w-0 text-xs text-muted-foreground">
                            Enter runs the line. Shift+Enter inserts a newline. Tab completes. Ctrl+C cancels the input.
                        </p>
                        <TooltipProvider>
                            <div className="flex shrink-0 items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 shrink-0 text-muted-foreground"
                                            onClick={clearConsole}
                                            aria-label="Clear console"
                                        >
                                            <EraserIcon aria-hidden />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Clear console</TooltipContent>
                                </Tooltip>
                                <PyodideHelpDialog />
                            </div>
                        </TooltipProvider>
                    </div>
                    <div ref={logRef} role="log" aria-label="Python session" className="min-h-0 flex-1 overflow-auto">
                        <pre className="px-4 py-3 font-mono text-sm leading-6 whitespace-pre-wrap break-words">
                            {blocks.map((block) => (
                                <span key={block.id} className={toneClass[block.tone]}>
                                    {block.text}
                                </span>
                            ))}
                        </pre>
                    </div>
                    <form
                        className="flex shrink-0 items-start gap-2 border-t border-border px-4 py-3"
                        onSubmit={(event) => {
                            event.preventDefault()
                            submitDraft()
                        }}
                    >
                        <label htmlFor="pyodide-input" className="sr-only">
                            Python statement
                        </label>
                        <span
                            aria-hidden
                            className="pt-px font-mono text-sm leading-6 text-indigo-600 dark:text-indigo-400"
                        >
                            {prompt}
                        </span>
                        <textarea
                            id="pyodide-input"
                            ref={inputRef}
                            value={draft}
                            rows={1}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoCorrect="off"
                            autoComplete="off"
                            placeholder={busy ? 'Running…' : 'Type Python and press Enter'}
                            aria-describedby="pyodide-input-hint"
                            className="max-h-40 min-h-6 w-full flex-1 resize-none overflow-y-auto bg-transparent font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                            onChange={(event) => {
                                historyPos.current = null
                                setDraft(event.target.value)
                            }}
                            onKeyDown={onKeyDown}
                            onPaste={onPaste}
                        />
                        {busy ? <Spinner className="mt-1 size-4 shrink-0" /> : null}
                    </form>
                </>
            ) : null}
        </div>
    )
}

function sharedPrefix(values: string[]): string {
    let prefix = values[0] ?? ''
    for (const value of values.slice(1)) {
        let index = 0
        while (index < prefix.length && index < value.length && prefix[index] === value[index]) index += 1
        prefix = prefix.slice(0, index)
        if (!prefix) break
    }
    return prefix
}
