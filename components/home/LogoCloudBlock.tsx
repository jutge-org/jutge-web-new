'use client'

import { motion, useReducedMotion } from 'motion/react'

const ANIMATION_DURATION = 4
const STAGGER_DELAY = 0.1
const HOVER_SCALE = 1.03
const SPRING_STIFFNESS = 300
const SCROLL_DISTANCE_FACTOR = 33.333

const sponsors = [
    {
        name: 'Universitat Politècnica de Catalunya',
        href: 'https://www.upc.edu/en',
        src: '/logos/upc.svg',
    },
    {
        name: "Facultat d'Informàtica de Barcelona",
        href: 'https://www.fib.upc.edu/en',
        src: '/logos/fib.svg',
    },
    {
        name: 'Facultat de Matemàtiques i Estadística',
        href: 'https://www.fme.upc.edu/en',
        src: '/logos/fme.svg',
    },
    {
        name: 'Olimpiada Informàtica Catalana',
        href: 'https://olimpiada-informatica.cat',
        src: '/logos/oicat.svg',
    },
    {
        name: 'Jutge.org',
        href: 'https://jutge.org',
        src: '/logos/jutge.svg',
    },
]

function SponsorLogo({ name, href, src }: (typeof sponsors)[number]) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <motion.a
            aria-label={`Visit ${name}`}
            className="group flex shrink-0 flex-col items-center justify-center gap-2 p-6"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
        >
            <motion.div
                className="flex h-16 w-28 items-center justify-center"
                transition={
                    shouldReduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: SPRING_STIFFNESS }
                }
                whileHover={shouldReduceMotion ? {} : { scale: HOVER_SCALE }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt=""
                    className="max-h-full max-w-full object-contain opacity-80 grayscale transition-opacity group-hover:opacity-100 dark:invert"
                    src={src}
                />
            </motion.div>
            <span className="max-w-36 text-center text-xs leading-tight text-muted-foreground">
                {name}
                <span className="sr-only"> (opens in new window)</span>
            </span>
        </motion.a>
    )
}

export function LogoCloudBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-sponsors" aria-labelledby="home-sponsors-heading" className="scroll-mt-14 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6">
                <motion.div
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    className="mb-16 text-center"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6 }}
                >
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-sponsors-heading"
                    >
                        Sponsors
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Jutge.org is supported by universities and organizations that care about programming education.
                    </p>
                </motion.div>

                {shouldReduceMotion ? (
                    <ul className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6">
                        {sponsors.map((sponsor) => (
                            <li key={sponsor.href}>
                                <SponsorLogo {...sponsor} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div
                        className="relative overflow-hidden"
                        style={{
                            maskImage:
                                'linear-gradient(to right, hsl(0 0% 0% / 0), hsl(0 0% 0% / 1) 20%, hsl(0 0% 0% / 1) 80%, hsl(0 0% 0% / 0))',
                            WebkitMaskImage:
                                'linear-gradient(to right, hsl(0 0% 0% / 0), hsl(0 0% 0% / 1) 20%, hsl(0 0% 0% / 1) 80%, hsl(0 0% 0% / 0))',
                        }}
                    >
                        <motion.div
                            animate={{ x: [0, -SCROLL_DISTANCE_FACTOR * sponsors.length] }}
                            className="flex min-w-full shrink-0 items-start justify-around gap-8"
                            transition={{
                                x: {
                                    repeat: Number.POSITIVE_INFINITY,
                                    repeatType: 'loop',
                                    duration: ANIMATION_DURATION,
                                    ease: 'linear',
                                },
                            }}
                        >
                            {[0, 1, 2].flatMap((setIndex) =>
                                sponsors.map((sponsor, index) => (
                                    <motion.div
                                        animate={{ opacity: 1, scale: 1 }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        key={`${setIndex}-${sponsor.href}`}
                                        transition={{
                                            duration: 0.4,
                                            delay: index * STAGGER_DELAY,
                                        }}
                                    >
                                        <SponsorLogo {...sponsor} />
                                    </motion.div>
                                )),
                            )}
                        </motion.div>
                    </div>
                )}
            </div>
        </section>
    )
}
