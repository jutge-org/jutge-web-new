'use client'

import MacTerminal, { type TerminalLine } from '@/components/smoothui/mac-terminal'
import MaskRevealUp from '@/components/smoothui/mask-reveal-up'
import { motion, useReducedMotion } from 'motion/react'
import { useTheme } from 'next-themes'

const LINES: TerminalLine[] = [
    { id: 'cli-comment', type: 'comment', text: '# Jutge.org CLI — call the API from the terminal' },
    { id: 'cli-install', type: 'command', text: 'bun add -g @jutge.org/cli' },
    { id: 'cli-ok', type: 'success', text: 'installed @jutge.org/cli' },
    { id: 'cli-version', type: 'command', text: 'jutge version' },
    { id: 'cli-version-out', type: 'output', text: 'Jutge.org CLI' },
    {
        id: 'toolkit-comment',
        type: 'comment',
        text: '# Jutge Toolkit — author and upload problems',
        delay: 600,
    },
    { id: 'toolkit-install', type: 'command', text: 'bun install --global @jutge.org/toolkit' },
    { id: 'toolkit-ok', type: 'success', text: 'installed @jutge.org/toolkit' },
    { id: 'toolkit-version', type: 'command', text: 'jtk --version' },
    { id: 'toolkit-version-out', type: 'output', text: 'Jutge Toolkit' },
    { id: 'toolkit-generate-comment', type: 'comment', text: '# Generate a new problem using AI agents' },
    { id: 'toolkit-generate', type: 'command', text: 'jtk generate problem' },
]

export function TerminalBlock() {
    const shouldReduceMotion = useReducedMotion()
    const { resolvedTheme } = useTheme()
    const theme = resolvedTheme === 'light' ? 'light' : 'dark'

    return (
        <section id="home-terminal" aria-labelledby="home-terminal-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-3xl px-0 sm:px-6 text-center">
                <motion.div
                    initial={false}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <MaskRevealUp
                        as="h2"
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-terminal-heading"
                        triggerOnView
                    >
                        All the power at your fingertips
                    </MaskRevealUp>
                    <MaskRevealUp
                        as="p"
                        className="mt-4 text-foreground text-lg dark:text-foreground/70"
                        delay={180}
                        triggerOnView
                    >
                        Use the web interface for everyday tasks, and the terminal for heavy lifting.
                        Install the Jutge CLI to call the API, and the Jutge Toolkit to author and upload problems.
                    </MaskRevealUp>
                    <div className="mt-8 text-left">
                        <MacTerminal lines={LINES} loop loopPause={2000} prompt="~ %" rows={12} theme={theme} title="Terminal" />
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
