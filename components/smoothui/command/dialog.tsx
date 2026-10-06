'use client'

import { SmoothDialogContent } from '@/components/smoothui/dialog/animated-content'
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

export function SmoothCommandDialog({
    title = 'Command Palette',
    description = 'Search for a command to run...',
    children,
    className,
    showCloseButton = false,
    ...props
}: ComponentProps<typeof Dialog> & {
    title?: string
    description?: string
    className?: string
    showCloseButton?: boolean
}) {
    return (
        <Dialog {...props}>
            <DialogHeader className="sr-only">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <SmoothDialogContent
                className={cn('top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0', className)}
                showCloseButton={showCloseButton}
            >
                {children}
            </SmoothDialogContent>
        </Dialog>
    )
}
