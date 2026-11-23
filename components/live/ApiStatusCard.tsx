'use client'

import { useEffect, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { CONTEST_API_URL, EXAM_API_URL, NORMAL_API_URL } from '@/lib/siteMode'
import { cn } from '@/lib/utils'

const JUTGE_API_ENDPOINTS = [
    { name: 'api.jutge.org', baseUrl: NORMAL_API_URL },
    { name: 'exam.jutge.org', baseUrl: EXAM_API_URL },
    { name: 'contest.jutge.org', baseUrl: CONTEST_API_URL },
] as const

type ConnectionStatus = 'pending' | 'ok' | 'error'

function dirProbeUrl(apiBaseUrl: string): string {
    return `${apiBaseUrl.replace(/\/$/, '')}/dir`
}

async function probeApiConnection(apiBaseUrl: string, signal: AbortSignal): Promise<boolean> {
    try {
        const response = await fetch(dirProbeUrl(apiBaseUrl), { method: 'GET', signal })
        return response.ok
    } catch {
        return false
    }
}

export function ApiStatusCard({ className }: { className?: string }) {
    const [statusByName, setStatusByName] = useState<Record<string, ConnectionStatus>>(() =>
        Object.fromEntries(JUTGE_API_ENDPOINTS.map(({ name }) => [name, 'pending'])),
    )

    useEffect(() => {
        const controller = new AbortController()

        void (async () => {
            const results = await Promise.all(
                JUTGE_API_ENDPOINTS.map(async ({ name, baseUrl }) => {
                    const ok = await probeApiConnection(baseUrl, controller.signal)
                    return [name, ok ? 'ok' : 'error'] as const
                }),
            )
            if (controller.signal.aborted) return
            setStatusByName(Object.fromEntries(results))
        })()

        return () => controller.abort()
    }, [])

    return (
        <Card className={cn('w-full border border-border py-0 shadow-sm ring-0', className)}>
            <CardContent className="px-4 py-2">
                <div className="flex items-center gap-3">
                    <ul className="flex min-w-0 flex-1 flex-nowrap items-center justify-evenly gap-3 overflow-x-auto text-sm">
                        {JUTGE_API_ENDPOINTS.map(({ name }) => {
                            const status = statusByName[name] ?? 'pending'
                            const indicator =
                                status === 'ok' ? '🟢' : status === 'error' ? '🔴' : '⚪'
                            const statusLabel =
                                status === 'ok'
                                    ? 'Connection granted'
                                    : status === 'error'
                                      ? 'Connection not granted'
                                      : 'Checking connection'

                            return (
                                <li key={name} className="flex items-center gap-2">
                                    <span aria-hidden>{indicator}</span>
                                    <span>
                                        <span className="sr-only">{statusLabel}: </span>
                                        {name}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                    <span className="shrink-0 text-sm text-muted-foreground">Dev</span>
                </div>
            </CardContent>
        </Card>
    )
}