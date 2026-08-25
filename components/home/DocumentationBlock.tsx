'use client'

import SmoothButton from '@/components/smoothui/smooth-button'
import { BookTextIcon, InfoIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'

export function DocumentationBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-documentation" aria-labelledby="home-documentation-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-2xl px-6 text-center">
                <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-documentation-heading"
                    >
                        Curious how it all works?
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Browse the docs for verdicts, compilers, FAQs,&nbsp;...
                        <br />
                        or read the story behind Jutge.org.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
                        <SmoothButton asChild color="accent" variant="candy" className="w-42">
                            <Link href="/documentation">
                                <BookTextIcon className="size-4 shrink-0" aria-hidden />
                                Documentation
                            </Link>
                        </SmoothButton>
                        <SmoothButton asChild color="accent" variant="candy" className="w-42">
                            <Link href="/about">
                                <InfoIcon className="size-4 shrink-0" aria-hidden />
                                About
                            </Link>
                        </SmoothButton>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
