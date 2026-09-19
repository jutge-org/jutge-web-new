'use client'

import type { ReactNode } from 'react'

import ShaderRevealTransition from '@/components/smoothui/shader-reveal-transition'

export interface ShaderRevealWipeTransitionProps {
    children: ReactNode
    className?: string
    /** Wipe direction: `1` left→right (forward), `-1` right→left (backward). */
    direction?: 1 | -1
    duration?: number
    onRest?: () => void
    transitionKey: string | number
}

export default function ShaderRevealWipeTransition({
    children,
    className,
    direction = 1,
    duration = 1080,
    onRest,
    transitionKey,
}: ShaderRevealWipeTransitionProps) {
    return (
        <ShaderRevealTransition
            className={className}
            direction={direction}
            duration={duration}
            onRest={onRest}
            transitionKey={transitionKey}
            variant="wipe"
        >
            {children}
        </ShaderRevealTransition>
    )
}
