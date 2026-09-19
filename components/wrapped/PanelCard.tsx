'use client'

import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type PanelCardProps = {
    title?: string
    children?: ReactNode
    className?: string
}

export function PanelCard({ title, children, className }: PanelCardProps) {
    return (
        <Card className={cn('gap-3 rounded-2xl border border-border shadow-sm', className)}>
            {title ? (
                <CardHeader className="pb-0">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                </CardHeader>
            ) : null}
            <CardContent className={title ? undefined : 'pt-6'}>{children}</CardContent>
        </Card>
    )
}
