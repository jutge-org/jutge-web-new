'use client'

import SmoothButton from '@/components/smoothui/smooth-button'
import { SendIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

const TELEGRAM_URL = 'https://t.me/jutge'

export function TelegramBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-telegram" aria-labelledby="home-telegram-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-2xl px-6 text-center">
                <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-telegram-heading"
                    >
                        Stay informed
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Join the Jutge.org Telegram channel for service communications, status updates, and
                        announcements. Ultra low traffic, no spam.
                    </p>
                    <SmoothButton asChild className="mt-8" color="accent" variant="candy">
                        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                            <SendIcon className="size-4 shrink-0" aria-hidden />
                            Telegram channel
                            <span className="sr-only"> (opens in new window)</span>
                        </a>
                    </SmoothButton>
                </motion.div>
            </div>
        </section>
    )
}
