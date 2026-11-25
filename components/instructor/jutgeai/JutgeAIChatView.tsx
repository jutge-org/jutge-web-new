'use client'

import { MarkdownText } from '@/components/general/MarkdownText'
import type { AIState } from '@/components/smoothui/ai-core'
import AILoader from '@/components/smoothui/ai-loader'
import AIMessage from '@/components/smoothui/ai-message'
import AIPromptInput from '@/components/smoothui/ai-prompt-input'
import AIResponse from '@/components/smoothui/ai-response'
import SiriOrb from '@/components/smoothui/siri-orb'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchInstructorApiUrl, fetchJutgeaiSupportedModels, jutgeaiChatMessages } from '@/lib/instructor/client'
import type { ChatMessage } from '@/lib/jutge_api_client'
import { UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const USAGE_JSON_START = '---USAGE_JSON_START---'
const USAGE_JSON_END = '---USAGE_JSON_END---'
const PREFERRED_MODEL = 'openai/gpt-4.1-mini'

type Phase = 'idle' | 'thinking' | 'streaming' | 'done' | 'error'

type UiMessage = {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    createdAt: number
    failed?: boolean
}

export function JutgeAIChatView() {
    const [models, setModels] = useState<string[]>([])
    const [selectedModel, setSelectedModel] = useState(PREFERRED_MODEL)
    const [messages, setMessages] = useState<UiMessage[]>([])
    const [input, setInput] = useState('')
    const [phase, setPhase] = useState<Phase>('idle')
    const idRef = useRef(0)
    const requestRef = useRef(0)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        async function loadModels() {
            const list = await fetchJutgeaiSupportedModels()
            setModels(list)
            setSelectedModel((current) => {
                if (list.length === 0) return current
                if (list.includes(current)) return current
                return list.includes(PREFERRED_MODEL) ? PREFERRED_MODEL : list[0]
            })
        }
        loadModels()
    }, [])

    useEffect(() => {
        if (phase !== 'done') return
        const timeout = setTimeout(() => setPhase('idle'), 900)
        return () => clearTimeout(timeout)
    }, [phase])

    const busy = phase === 'thinking' || phase === 'streaming'
    const orbState: AIState = phase === 'thinking' ? 'thinking' : phase
    const promptState: AIState = phase === 'thinking' ? 'streaming' : phase

    function nextId() {
        idRef.current += 1
        return `m${idRef.current}`
    }

    function replaceAssistant(requestId: number, content: string, failed = false) {
        setMessages((prev) => {
            if (requestRef.current !== requestId) return prev
            const last = prev[prev.length - 1]
            if (!last || last.role !== 'assistant') return prev
            return [...prev.slice(0, -1), { ...last, content, failed }]
        })
    }

    async function streamReply(history: UiMessage[]) {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        const requestId = ++requestRef.current
        const stillCurrent = () => requestRef.current === requestId && !controller.signal.aborted

        const assistant: UiMessage = {
            id: nextId(),
            role: 'assistant',
            content: '',
            createdAt: Date.now(),
        }
        setMessages([...history, assistant])
        setPhase('thinking')

        try {
            const apiMessages: ChatMessage[] = history.map((message) => ({
                role: message.role,
                content: message.content,
            }))
            const stream = await jutgeaiChatMessages(selectedModel, apiMessages)
            if (!stillCurrent()) return

            const apiUrl = await fetchInstructorApiUrl()
            if (!stillCurrent()) return

            const response = await fetch(`${apiUrl}/webstreams/${stream.id}`, { signal: controller.signal })
            if (!stillCurrent()) return
            if (!response.ok) {
                setPhase('error')
                replaceAssistant(requestId, `Error: ${response.status} ${response.statusText}`, true)
                return
            }
            if (!response.body) {
                setPhase('error')
                replaceAssistant(requestId, 'No response body.', true)
                return
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ''
            let started = false

            while (true) {
                const { done, value } = await reader.read()
                if (done || !stillCurrent()) break
                fullText += decoder.decode(value, { stream: true })
                const visible = visibleReply(fullText, false)
                if (!started && visible.trim()) {
                    started = true
                    setPhase('streaming')
                }
                replaceAssistant(requestId, visible)
            }

            if (!stillCurrent()) return
            replaceAssistant(requestId, visibleReply(fullText, true))
            setPhase('done')
        } catch (error) {
            if (controller.signal.aborted || requestRef.current !== requestId) return
            const message = error instanceof Error ? error.message : String(error)
            setPhase('error')
            replaceAssistant(requestId, `Error: ${message}`, true)
        }
    }

    function handleSubmit(value: string) {
        const text = value.trim()
        if (!text || !selectedModel || busy) return
        const user: UiMessage = { id: nextId(), role: 'user', content: text, createdAt: Date.now() }
        const history = [...messages, user]
        setInput('')
        void streamReply(history)
    }

    function handleStop() {
        abortRef.current?.abort()
        requestRef.current += 1
        setPhase('idle')
        setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant' && last.content.trim() === '') return prev.slice(0, -1)
            return prev
        })
    }

    function handleEdit(index: number) {
        const message = messages[index]
        if (!message || message.role !== 'user') return
        if (busy) handleStop()
        setInput(message.content)
        setMessages((prev) => prev.slice(0, index))
    }

    function handleRetry(index: number) {
        if (busy || !selectedModel) return
        const history = messages.slice(0, index)
        const previous = history[history.length - 1]
        if (!previous || previous.role !== 'user') return
        void streamReply(history)
    }

    return (
        <div className="flex min-h-[calc(100dvh-6.5rem)] flex-col">
            <div className="mx-auto flex w-full max-w-3xl grow flex-col gap-6 px-4 py-6">
                {messages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                        <div aria-hidden="true">
                            <SiriOrb size="88px" state={orbState} />
                        </div>
                        <p className="max-w-sm text-sm text-muted-foreground">Ask for help to JutgeAI</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isUser = message.role === 'user'
                        const isLast = index === messages.length - 1
                        const live = isLast && message.role === 'assistant' && busy
                        return (
                            <AIMessage
                                avatar={
                                    <span aria-hidden="true">
                                        {isUser ? (
                                            <UserMark />
                                        ) : (
                                            <SiriOrb size="28px" state={isLast ? orbState : 'idle'} />
                                        )}
                                    </span>
                                }
                                bubble={isUser}
                                copyText={message.content || undefined}
                                from={isUser ? 'user' : 'assistant'}
                                key={message.id}
                                onEdit={isUser ? () => handleEdit(index) : undefined}
                                onRetry={
                                    message.role === 'assistant' && !live && message.content
                                        ? () => handleRetry(index)
                                        : undefined
                                }
                                timestamp={formatTime(message.createdAt)}
                            >
                                {isUser ? (
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                ) : (
                                    <AssistantBody live={live} message={message} />
                                )}
                            </AIMessage>
                        )
                    })
                )}
            </div>

            <div className="sticky bottom-0 z-20 -mx-4 bg-background px-4 pt-2 pb-4 sm:-mx-6 sm:px-6">
                <div
                    className="mx-auto w-full max-w-3xl rounded-2xl p-px shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_12%,var(--blue))]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to bottom, color-mix(in oklab, white 24%, var(--blue)), var(--blue-hover))',
                    }}
                >
                    <AIPromptInput
                        aria-label="Message JutgeAI"
                        className="rounded-[calc(var(--radius-2xl)-1px)]"
                        disabled={!selectedModel}
                        onStop={handleStop}
                        onSubmit={handleSubmit}
                        onValueChange={setInput}
                        placeholder="Ask JutgeAI…"
                        state={promptState}
                        value={input}
                    >
                        <Select
                            disabled={busy || models.length === 0}
                            onValueChange={setSelectedModel}
                            value={selectedModel}
                        >
                            <SelectTrigger
                                aria-label="Model"
                                className="max-w-[40vw] border-0 bg-transparent shadow-none sm:max-w-56"
                                size="sm"
                            >
                                <SelectValue placeholder={models.length === 0 ? 'Loading models…' : 'Model'} />
                            </SelectTrigger>
                            <SelectContent>
                                {models.map((model) => (
                                    <SelectItem key={model} value={model}>
                                        {model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </AIPromptInput>
                </div>
            </div>
        </div>
    )
}

function AssistantBody({ message, live }: { message: UiMessage; live: boolean }) {
    if (!message.content) {
        return <AILoader label="Thinking" showElapsed />
    }
    if (message.failed) {
        return <p className="text-base text-destructive">{message.content}</p>
    }
    if (looksLikeMarkdown(message.content)) {
        return <MarkdownText className="max-w-none text-base! text-foreground">{message.content}</MarkdownText>
    }
    return <AIResponse className="text-base" isStreaming={live} text={message.content} />
}

function UserMark() {
    return (
        <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-foreground text-background"
        >
            <UserIcon className="size-3.5" />
        </span>
    )
}

function formatTime(timestamp: number) {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(timestamp)
}

/** Hide the usage payload the API appends after the reply. */
function visibleReply(text: string, finished: boolean) {
    const start = text.indexOf(USAGE_JSON_START)
    let body = text
    if (start !== -1) {
        const end = text.indexOf(USAGE_JSON_END, start)
        body = end === -1 ? text.slice(0, start) : text.slice(0, start) + text.slice(end + USAGE_JSON_END.length)
    }
    return finished ? body.trim() : body
}

function looksLikeMarkdown(text: string) {
    return /```|^\s{0,3}#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|\*\*|\[.+\]\(.+\)|\|.+\|/m.test(text)
}
