'use client'

import { ExternalLink } from '@/components/ExternalLink'
import { Prose } from '@/components/documentation/Prose'
import { SearchInput } from '@/components/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import faqDocument from '@/content/documentation/faq.json'
import { ChevronDownIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type FaqItem = {
    question: string
    answer: string
}

type FaqSection = {
    title: string
    items: FaqItem[]
}

type IndexedFaqItem = FaqItem & {
    sectionIndex: number
    itemIndex: number
}

type IndexedFaqSection = {
    title: string
    sectionIndex: number
    items: IndexedFaqItem[]
}

const noResultsText = 'No matching questions found. Try a different search term.'

function itemKey(sectionIndex: number, itemIndex: number) {
    return `${sectionIndex}-${itemIndex}`
}

function faqSlug(question: string) {
    return question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

function FaqAnswer({ answer }: { answer: string }) {
    return (
        <Prose className="prose-sm text-foreground/70 prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-pre:my-3 prose-pre:overflow-x-auto prose-p:first:mt-0 prose-p:last:mb-0">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ href, children }) => {
                        if (href?.startsWith('/')) {
                            return (
                                <Link
                                    href={href}
                                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                                >
                                    {children}
                                </Link>
                            )
                        }
                        return <ExternalLink href={href ?? ''}>{children}</ExternalLink>
                    },
                }}
            >
                {answer}
            </ReactMarkdown>
        </Prose>
    )
}

export function FaqView() {
    const [searchQuery, setSearchQuery] = useState('')
    const [openKey, setOpenKey] = useState<string | null>(null)
    const shouldReduceMotion = useReducedMotion()
    const sections = faqDocument.sections as FaqSection[]

    useEffect(() => {
        const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
        if (!hash) {
            return
        }
        for (const [sectionIndex, section] of sections.entries()) {
            const itemIndex = section.items.findIndex((item) => faqSlug(item.question) === hash)
            if (itemIndex === -1) {
                continue
            }
            setOpenKey(itemKey(sectionIndex, itemIndex))
            const frame = requestAnimationFrame(() => {
                document.getElementById(hash)?.scrollIntoView({ block: 'start' })
            })
            return () => cancelAnimationFrame(frame)
        }
    }, [sections])

    const filteredSections = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return sections
            .map((section, sectionIndex): IndexedFaqSection => {
                const sectionMatches = query.length > 0 && section.title.toLowerCase().includes(query)
                const items = section.items
                    .map((item, itemIndex) => ({ ...item, sectionIndex, itemIndex }))
                    .filter((item) => {
                        if (!query || sectionMatches) {
                            return true
                        }
                        return item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)
                    })
                return { title: section.title, sectionIndex, items }
            })
            .filter((section) => section.items.length > 0)
    }, [sections, searchQuery])

    const springTransition = shouldReduceMotion
        ? { duration: 0 }
        : { bounce: 0.05, duration: 0.25, type: 'spring' as const }

    const contentTransition = shouldReduceMotion
        ? { duration: 0 }
        : { bounce: 0, duration: 0.25, type: 'spring' as const }

    const totalCount = sections.reduce((count, section) => count + section.items.length, 0)
    const visibleCount = filteredSections.reduce((count, section) => count + section.items.length, 0)
    let cardIndex = 0

    return (
        <div className="flex flex-col gap-4">
            <TooltipProvider>
                <div className="flex flex-row items-center justify-end gap-2">
                    <Badge variant="outline" className="tabular-nums">
                        {visibleCount === totalCount ? visibleCount : `${visibleCount}/${totalCount}`}
                    </Badge>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-64 shrink-0">
                                <SearchInput
                                    showSearchIcon
                                    aria-label="Search frequently asked questions"
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value)
                                        setOpenKey(null)
                                    }}
                                    placeholder="Search…"
                                    value={searchQuery}
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">Search questions</TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>

            <div className="space-y-10">
                <AnimatePresence mode="popLayout">
                    {filteredSections.length === 0 ? (
                        <motion.div
                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                            className="rounded-xl border border-border bg-background/50 py-12 text-center"
                            exit={
                                shouldReduceMotion
                                    ? { opacity: 0, transition: { duration: 0 } }
                                    : { opacity: 0, scale: 0.95 }
                            }
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                            key="no-results"
                            transition={springTransition}
                        >
                            <p className="text-foreground/60" role="status">
                                {noResultsText}
                            </p>
                        </motion.div>
                    ) : (
                        filteredSections.map((section) => (
                            <motion.section
                                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                aria-labelledby={`faq-section-${section.sectionIndex}`}
                                exit={
                                    shouldReduceMotion
                                        ? { opacity: 0, transition: { duration: 0 } }
                                        : { opacity: 0, y: -10 }
                                }
                                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                                key={section.title}
                                transition={springTransition}
                            >
                                <h2
                                    className="mb-4 font-semibold text-foreground text-lg"
                                    id={`faq-section-${section.sectionIndex}`}
                                >
                                    {section.title}
                                </h2>
                                <div className="space-y-4">
                                    {section.items.map((item) => {
                                        const key = itemKey(item.sectionIndex, item.itemIndex)
                                        const isOpen = openKey === key
                                        const buttonId = `faq-${key}-button`
                                        const panelId = `faq-${key}-panel`
                                        const delay = shouldReduceMotion ? 0 : Math.min(cardIndex, 8) * 0.05
                                        cardIndex += 1

                                        return (
                                            <motion.div
                                                animate={
                                                    shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }
                                                }
                                                exit={
                                                    shouldReduceMotion
                                                        ? { opacity: 0, transition: { duration: 0 } }
                                                        : { opacity: 0, scale: 0.95, y: -10 }
                                                }
                                                initial={
                                                    shouldReduceMotion
                                                        ? { opacity: 1 }
                                                        : { opacity: 0, scale: 0.95, y: 20 }
                                                }
                                                className="group scroll-mt-24 overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-brand"
                                                id={faqSlug(item.question)}
                                                key={key}
                                                layout={!shouldReduceMotion}
                                                transition={{
                                                    ...springTransition,
                                                    delay,
                                                }}
                                            >
                                                <button
                                                    aria-controls={panelId}
                                                    aria-expanded={isOpen}
                                                    className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition-colors hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                                                    id={buttonId}
                                                    onClick={() => setOpenKey(isOpen ? null : key)}
                                                    type="button"
                                                >
                                                    <span className="pr-4 font-medium text-foreground">
                                                        {item.question}
                                                    </span>
                                                    <motion.span
                                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                                        className="shrink-0"
                                                        transition={springTransition}
                                                    >
                                                        <ChevronDownIcon
                                                            aria-hidden
                                                            className="size-5 text-foreground/60"
                                                        />
                                                    </motion.span>
                                                </button>

                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            aria-labelledby={buttonId}
                                                            className="overflow-hidden"
                                                            exit={
                                                                shouldReduceMotion
                                                                    ? {
                                                                          height: 0,
                                                                          opacity: 0,
                                                                          transition: { duration: 0 },
                                                                      }
                                                                    : { height: 0, opacity: 0 }
                                                            }
                                                            id={panelId}
                                                            initial={
                                                                shouldReduceMotion
                                                                    ? { height: 'auto', opacity: 1 }
                                                                    : { height: 0, opacity: 0 }
                                                            }
                                                            role="region"
                                                            transition={contentTransition}
                                                        >
                                                            <div className="px-5 pb-5">
                                                                <FaqAnswer answer={item.answer} />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </motion.section>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
