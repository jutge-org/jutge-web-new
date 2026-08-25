'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { StarIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_BOUNCE = [0.68, -0.55, 0.265, 1.55] as const

const testimonials = [
    {
        quote: 'Jutge.org turned my programming course into something students actually look forward to. Instant feedback makes all the difference.',
        name: 'Maria Soler',
        role: 'Lecturer, Computer Science',
        initials: 'MS',
        stars: 4,
    },
    {
        quote: 'I practiced every day with the public problems and finally felt ready for my algorithms exam. The verdicts taught me more than any textbook.',
        name: 'Alex Chen',
        role: 'Undergraduate student',
        initials: 'AC',
        stars: 5,
    },
    {
        quote: 'Setting up exams used to take forever. Now I publish a list, open the exam window, and everything just works.',
        name: 'Jordi Puig',
        role: 'High-school teacher',
        initials: 'JP',
        stars: 5,
    },
    {
        quote: 'The variety of languages and compilers means every student can submit in the language they are learning — without friction.',
        name: 'Elena Rossi',
        role: 'Teaching assistant',
        initials: 'ER',
        stars: 5,
    },
]

export function TestimonialBlock() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-testimonials" aria-labelledby="home-testimonials-heading" className="scroll-mt-14">
            <div className="mx-auto w-full max-w-5xl px-6">
                <motion.div
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    className="mx-auto mb-16 max-w-2xl text-center"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }}
                >
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-testimonials-heading"
                    >
                        What people say
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Feedback from teachers and students who use Jutge.org to teach, practice, and grow as
                        programmers.
                    </p>
                </motion.div>

                <motion.div
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
                    className="grid gap-4 md:gap-6 lg:grid-cols-2 3xl:grid-cols-3 3xl:gap-12"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT, delay: 0.2 }}
                >
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                            className={cn(
                                'group relative overflow-hidden rounded-xl border bg-primary/5 p-4 ring-1 ring-primary/10 transition-all hover:scale-[1.02] hover:shadow-md md:p-6',
                                index >= 3 && 'hidden lg:block',
                            )}
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
                            key={testimonial.name}
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0 }
                                    : {
                                          duration: 0.5,
                                          ease: EASE_OUT,
                                          delay: index * 0.15,
                                      }
                            }
                        >
                            <motion.div
                                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                                className="flex gap-0.5 md:gap-1"
                                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                                transition={
                                    shouldReduceMotion
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.4,
                                              delay: index * 0.15 + 0.2,
                                              ease: EASE_OUT,
                                          }
                                }
                            >
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div
                                        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0 }}
                                        key={`${testimonial.name}-star-${i}`}
                                        transition={
                                            shouldReduceMotion
                                                ? { duration: 0 }
                                                : {
                                                      duration: 0.3,
                                                      delay: index * 0.15 + 0.2 + i * 0.05,
                                                      ease: EASE_BOUNCE,
                                                  }
                                        }
                                    >
                                        <StarIcon
                                            aria-hidden
                                            className={cn(
                                                'size-3.5 transition-colors duration-200 md:size-4',
                                                i < testimonial.stars
                                                    ? 'fill-brand text-[var(--color-brand)]'
                                                    : 'fill-none text-[color-mix(in_oklab,var(--color-brand)_35%,transparent)]',
                                            )}
                                        />
                                    </motion.div>
                                ))}
                                <span className="sr-only">{testimonial.stars} out of 5 stars</span>
                            </motion.div>

                            <motion.blockquote
                                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                className="my-3 text-foreground text-sm md:my-4 md:text-base"
                                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                                transition={
                                    shouldReduceMotion
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.4,
                                              delay: index * 0.15 + 0.4,
                                              ease: EASE_OUT,
                                          }
                                }
                            >
                                {testimonial.quote}
                            </motion.blockquote>

                            <motion.div
                                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                                className="flex items-center gap-1.5 md:gap-2"
                                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                                transition={
                                    shouldReduceMotion
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.3,
                                              delay: index * 0.15 + 0.5,
                                              ease: EASE_OUT,
                                          }
                                }
                            >
                                <Avatar className="size-5 border border-transparent shadow ring-1 ring-foreground/10 md:size-6">
                                    <AvatarFallback className="bg-brand/15 text-[9px] font-semibold text-[var(--color-brand)] md:text-[10px]">
                                        {testimonial.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="font-medium text-foreground text-xs md:text-sm">
                                    {testimonial.name}
                                </div>
                                <span aria-hidden="true" className="size-1 rounded-full bg-foreground/25" />
                                <span className="text-muted-foreground text-xs md:text-sm">{testimonial.role}</span>
                            </motion.div>

                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
