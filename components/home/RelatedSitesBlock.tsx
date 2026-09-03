'use client'

import { motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'

const SPRING = {
    type: 'spring' as const,
    duration: 0.25,
    bounce: 0.1,
}

const relatedSites = [
    {
        title: 'Lliçons',
        description: "El recull de lliçons d'algorísmia i programació de Jutge.org.",
        href: 'https://lliçons.jutge.org',
        imageSrc: '/news/llicons.webp',
    },
    {
        title: 'API for Jutge.org',
        description:
            'Interact programatically with Jutge.org.',
        href: 'https://api.jutge.org',
        imageSrc: '/news/api.webp',
    },
    {
        title: 'VSCode extension',
        description: 'Solve Jutge.org problems directly within your favorite IDE.',
        href: 'vscode:extension/jutge-org.jutge-vscode',
        imageSrc: '/news/vscode-jutge.webp',
    },
    {
        title: 'Quizzes by Jutge.org',
        description: 'Play, learn, and share your knowledgein a fun way.',
        href: 'https://quizzes.jutge.org',
        imageSrc: '/news/quizzes.webp',
    },
    {
        title: 'Mussol',
        description: "The peer grading tool of Jutge.org",
        href: 'https://mussol.jutge.org',
        imageSrc: '/news/mussol.webp',
    },
]

export function RelatedSitesBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-related-sites" aria-labelledby="home-related-sites-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-6xl px-0 sm:px-6">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-related-sites-heading"
                    >
                        Related sites and tools
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        More tools and resources from the Jutge.org ecosystem.
                    </p>
                </div>
                <div className="relative">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-1/2 hidden size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-3xl dark:block sm:size-80"
                    />
                    <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {relatedSites.map((site, index) => {
                            const isExternal = site.href.startsWith('http')
                            return (
                                <motion.a
                                    className="group relative flex h-full flex-col items-center overflow-hidden rounded-xl border bg-muted p-6 text-center transition-all hover:scale-[1.02] hover:shadow-md max-sm:flex-row max-sm:gap-4 max-sm:p-4 max-sm:text-left dark:bg-primary/5 dark:ring-1 dark:ring-primary/10"
                                    href={site.href}
                                    initial={false}
                                    key={site.title}
                                    rel={isExternal ? 'noopener noreferrer' : undefined}
                                    target={isExternal ? '_blank' : undefined}
                                    transition={
                                        shouldReduceMotion ? { duration: 0 } : { ...SPRING, delay: index * 0.05 }
                                    }
                                    viewport={{ once: true, margin: '-100px' }}
                                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                                >
                                    <Image
                                        src={site.imageSrc}
                                        alt=""
                                        width={128}
                                        height={128}
                                        className="mb-3 size-32 rounded-md object-contain max-sm:mb-0 max-sm:size-20 max-sm:shrink-0"
                                    />
                                    <div className="contents max-sm:block max-sm:min-w-0 max-sm:flex-1">
                                        <h3 className="mb-1 font-semibold text-[var(--color-brand-title)] text-2xl max-sm:text-xl">
                                            {site.title}
                                            {isExternal ? (
                                                <span className="sr-only"> (opens in new window)</span>
                                            ) : null}
                                        </h3>
                                        <p className="text-foreground text-sm leading-relaxed dark:text-foreground/70">
                                            {site.description}
                                        </p>
                                    </div>
                                </motion.a>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
