'use client'

import type { ReactNode } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export function LiveSpinner({ label = 'Loading…' }: { label?: string }) {
    return (
        <p className="py-16 text-center text-muted-foreground" role="status">
            {label}
        </p>
    )
}

export function LiveNotice({ children }: { children: ReactNode }) {
    return (
        <Alert>
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    )
}

export function LiveErrorNotice({ children }: { children: ReactNode }) {
    return (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/15">
            <AlertDescription className="text-destructive">{children}</AlertDescription>
        </Alert>
    )
}

export function LivePage({
    title,
    children,
    className,
}: {
    title?: string
    children: ReactNode
    className?: string
}) {
    return (
        <div className={cn('flex flex-col gap-6', className)}>
            {title ? <h1 className="text-2xl font-semibold tracking-tight">{title}</h1> : null}
            {children}
        </div>
    )
}

export const liveFieldClassName = cn(
    'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none',
    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

export function LiveUnavailable({ message }: { message: string }) {
    return (
        <LivePage title="Unavailable">
            <LiveNotice>{message}</LiveNotice>
        </LivePage>
    )
}
