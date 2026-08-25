'use client'

import { GithubIcon } from '@/components/GithubIcon'
import SmoothButton from '@/components/smoothui/smooth-button'
import { motion, useReducedMotion } from 'motion/react'

const GITHUB_ORG_URL = 'https://github.com/jutge-org'

export function GithubBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-github" aria-labelledby="home-github-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-2xl px-6 text-center">
                <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2 className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground" id="home-github-heading">
                        Contribute to Jutge.org
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Many pieces of Jutge.org are open source. Explore the code, open issues, and contribute — every
                        pull request helps students and teachers worldwide.
                    </p>
                    <SmoothButton asChild className="mt-8" color="accent" variant="candy">
                        <a href={GITHUB_ORG_URL} target="_blank" rel="noopener noreferrer">
                            <GithubIcon className="size-4 shrink-0" aria-hidden />
                            jutge-org on GitHub
                            <span className="sr-only"> (opens in new window)</span>
                        </a>
                    </SmoothButton>
                </motion.div>
            </div>
        </section>
    )
}
