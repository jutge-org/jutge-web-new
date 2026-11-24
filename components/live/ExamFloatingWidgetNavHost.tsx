'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import {
    EXAM_FLOATING_WIDGET_NAV_CHANNEL,
    isExamFloatingWidgetNavPath,
    type ExamFloatingWidgetNavMessage,
} from '@/lib/examFloatingWidget'

function handleNavigateMessage(router: ReturnType<typeof useRouter>, data: unknown): void {
    if (typeof data !== 'object' || data === null) return
    const message = data as Partial<ExamFloatingWidgetNavMessage>
    if (message.type !== 'navigate' || typeof message.path !== 'string') return
    if (!isExamFloatingWidgetNavPath(message.path)) return
    router.push(message.path)
}

/** Listens for problem links opened from the exam floating widget (popup / PiP). */
export function ExamFloatingWidgetNavHost() {
    const router = useRouter()

    useEffect(() => {
        let channel: BroadcastChannel | null = null
        if (typeof BroadcastChannel !== 'undefined') {
            channel = new BroadcastChannel(EXAM_FLOATING_WIDGET_NAV_CHANNEL)
            channel.onmessage = (event) => handleNavigateMessage(router, event.data)
        }

        function onWindowMessage(event: MessageEvent) {
            if (event.origin !== window.location.origin) return
            handleNavigateMessage(router, event.data)
        }

        window.addEventListener('message', onWindowMessage)
        return () => {
            channel?.close()
            window.removeEventListener('message', onWindowMessage)
        }
    }, [router])

    return null
}