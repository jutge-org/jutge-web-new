'use client'

import { CalendarIcon } from 'lucide-react'

import AnimatedStepper, { type StepItem } from '@/components/smoothui/animated-stepper'
import { cn } from '@/lib/utils'
import { SLIDE_IDS, type SlideId } from '@/lib/wrapped/slides'
import { t } from '@/lib/wrapped/strings'

/** Timeline index for the settings / date-range step (always first). */
export const WRAPPED_SETTINGS_STEP = 0

function settingsStep(): StepItem {
    return {
        label: t('deck.steps.settings'),
        icon: <CalendarIcon className="size-4" aria-hidden />,
    }
}

export function buildWrappedTimelineSteps(
    slideIds: readonly SlideId[] = SLIDE_IDS,
): StepItem[] {
    return [
        settingsStep(),
        ...slideIds.map((id, i) => ({
            label: t(`deck.steps.${id}`),
            stepNumber: i + 1,
        })),
    ]
}

type WrappedTimelineProps = {
    allowClickNavigation?: boolean
    className?: string
    currentStep?: number
    disabled?: boolean
    onStepChange?: (step: number) => void
    steps?: StepItem[]
}

/** Compact horizontal timeline used across date picker, loading, and deck views. */
export function WrappedTimeline({
    allowClickNavigation = false,
    className,
    currentStep = WRAPPED_SETTINGS_STEP,
    disabled = false,
    onStepChange,
    steps,
}: WrappedTimelineProps) {
    return (
        <AnimatedStepper
            allowClickNavigation={allowClickNavigation}
            className={cn('gap-4', className)}
            compact
            currentStep={currentStep}
            disabled={disabled}
            onStepChange={onStepChange}
            steps={steps ?? buildWrappedTimelineSteps()}
            variant="horizontal"
        />
    )
}
