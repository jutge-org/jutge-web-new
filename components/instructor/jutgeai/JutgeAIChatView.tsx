'use client'

import { fetchInstructorApiUrl, fetchJutgeaiSupportedModels, jutgeaiChatMessages } from '@/lib/instructor/client'
import { MarkdownText } from '@/components/general/MarkdownText'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ChatMessage } from '@/lib/jutge_api_client'
import { BotIcon, ClipboardCopyIcon, EditIcon, SendHorizontalIcon, UserIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const USAGE_JSON_START = '---USAGE_JSON_START---'
const USAGE_JSON_END = '---USAGE_JSON_END---'

type UiMessage = { role: 'user' | 'assistant' | 'system'; content: string }

export function JutgeAIChatView() {
    const [models, setModels] = useState<string[]>([])
    const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-4.1-mini')
    const [messages, setMessages] = useState<UiMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function loadModels() {
            const list = await fetchJutgeaiSupportedModels()
            setModels(list)
            const preferred = 'openai/gpt-4.1-mini'
            setSelectedModel((current) => {
                if (list.length === 0) return current
                if (list.includes(current)) return current
                return list.includes(preferred) ? preferred : list[0]
            })
        }
        loadModels()
    }, [])

    const scrollToBottom = useCallback(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    async function handleSend() {
        const text = input.trim()
        if (!text || !selectedModel || loading) return

        setInput('')
        const userMessage: UiMessage = { role: 'user', content: text }
        setMessages((prev) => [...prev, userMessage])
        setLoading(true)

        const conversation: UiMessage[] = [...messages, userMessage]
        const apiMessages: ChatMessage[] = conversation.map((m) => ({
            role: m.role,
            content: m.content,
        }))

        const assistantPlaceholder: UiMessage = { role: 'assistant', content: '' }
        setMessages((prev) => [...prev, assistantPlaceholder])

        try {
            const stream = await jutgeaiChatMessages(selectedModel, apiMessages)
            const apiUrl = await fetchInstructorApiUrl()
            const response = await fetch(`${apiUrl}/webstreams/${stream.id}`)
            if (!response.body) {
                setMessages((prev) => {
                    const next = [...prev]
                    const last = next[next.length - 1]
                    if (last.role === 'assistant') last.content = 'No response body.'
                    return next
                })
                return
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                fullText += decoder.decode(value, { stream: true })
                setMessages((prev) => {
                    const next = [...prev]
                    const last = next[next.length - 1]
                    if (last.role === 'assistant') {
                        last.content = stripUsageBlock(fullText)
                    }
                    return next
                })
            }
            setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last.role === 'assistant') {
                    last.content = stripUsageBlock(fullText).trim()
                }
                return next
            })
        } catch (e) {
            const err = e instanceof Error ? e.message : String(e)
            setMessages((prev) => {
                const next = [...prev]
                const last = next[next.length - 1]
                if (last.role === 'assistant') last.content = `Error: ${err}`
                return next
            })
        } finally {
            setLoading(false)
        }
    }

    function handleCopy(content: string) {
        navigator.clipboard.writeText(content).then(
            () => toast.success('Copied to clipboard'),
            () => toast.error('Failed to copy'),
        )
    }

    function handleEdit(index: number) {
        const msg = messages[index]
        if (msg.role !== 'user') return
        setInput(msg.content)
        setMessages((prev) => prev.slice(0, index))
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
            <ScrollArea className="min-h-0 flex-1 rounded-lg border p-4">
                <div className="flex flex-col gap-4 pr-4">
                    {messages.length === 0 && (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Send a message to start the conversation.
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <MessageBubble
                            key={i}
                            message={msg}
                            onCopy={() => handleCopy(msg.content)}
                            onEdit={msg.role === 'user' ? () => handleEdit(i) : undefined}
                        />
                    ))}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="flex flex-shrink-0 flex-col gap-2">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message…"
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                        }
                    }}
                />
                <div className="flex flex-row items-center justify-end gap-2">
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                            {models.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <SmoothButton color="blue" variant="candy" size="xs" onClick={handleSend} disabled={loading || !input.trim() || !selectedModel} className="w-42">
                        <SendHorizontalIcon className="size-4" />
                        Send
                    </SmoothButton>
                </div>
            </div>
        </div>
    )
}

function stripUsageBlock(text: string): string {
    const start = text.indexOf(USAGE_JSON_START)
    if (start === -1) return text
    const end = text.indexOf(USAGE_JSON_END, start)
    if (end === -1) return text
    return (text.slice(0, start) + text.slice(end + USAGE_JSON_END.length)).trim()
}

function MessageBubble({ message, onCopy, onEdit }: { message: UiMessage; onCopy: () => void; onEdit?: () => void }) {
    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'

    return (
        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`flex flex-row items-center gap-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                <span className="flex items-center gap-1 text-muted-foreground">
                    {isUser ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
                    <span className="text-xs font-medium">
                        {message.role === 'system' ? (
                            'System'
                        ) : message.role === 'user' ? (
                            'You'
                        ) : (
                            <span>
                                Jutge<sup>AI</sup>
                            </span>
                        )}
                    </span>
                </span>
                <div className="flex flex-row gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy} title="Copy">
                        <ClipboardCopyIcon className="size-4" />
                    </Button>
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={onEdit}
                            title="Edit and resend"
                        >
                            <EditIcon className="size-4" />
                        </Button>
                    )}
                </div>
            </div>
            <div
                className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm ${
                    isUser ? 'border-primary/20 bg-primary/10' : 'border-muted bg-muted/50'
                }`}
            >
                {isAssistant && message.content ? (
                    <MarkdownText className="max-w-none text-foreground">{message.content}</MarkdownText>
                ) : message.content ? (
                    <pre className="m-0 whitespace-pre-wrap font-sans text-sm">{message.content}</pre>
                ) : (
                    <span className="text-muted-foreground italic">Thinking…</span>
                )}
            </div>
        </div>
    )
}
