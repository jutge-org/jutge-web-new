'use client'

import { cn } from '@/lib/utils'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { createElement, useRef, type Ref } from 'react'

export interface MaskRevealUpProps {
    /** Single line of text. Use `lines` when the reveal should break per line. */
    children?: string
    className?: string
    /** Delay before the animation starts, in milliseconds. */
    delay?: number
    /** Explicit line array. Takes precedence over children. */
    lines?: string[]
    /** Per-line stagger, in milliseconds. */
    stagger?: number
    /** Animate only once the text scrolls into view. */
    triggerOnView?: boolean
    /** Root element. Use a heading when the text labels a section. */
    as?: 'span' | 'h1' | 'h2' | 'p'
    id?: string
}

const DURATION_S = 0.76
const MS = 1000
const EASE = [0.22, 1, 0.36, 1] as const

/**
 * MaskRevealUp — per-line masked reveal with upward motion and soft blur,
 * inspired by Apple section transitions. Each line rises from beneath an
 * overflow-hidden mask. From the animate-text catalog (`mask-reveal-up`).
 * Best for two-line and three-line headings.
 */
export default function MaskRevealUp({
    children,
    lines: linesProp,
    className,
    delay = 0,
    stagger = 90,
    triggerOnView = false,
    as: Tag = 'span',
    id,
}: MaskRevealUpProps) {
    const ref = useRef<HTMLElement>(null)
    const inView = useInView(ref, { once: true })
    const shouldReduceMotion = useReducedMotion()
    const play = (!triggerOnView || inView) && !shouldReduceMotion

    const fromChildren = children?.replace(/\s+/g, ' ').trim()
    const lines = (linesProp ?? (fromChildren ? [fromChildren] : []))
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    const label = lines.join(' ')

    return createElement(
        Tag,
        {
            'aria-label': label,
            className: cn('block', className),
            id,
            ref: ref as Ref<HTMLElement>,
        },
        lines.map((line, index) => (
            <span
                key={index}
                className="block overflow-hidden pt-[0.08em] pb-[0.15em] -mt-[0.08em] -mb-[0.15em]"
                // Inherit a parent gradient (hero title) onto the glyphs. background-clip: text
                // on this empty wrapper keeps the bar from painting while the line still inherits it.
                style={{ backgroundImage: 'inherit', backgroundClip: 'text', WebkitBackgroundClip: 'text' }}
            >
                <motion.span
                    animate={play ? { filter: 'blur(0px)', opacity: 1, y: 0 } : undefined}
                    aria-hidden="true"
                    initial={shouldReduceMotion ? { opacity: 1 } : { filter: 'blur(6px)', opacity: 0, y: 30 }}
                    className="block"
                    style={{ backgroundImage: 'inherit', backgroundClip: 'text', WebkitBackgroundClip: 'text' }}
                    transition={
                        shouldReduceMotion
                            ? { duration: 0 }
                            : {
                                  delay: delay / MS + (index * stagger) / MS,
                                  duration: DURATION_S,
                                  ease: EASE,
                              }
                    }
                >
                    {line}
                </motion.span>
            </span>
        )),
    )
}
