'use client'

import MaskRevealUp from '@/components/smoothui/mask-reveal-up'
import SmoothButton from '@/components/smoothui/smooth-button'
import { CodeIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'

const EXTENSION_URL = 'vscode:extension/jutge-org.jutge-vscode'

export function VsCodeBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-vscode" aria-labelledby="home-vscode-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-5xl px-0 sm:px-6 text-center">
                <motion.div
                    initial={false}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <MaskRevealUp
                        as="h2"
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-vscode-heading"
                        triggerOnView
                    >
                        Use Jutge.org in VS Code
                    </MaskRevealUp>
                    <MaskRevealUp
                        as="p"
                        className="mx-auto mt-4 max-w-2xl text-foreground text-lg dark:text-foreground/70"
                        delay={180}
                        triggerOnView
                    >
                        Browse your courses, read statements, and write solutions within your favorite editor with the
                        Jutge.org extension for Visual Studio Code.
                    </MaskRevealUp>
                    <div className="mx-auto max-w-4xl overflow-hidden rounded-xl shadow-lg">
                        <Image
                            src="/screenshots/vscode.webp"
                            alt="Visual Studio Code with the Jutge.org extension: a course problem list, a C++ editor, and the statement for Minimum spanning trees"
                            width={2624}
                            height={1824}
                            sizes="(min-width: 896px) 56rem, 100vw"
                            className="h-auto w-full"
                        />
                    </div>
                    <SmoothButton asChild className="" color="accent" variant="candy">
                        <a href={EXTENSION_URL}>
                            <CodeIcon className="size-4 shrink-0" aria-hidden />
                            Install the extension
                        </a>
                    </SmoothButton>
                </motion.div>
            </div>
        </section>
    )
}
