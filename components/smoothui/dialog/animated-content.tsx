'use client'

import { DialogContent } from '@/components/ui/dialog'
import { SPRING_DEFAULT } from '@/components/smoothui/lib/animation'
import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'motion/react'
import type { ComponentProps, ReactNode } from 'react'

function DialogMotionShell({ children }: { children: ReactNode }) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <motion.div
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: -8 }}
            transition={shouldReduceMotion ? { duration: 0 } : SPRING_DEFAULT}
        >
            {children}
        </motion.div>
    )
}

export function SmoothDialogContent({
    children,
    className,
    ...props
}: ComponentProps<typeof DialogContent>) {
    return (
        <DialogContent className={cn('origin-top', className)} {...props}>
            <DialogMotionShell>{children}</DialogMotionShell>
        </DialogContent>
    )
}
