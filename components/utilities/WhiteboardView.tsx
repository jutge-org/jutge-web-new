'use client'

import { Spinner } from '@/components/ui/spinner'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'

import '@excalidraw/excalidraw/index.css'

const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center">
            <Spinner className="size-6" />
        </div>
    ),
})

export function WhiteboardView() {
    const { resolvedTheme } = useTheme()
    const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

    return (
        <div
            className="h-[calc(100dvh-13rem)] min-h-96 w-full overflow-hidden rounded-xl border border-border"
            role="region"
            aria-label="Whiteboard"
        >
            <Excalidraw theme={theme} UIOptions={{ canvasActions: { toggleTheme: false } }} />
        </div>
    )
}
