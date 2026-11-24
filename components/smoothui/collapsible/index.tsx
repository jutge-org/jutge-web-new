'use client'

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { SPRING_DEFAULT } from '@/components/smoothui/lib/animation'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import {
    createContext,
    useContext,
    useState,
    type ComponentProps,
    type ReactNode,
} from 'react'

type SmoothCollapsibleContextValue = {
    open: boolean
}

const SmoothCollapsibleContext = createContext<SmoothCollapsibleContextValue | null>(null)

export function SmoothCollapsible({
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    className,
    children,
    ...props
}: ComponentProps<typeof Collapsible>) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
    const controlled = openProp !== undefined
    const open = controlled ? openProp : uncontrolledOpen

    function handleOpenChange(next: boolean) {
        if (!controlled) setUncontrolledOpen(next)
        onOpenChange?.(next)
    }

    return (
        <SmoothCollapsibleContext.Provider value={{ open }}>
            <Collapsible open={open} onOpenChange={handleOpenChange} className={className} {...props}>
                {children}
            </Collapsible>
        </SmoothCollapsibleContext.Provider>
    )
}

export function SmoothCollapsibleTrigger({
    children,
    className,
    showChevron = true,
    ...props
}: ComponentProps<typeof CollapsibleTrigger> & { showChevron?: boolean }) {
    return (
        <CollapsibleTrigger
            className={cn(
                'group flex w-full items-center gap-2 rounded-md text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                className,
            )}
            {...props}
        >
            {showChevron ? (
                <ChevronDownIcon
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90"
                />
            ) : null}
            {children}
        </CollapsibleTrigger>
    )
}

export function SmoothCollapsibleContent({
    children,
    className,
    ...props
}: ComponentProps<typeof CollapsibleContent>) {
    const ctx = useContext(SmoothCollapsibleContext)
    const shouldReduceMotion = useReducedMotion()
    const open = ctx?.open ?? false

    if (shouldReduceMotion) {
        if (!open) return null
        return (
            <CollapsibleContent className={className} {...props}>
                {children}
            </CollapsibleContent>
        )
    }

    return (
        <CollapsibleContent forceMount {...props} asChild>
            <motion.div
                className={cn('overflow-hidden', className)}
                initial={false}
                animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                transition={open ? SPRING_DEFAULT : { ...SPRING_DEFAULT, duration: 0.2 }}
            >
                <div className="pt-0">{children as ReactNode}</div>
            </motion.div>
        </CollapsibleContent>
    )
}