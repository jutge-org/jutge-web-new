'use client'

import AppleInvites, { type Event } from '@/components/smoothui/apple-invites'
import { tradingCardImageUrl } from '@/lib/data/tradingCards'
import { tradingCardFamily } from '@/lib/tradingCards'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

type CollectibleCardStub = {
    card_id: string
    title: string
    subtitle: string
    location: string
}

const COLLECTIBLE_CARD_STUBS: CollectibleCardStub[] = [
    {
        card_id: 'Travelling/rjkmigrjkmigrjkm.png',
        title: 'Island Hop',
        subtitle: 'Earned on a long practice streak',
        location: 'Across sunny ports of call',
    },
    {
        card_id: 'Travelling/wl9jhqwl9jhqwl9j.png',
        title: 'Open Road',
        subtitle: 'Unlocked after a travel challenge',
        location: 'Wherever the next problem leads',
    },
    {
        card_id: 'Coding/9rtv2s9rtv2s9rtv.png',
        title: 'Night Coder',
        subtitle: 'Awarded for late-night submissions',
        location: 'Between green tests and coffee',
    },
    {
        card_id: 'Coding/32p4ob32p4ob32p4.png',
        title: 'Bug Hunter',
        subtitle: 'Collected by fixing stubborn cases',
        location: 'Deep in the verdict log',
    },
    {
        card_id: 'Misc/vdr5hlvdr5hlvdr5.png',
        title: 'Wildcard',
        subtitle: 'A surprise drop from the archive',
        location: 'Somewhere off the beaten path',
    },
]

function shufflePick<T>(items: T[], count: number): T[] {
    const pool = [...items]
    for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, count)
}

function stubToEvent(stub: CollectibleCardStub, index: number): Event {
    const family = tradingCardFamily(stub.card_id)
    return {
        id: index + 1,
        image: tradingCardImageUrl(stub.card_id),
        badge: family,
        title: stub.title,
        subtitle: stub.subtitle,
        location: stub.location,
    }
}

export function CardsBlock() {
    const shouldReduceMotion = useReducedMotion()
    const [events, setEvents] = useState<Event[] | null>(null)

    useEffect(() => {
        setEvents(shufflePick(COLLECTIBLE_CARD_STUBS, 3).map(stubToEvent))
    }, [])

    return (
        <section id="home-collectible-cards" aria-labelledby="home-collectible-cards-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-5xl px-6">
                <motion.div
                    className="mx-auto mb-12 max-w-2xl text-center"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-collectible-cards-heading"
                    >
                        Earn collectible cards
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Solve problems and complete challenges to earn collectible cards. <br />
                        Brag about your achievements with your friends!
                    </p>
                </motion.div>

                <div className="relative mx-auto h-[420px] w-full max-w-xl md:h-[480px]" aria-live="polite">
                    {events ? (
                        <AppleInvites
                            aspectRatio={1.5}
                            cardWidth={{ base: 200, sm: 220, md: 240 }}
                            className="h-full"
                            events={events}
                            interval={3500}
                        />
                    ) : (
                        <div
                            aria-busy="true"
                            aria-label="Loading collectible cards"
                            className="flex h-full items-center justify-center"
                        >
                            <div className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
