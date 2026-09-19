import type { Transition, Variants } from 'motion/react'

export const EASE_OUT = [0.4, 0, 0.2, 1] as const

export function fadeUpHidden(reduceMotion: boolean | null) {
    return reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
}

export function fadeUpVisible() {
    return { opacity: 1, y: 0 }
}

export function fadeUpTransition(reduceMotion: boolean | null, delay = 0): Transition {
    return reduceMotion ? { duration: 0 } : { duration: 0.4, delay, ease: EASE_OUT }
}

export function slidePanelTransition(
    reduceMotion: boolean | null,
    direction: 1 | -1,
): {
    initial: { opacity: number; x: number }
    animate: { opacity: number; x: number }
    exit: { opacity: number; x: number }
    transition: Transition
} {
    const offset = reduceMotion ? 0 : direction * 28
    return {
        initial: { opacity: 0, x: offset },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -offset },
        transition: reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE_OUT },
    }
}

export function staggerContainer(reduceMotion: boolean | null): Variants {
    return {
        hidden: {},
        visible: {
            transition: reduceMotion
                ? { staggerChildren: 0 }
                : { staggerChildren: 0.07, delayChildren: 0.08 },
        },
    }
}

export function staggerItem(reduceMotion: boolean | null): Variants {
    return {
        hidden: fadeUpHidden(reduceMotion),
        visible: {
            ...fadeUpVisible(),
            transition: fadeUpTransition(reduceMotion),
        },
    }
}
