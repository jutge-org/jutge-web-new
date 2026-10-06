'use client'

import {
    DropdownMenuContent,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { SPRING_DEFAULT } from '@/components/smoothui/lib/animation'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'

function DropdownMotionShell({ children }: { children: ReactNode }) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <motion.div
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -4 }}
            transition={shouldReduceMotion ? { duration: 0 } : SPRING_DEFAULT}
        >
            {children}
        </motion.div>
    )
}

export function SmoothDropdownMenuContent({
    children,
    className,
    ...props
}: ComponentProps<typeof DropdownMenuContent>) {
    return (
        <DropdownMenuContent className={cn('origin-top', className)} {...props}>
            <DropdownMotionShell>{children}</DropdownMotionShell>
        </DropdownMenuContent>
    )
}

export function SmoothDropdownMenuSubContent({
    children,
    className,
    ...props
}: ComponentProps<typeof DropdownMenuSubContent>) {
    return (
        <DropdownMenuSubContent className={cn('origin-top', className)} {...props}>
            <DropdownMotionShell>{children}</DropdownMotionShell>
        </DropdownMenuSubContent>
    )
}
