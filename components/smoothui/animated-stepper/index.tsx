'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useCallback, useId, useRef, useState } from 'react'

import ShaderRevealWipeTransition from '@/components/smoothui/shader-reveal-wipe-transition'
import { cn } from '@/lib/utils'

export interface StepItem {
    content?: ReactNode
    description?: string
    icon?: ReactNode
    label: string
    /** Override the number shown in the circle when not using an icon. */
    stepNumber?: number
}

export interface AnimatedStepperProps {
    allowClickNavigation?: boolean
    className?: string
    /** Tighter circles and connectors for decks with many steps. */
    compact?: boolean
    currentStep?: number
    defaultStep?: number
    /** Renders all steps inactive and non-interactive. */
    disabled?: boolean
    onStepChange?: (step: number) => void
    /** Show step labels beside/under indicators. Defaults to true. */
    showLabels?: boolean
    steps: StepItem[]
    variant?: 'horizontal' | 'vertical'
}

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 *    0ms   stepper enters viewport
 *  100ms   step circles stagger in (50ms each)
 *  click   active ring pulse + circle scale bounce
 *  step    progress line fills with spring
 *  done    checkmark draws with pathLength animation
 *  slide   content slides directionally with crossfade
 * ───────────────────────────────────────────────────────── */

const SPRING = {
    bounce: 0.1,
    duration: 0.25,
    type: 'spring' as const,
}

const SPRING_BOUNCY = {
    bounce: 0.2,
    duration: 0.3,
    type: 'spring' as const,
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            className={cn('h-5 w-5', className)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
        >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export default function AnimatedStepper({
    steps,
    currentStep: controlledStep,
    defaultStep = 0,
    onStepChange,
    variant = 'horizontal',
    allowClickNavigation = false,
    compact = false,
    disabled = false,
    showLabels = true,
    className,
}: AnimatedStepperProps) {
    const shouldReduceMotion = useReducedMotion()
    const id = useId()

    const [internalStep, setInternalStep] = useState(defaultStep)
    const prevStepRef = useRef(
        controlledStep !== undefined ? controlledStep : defaultStep,
    )
    const directionRef = useRef<1 | -1>(1)

    const isControlled = controlledStep !== undefined
    const activeStep = isControlled ? controlledStep : internalStep
    const canNavigate = allowClickNavigation && !disabled
    const hasContent = steps.some((step) => step.content != null)

    if (prevStepRef.current !== activeStep) {
        directionRef.current = activeStep > prevStepRef.current ? 1 : -1
        prevStepRef.current = activeStep
    }

    const handleStepChange = useCallback(
        (step: number) => {
            if (disabled || step < 0 || step >= steps.length) {
                return
            }
            if (!isControlled) {
                setInternalStep(step)
            }
            onStepChange?.(step)
        },
        [disabled, isControlled, onStepChange, steps.length],
    )

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (!canNavigate) {
                return
            }
            const isHoriz = variant === 'horizontal'
            const nextKey = isHoriz ? 'ArrowRight' : 'ArrowDown'
            const prevKey = isHoriz ? 'ArrowLeft' : 'ArrowUp'

            if (event.key === nextKey) {
                event.preventDefault()
                event.stopPropagation()
                handleStepChange(Math.min(activeStep + 1, steps.length - 1))
            } else if (event.key === prevKey) {
                event.preventDefault()
                event.stopPropagation()
                handleStepChange(Math.max(activeStep - 1, 0))
            }
        },
        [canNavigate, variant, activeStep, steps.length, handleStepChange],
    )

    const progress = disabled
        ? 0
        : steps.length > 1
          ? activeStep / (steps.length - 1)
          : 0
    const isHorizontal = variant === 'horizontal'
    const circleSize = compact ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
    const checkSize = compact ? 'h-4 w-4' : 'h-5 w-5'
    const trackInset = compact ? 'left-4 right-4' : 'left-5 right-5'
    const trackTop = compact ? 'top-4' : 'top-5'

    return (
        <div
            className={cn(
                'flex w-full gap-6',
                isHorizontal ? 'flex-col' : 'flex-row',
                disabled && 'opacity-60',
                className,
            )}
        >
            <div
                aria-disabled={disabled || undefined}
                aria-label="Progress steps"
                className={cn(
                    'relative flex w-full',
                    isHorizontal
                        ? 'flex-row items-start justify-between'
                        : 'flex-col items-start gap-2',
                    isHorizontal && showLabels && 'pb-6',
                )}
                role="group"
            >
                {isHorizontal && (
                    <div
                        aria-hidden
                        className={cn(
                            'absolute h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted',
                            trackInset,
                            trackTop,
                        )}
                    >
                        <motion.div
                            animate={{ width: `${progress * 100}%` }}
                            className="h-full bg-primary"
                            transition={shouldReduceMotion ? { duration: 0 } : SPRING}
                        />
                    </div>
                )}

                {steps.map((step, index) => {
                    const isActive = !disabled && index === activeStep
                    const isCompleted = !disabled && index < activeStep

                    return (
                        <div
                            className={cn(
                                'relative z-10 flex',
                                isHorizontal
                                    ? 'flex-col items-center'
                                    : 'items-center gap-3',
                            )}
                            key={`${id}-step-${step.label}`}
                        >
                            <motion.button
                                animate={shouldReduceMotion ? undefined : { scale: 1 }}
                                aria-label={`${step.stepNumber != null ? `Step ${step.stepNumber}: ${step.label}` : step.label}${isCompleted ? ', completed' : ''}${isActive ? ', current' : ''}`}
                                aria-selected={isActive}
                                className={cn(
                                    'relative flex shrink-0 items-center justify-center rounded-full border-2 font-medium',
                                    circleSize,
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                    isActive &&
                                        'border-primary bg-primary text-primary-foreground',
                                    isCompleted &&
                                        'border-primary bg-primary text-primary-foreground',
                                    !(isActive || isCompleted) &&
                                        'border-muted-foreground/30 bg-background text-muted-foreground',
                                    canNavigate ? 'cursor-pointer' : 'cursor-default',
                                )}
                                disabled={!canNavigate}
                                id={`${id}-step-${index}`}
                                onClick={() => canNavigate && handleStepChange(index)}
                                onKeyDown={handleKeyDown}
                                role="tab"
                                tabIndex={disabled ? -1 : isActive ? 0 : -1}
                                transition={shouldReduceMotion ? { duration: 0 } : SPRING}
                                type="button"
                                whileTap={
                                    canNavigate && !shouldReduceMotion
                                        ? { scale: 0.9 }
                                        : undefined
                                }
                            >
                                {isActive && !shouldReduceMotion && (
                                    <motion.span
                                        animate={{ opacity: 0, scale: 1.6 }}
                                        className="absolute inset-0 rounded-full border-2 border-primary"
                                        initial={{ opacity: 0.5, scale: 1 }}
                                        transition={{
                                            duration: 0.6,
                                            ease: [0.23, 1, 0.32, 1],
                                        }}
                                    />
                                )}

                                <AnimatePresence initial={false} mode="wait">
                                    {isCompleted ? (
                                        <motion.span
                                            animate={
                                                shouldReduceMotion
                                                    ? { opacity: 1 }
                                                    : { opacity: 1, scale: 1 }
                                            }
                                            exit={
                                                shouldReduceMotion
                                                    ? { opacity: 0 }
                                                    : { opacity: 0, scale: 0.5 }
                                            }
                                            initial={
                                                shouldReduceMotion
                                                    ? { opacity: 0 }
                                                    : { opacity: 0, scale: 0.5 }
                                            }
                                            key="check"
                                            transition={
                                                shouldReduceMotion
                                                    ? { duration: 0 }
                                                    : SPRING_BOUNCY
                                            }
                                        >
                                            {step.icon ?? <CheckIcon className={checkSize} />}
                                        </motion.span>
                                    ) : step.icon ? (
                                        <motion.span
                                            animate={
                                                shouldReduceMotion
                                                    ? { opacity: 1 }
                                                    : { opacity: 1, scale: 1 }
                                            }
                                            exit={
                                                shouldReduceMotion
                                                    ? { opacity: 0 }
                                                    : { opacity: 0, scale: 0.8 }
                                            }
                                            initial={
                                                shouldReduceMotion
                                                    ? { opacity: 0 }
                                                    : { opacity: 0, scale: 0.8 }
                                            }
                                            key="icon"
                                            transition={
                                                shouldReduceMotion
                                                    ? { duration: 0 }
                                                    : SPRING
                                            }
                                        >
                                            {step.icon}
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            animate={
                                                shouldReduceMotion
                                                    ? { opacity: 1 }
                                                    : { opacity: 1, scale: 1 }
                                            }
                                            exit={
                                                shouldReduceMotion
                                                    ? { opacity: 0 }
                                                    : { opacity: 0, scale: 0.8 }
                                            }
                                            initial={
                                                shouldReduceMotion
                                                    ? { opacity: 0 }
                                                    : { opacity: 0, scale: 0.8 }
                                            }
                                            key="number"
                                            transition={
                                                shouldReduceMotion
                                                    ? { duration: 0 }
                                                    : SPRING
                                            }
                                        >
                                            {step.stepNumber ?? index + 1}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>

                            {showLabels && (
                                <div
                                    className={cn(
                                        isHorizontal
                                            ? 'absolute top-full left-1/2 mt-1.5 w-16 -translate-x-1/2 text-center sm:block'
                                            : undefined,
                                        isHorizontal && 'hidden',
                                    )}
                                >
                                    <p
                                        className={cn(
                                            'font-medium transition-colors duration-200',
                                            isHorizontal && compact
                                                ? 'truncate text-[10px] leading-tight'
                                                : 'text-sm',
                                            isActive
                                                ? 'text-foreground'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {step.label}
                                    </p>
                                    {step.description && !(isHorizontal && compact) ? (
                                        <p className="text-xs text-muted-foreground">
                                            {step.description}
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )
                })}

                {!isHorizontal && (
                    <div className="absolute top-5 left-5 h-[calc(100%-2.5rem)] w-0.5 -translate-x-1/2 overflow-hidden bg-muted">
                        <motion.div
                            animate={{ height: `${progress * 100}%` }}
                            className="w-full bg-primary"
                            transition={shouldReduceMotion ? { duration: 0 } : SPRING}
                        />
                    </div>
                )}
            </div>

            {hasContent ? (
                <div aria-label={`Step ${activeStep + 1} content`} role="tabpanel">
                    {shouldReduceMotion ? (
                        <div key={activeStep}>{steps[activeStep]?.content}</div>
                    ) : (
                        <ShaderRevealWipeTransition
                            className="bg-transparent"
                            direction={directionRef.current}
                            transitionKey={activeStep}
                        >
                            {steps[activeStep]?.content}
                        </ShaderRevealWipeTransition>
                    )}
                </div>
            ) : null}
        </div>
    )
}
