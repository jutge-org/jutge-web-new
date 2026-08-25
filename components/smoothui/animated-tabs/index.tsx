'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

export interface AnimatedTabsProps {
    activeTab?: string
    className?: string
    defaultTab?: string
    layoutId?: string
    onChange?: (tabId: string) => void
    tabs: { id: string; label: string; icon?: ReactNode }[]
    variant?: 'underline' | 'pill' | 'segment'
}

const SPRING = {
    type: 'spring' as const,
    duration: 0.25,
    bounce: 0.05,
}

type IndicatorBox = {
    left: number
    top: number
    width: number
    height: number
}

export default function AnimatedTabs({
    tabs,
    activeTab: controlledActiveTab,
    defaultTab,
    onChange,
    variant = 'underline',
    layoutId: customLayoutId,
    className,
}: AnimatedTabsProps) {
    const shouldReduceMotion = useReducedMotion()
    const generatedId = useId()
    const layoutId = customLayoutId ?? `animated-tabs-${generatedId}`
    const listRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
    const [indicator, setIndicator] = useState<IndicatorBox | null>(null)

    const [internalActiveTab, setInternalActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '')

    const isControlled = controlledActiveTab !== undefined
    const activeTab = isControlled ? controlledActiveTab : internalActiveTab

    const updateIndicator = useCallback(() => {
        const list = listRef.current
        const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
        const activeEl = tabRefs.current[activeIndex]
        if (!list || !activeEl) {
            setIndicator(null)
            return
        }

        setIndicator({
            left: activeEl.offsetLeft,
            top: activeEl.offsetTop,
            width: activeEl.offsetWidth,
            height: activeEl.offsetHeight,
        })
    }, [activeTab, tabs])

    useLayoutEffect(() => {
        updateIndicator()
    }, [updateIndicator])

    useEffect(() => {
        const list = listRef.current
        if (!list || typeof ResizeObserver === 'undefined') return

        const observer = new ResizeObserver(() => updateIndicator())
        observer.observe(list)
        for (const tab of tabRefs.current) {
            if (tab) observer.observe(tab)
        }
        return () => observer.disconnect()
    }, [updateIndicator, tabs.length])

    const handleTabChange = useCallback(
        (tabId: string) => {
            if (!isControlled) {
                setInternalActiveTab(tabId)
            }
            onChange?.(tabId)
        },
        [isControlled, onChange],
    )

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent, currentIndex: number) => {
            let newIndex = currentIndex

            if (event.key === 'ArrowRight') {
                event.preventDefault()
                newIndex = (currentIndex + 1) % tabs.length
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length
            } else if (event.key === 'Home') {
                event.preventDefault()
                newIndex = 0
            } else if (event.key === 'End') {
                event.preventDefault()
                newIndex = tabs.length - 1
            } else {
                return
            }

            const newTab = tabs[newIndex]
            if (newTab) {
                handleTabChange(newTab.id)
                tabRefs.current[newIndex]?.focus()
            }
        },
        [tabs, handleTabChange],
    )

    const baseContainerStyles = cn(
        'relative inline-flex',
        variant === 'underline' && 'w-full gap-1 border-border border-b',
        variant === 'pill' && 'gap-1 rounded-full bg-muted p-1',
        variant === 'segment' && 'gap-0 rounded-lg bg-muted p-1',
    )

    const getTabStyles = (isActive: boolean) =>
        cn(
            'relative z-10 flex flex-col items-center justify-center gap-1 px-2 pt-2 pb-4 text-center font-medium text-sm transition-colors md:flex-row md:gap-2 md:px-4 md:text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            variant === 'underline' && [
                'flex-1 rounded-t-md',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            ],
            variant === 'pill' && [
                'rounded-full',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            ],
            variant === 'segment' && [
                'flex-1 rounded-md',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            ],
        )

    const indicatorClassName = cn(
        'pointer-events-none absolute z-0',
        variant === 'underline' && 'h-0.5 bg-brand',
        variant === 'pill' && 'rounded-full border border-border bg-card shadow-sm',
        variant === 'segment' && 'rounded-md border border-border bg-card shadow-sm',
    )

    return (
        <div aria-label="Tabs" className={cn(baseContainerStyles, className)} ref={listRef} role="tablist">
            {indicator ? (
                <motion.span
                    aria-hidden
                    className={indicatorClassName}
                    initial={false}
                    animate={
                        variant === 'underline'
                            ? {
                                  left: indicator.left,
                                  width: indicator.width,
                                  top: indicator.top + indicator.height - 2,
                                  height: 2,
                              }
                            : {
                                  left: indicator.left,
                                  top: indicator.top,
                                  width: indicator.width,
                                  height: indicator.height,
                              }
                    }
                    transition={shouldReduceMotion ? { duration: 0 } : SPRING}
                />
            ) : null}

            {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id

                return (
                    <button
                        aria-selected={isActive}
                        className={getTabStyles(isActive)}
                        id={`${layoutId}-tab-${tab.id}`}
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        ref={(el) => {
                            tabRefs.current[index] = el
                        }}
                        role="tab"
                        tabIndex={isActive ? 0 : -1}
                        type="button"
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
