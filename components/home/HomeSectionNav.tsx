'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

const EDGE_ZONE_PX = 16
const CLOSE_DELAY_MS = 180
const HEADER_OFFSET_PX = 56

type NavSide = 'left' | 'right'

export type HomeSectionNavItem = {
    id: string
    label: string
}

type HomeSectionNavProps = {
    sections: HomeSectionNavItem[]
}

function scrollToSection(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX
    window.scrollTo({ top, behavior: 'smooth' })
}

export function HomeSectionNav({ sections }: HomeSectionNavProps) {
    const shouldReduceMotion = useReducedMotion()
    const [enabled, setEnabled] = useState(false)
    const [open, setOpen] = useState(false)
    const [side, setSide] = useState<NavSide>('left')
    const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const panelRef = useRef<HTMLElement>(null)
    const openRef = useRef(false)
    const sideRef = useRef<NavSide>('left')

    const clearCloseTimer = useEffectEvent(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    })

    const scheduleClose = useEffectEvent(() => {
        if (!openRef.current) return
        clearCloseTimer()
        closeTimer.current = setTimeout(() => {
            openRef.current = false
            setOpen(false)
        }, CLOSE_DELAY_MS)
    })

    const openOnSide = useEffectEvent((nextSide: NavSide) => {
        clearCloseTimer()
        openRef.current = true
        sideRef.current = nextSide
        setSide(nextSide)
        setOpen(true)
    })

    useEffect(() => {
        const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)')
        const sync = () => setEnabled(mq.matches)
        sync()
        mq.addEventListener('change', sync)
        return () => mq.removeEventListener('change', sync)
    }, [])

    useEffect(() => {
        if (!enabled) {
            openRef.current = false
            setOpen(false)
            return
        }

        function isOverPanel(clientX: number, clientY: number) {
            const panel = panelRef.current
            if (!panel) return false
            const rect = panel.getBoundingClientRect()
            return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
        }

        function onPointerMove(event: PointerEvent) {
            if (event.pointerType !== 'mouse') return

            const nearLeft = event.clientX <= EDGE_ZONE_PX
            const nearRight = event.clientX >= window.innerWidth - EDGE_ZONE_PX

            if (nearLeft) {
                openOnSide('left')
                return
            }
            if (nearRight) {
                openOnSide('right')
                return
            }
            if (isOverPanel(event.clientX, event.clientY)) {
                openOnSide(sideRef.current)
                return
            }
            scheduleClose()
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                openRef.current = false
                setOpen(false)
            }
        }

        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('keydown', onKeyDown)
            clearCloseTimer()
        }
    }, [enabled])

    useEffect(() => {
        if (sections.length === 0) return

        const elements = sections
            .map((section) => document.getElementById(section.id))
            .filter((el): el is HTMLElement => el !== null)

        if (elements.length === 0) return

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
                const top = visible[0]
                if (top?.target.id) {
                    setActiveId(top.target.id)
                }
            },
            {
                rootMargin: `-${HEADER_OFFSET_PX}px 0px -45% 0px`,
                threshold: [0.1, 0.25, 0.5, 0.75],
            },
        )

        for (const el of elements) {
            observer.observe(el)
        }
        return () => observer.disconnect()
    }, [sections])

    if (!enabled || sections.length === 0) {
        return null
    }

    const enterX = side === 'left' ? -20 : 20
    const exitX = side === 'left' ? -16 : 16

    return (
        <AnimatePresence mode="wait">
            {open ? (
                <motion.div
                    key={`home-section-nav-${side}`}
                    className={cn(
                        'pointer-events-none fixed inset-y-0 z-40 flex items-center',
                        side === 'left' ? 'left-3' : 'right-3',
                    )}
                    initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: enterX }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: exitX }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.12 }}
                >
                    <aside
                        ref={panelRef}
                        aria-label="Page sections"
                        className={cn(
                            'pointer-events-auto flex max-h-[min(70vh,32rem)] w-56 flex-col overflow-hidden rounded-xl border',
                            'bg-popover/95 text-popover-foreground shadow-lg',
                            'backdrop-blur-md supports-backdrop-filter:bg-popover/90',
                        )}
                        onPointerEnter={() => openOnSide(side)}
                        onPointerLeave={scheduleClose}
                    >
                        <div className="border-b px-3 py-2.5">
                            <p className="font-medium text-foreground text-xs tracking-wide">On this page</p>
                        </div>
                        <nav className="overflow-y-auto p-1.5" aria-label="Guest home sections">
                            <ul className="flex flex-col gap-0.5">
                                {sections.map((section) => {
                                    const isActive = section.id === activeId
                                    return (
                                        <li key={section.id}>
                                            <button
                                                type="button"
                                                className={cn(
                                                    'w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                                                    isActive
                                                        ? 'bg-muted font-medium text-foreground'
                                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                                                )}
                                                aria-current={isActive ? 'true' : undefined}
                                                onClick={() => {
                                                    scrollToSection(section.id)
                                                    openRef.current = false
                                                    setOpen(false)
                                                }}
                                            >
                                                {section.label}
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </nav>
                    </aside>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
