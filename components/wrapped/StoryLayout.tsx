'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { fadeUpHidden, fadeUpTransition, fadeUpVisible } from '@/components/wrapped/motionPresets'
import { cn } from '@/lib/utils'

type StoryLayoutProps = {
    eyebrow?: string
    title?: string
    subtitle?: string
    children?: ReactNode
    className?: string
}

export function StoryLayout({ eyebrow, title, subtitle, children, className }: StoryLayoutProps) {
    const reduceMotion = useReducedMotion()

    return (
        <div className={cn('flex min-h-0 flex-col gap-4 sm:gap-5', className)}>
            {eyebrow ? (
                <motion.p
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    initial={fadeUpHidden(reduceMotion)}
                    animate={fadeUpVisible()}
                    transition={fadeUpTransition(reduceMotion, 0.04)}
                >
                    {eyebrow}
                </motion.p>
            ) : null}
            {title ? (
                <motion.h2
                    className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                    initial={fadeUpHidden(reduceMotion)}
                    animate={fadeUpVisible()}
                    transition={fadeUpTransition(reduceMotion, eyebrow ? 0.1 : 0.04)}
                >
                    {title}
                </motion.h2>
            ) : null}
            {subtitle ? (
                <motion.p
                    className="max-w-2xl text-sm text-muted-foreground sm:text-base"
                    initial={fadeUpHidden(reduceMotion)}
                    animate={fadeUpVisible()}
                    transition={fadeUpTransition(reduceMotion, eyebrow ? 0.16 : 0.1)}
                >
                    {subtitle}
                </motion.p>
            ) : null}
            {children ? (
                <motion.div
                    className="min-w-0"
                    initial={fadeUpHidden(reduceMotion)}
                    animate={fadeUpVisible()}
                    transition={fadeUpTransition(reduceMotion, eyebrow ? 0.22 : 0.16)}
                >
                    {children}
                </motion.div>
            ) : null}
        </div>
    )
}
