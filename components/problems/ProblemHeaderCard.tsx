'use client'

import confetti from 'canvas-confetti'
import Link from 'next/link'
import { LanguagesIcon, ListTodoIcon, ScrollIcon, SignatureIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef, type ReactNode } from 'react'

import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { ProblemInformation } from '@/components/problems/ProblemInformation'
import { ProblemStatusIcon } from '@/components/problems/ProblemStatusIcon'
import { ProblemSubmitButton } from '@/components/problems/ProblemSubmitButton'
import { ProblemTypeIcon } from '@/components/problems/ProblemTypeIcon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AbstractStatus } from '@/lib/jutge_api_client'
import type { ProblemDetailData } from '@/lib/data/problemDetail'
import { problemIconUrl } from '@/lib/problems'
import { isMotionReduced } from '@/lib/reducedMotion'
import { isSoundEffectsEnabled } from '@/lib/soundEffects'
import { supervisionProblemHref, type SupervisionContext } from '@/lib/supervision'
import { cn } from '@/lib/utils'

type ProblemHeaderCardProps = {
    pageKey: string
    data: ProblemDetailData
    status?: AbstractStatus | null
    defaultCompilerId?: string | null
    showActions?: boolean
    supervisionContext?: SupervisionContext
    /** Pull the card up into the sticky header, matching PageTitle. */
    overlapHeader?: boolean
}

function ProblemHeaderAction({ children }: { children: ReactNode }) {
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)

    return (
        <motion.div
            className={cn('inline-flex', !motionReduced && 'group')}
            whileHover={motionReduced ? undefined : { scale: 1.08, y: -2 }}
            whileTap={motionReduced ? undefined : { scale: 0.96 }}
            transition={
                motionReduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 22 }
            }
        >
            {children}
        </motion.div>
    )
}

function ProblemHeaderNavButton({
    href,
    label,
    children,
}: {
    href: string
    label: string
    children: ReactNode
}) {
    return (
        <ProblemHeaderAction>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        asChild
                        variant="default"
                        size="icon-lg"
                        className="size-16 shrink-0 rounded-full hover:bg-primary/80"
                        aria-label={label}
                    >
                        <Link href={href}>{children}</Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{label}</TooltipContent>
            </Tooltip>
        </ProblemHeaderAction>
    )
}

const SUCCESS_SOUNDS = [
    '/sounds/success-1.mp3',
    '/sounds/success-2.mp3',
    '/sounds/success-3.mp3',
    '/sounds/success-4.mp3',
    '/sounds/success-5.mp3',
] as const

function playRandomSuccessSound() {
    const src = SUCCESS_SOUNDS[Math.floor(Math.random() * SUCCESS_SOUNDS.length)]!
    void new Audio(src).play()
}

function launchAcceptedConfetti(originEl: HTMLElement, playSound: boolean) {
    const rect = originEl.getBoundingClientRect()
    const origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
    }

    if (playSound) {
        playRandomSuccessSound()
    }

    confetti({
        particleCount: 60,
        spread: 30,
        startVelocity: 28,
        scalar: 0.85,
        origin,
        colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'],
    })

    confetti({
        particleCount: 30,
        spread: 70,
        startVelocity: 18,
        scalar: 0.7,
        origin,
        colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#ffffff'],
    })
}

function ProblemHeaderIconImage({ iconUrl }: { iconUrl: string }) {
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)

    return (
        <ProblemIconImage
            iconUrl={iconUrl}
            size="lg"
            className={cn('shrink-0', !motionReduced && 'hover:animate-[spin_3s_linear_infinite]')}
        />
    )
}

function ProblemAcceptedIcon({ iconUrl }: { iconUrl: string }) {
    const iconRef = useRef<HTMLButtonElement>(null)
    const { reducedMotion, soundEffects } = useAppearancePreferences()

    if (isMotionReduced(reducedMotion)) {
        return <ProblemHeaderIconImage iconUrl={iconUrl} />
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    ref={iconRef}
                    type="button"
                    className="shrink-0 cursor-pointer rounded-sm"
                    aria-label="Celebrate solving this problem"
                    onClick={() => {
                        if (iconRef.current) {
                            launchAcceptedConfetti(iconRef.current, isSoundEffectsEnabled(soundEffects))
                        }
                    }}
                >
                    <ProblemHeaderIconImage iconUrl={iconUrl} />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Celebrate!</TooltipContent>
        </Tooltip>
    )
}

export function ProblemHeaderCard({
    pageKey,
    data,
    status,
    defaultCompilerId,
    showActions = false,
    supervisionContext,
    overlapHeader = true,
}: ProblemHeaderCardProps) {
    const { problem } = data
    const iconUrl = problemIconUrl(problem.abstract_problem.icon)
    const isAccepted = status?.status === 'accepted'

    return (
        <div
            className={cn(
                'flex min-h-22 items-center gap-5 rounded-2xl border border-border px-6 pt-5 pb-3.5 text-left shadow-sm',
                overlapHeader && '-mt-6',
            )}
        >
            <TooltipProvider>
                <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-5">
                        {iconUrl ? (
                            isAccepted ? (
                                <ProblemAcceptedIcon iconUrl={iconUrl} />
                            ) : (
                                <ProblemHeaderIconImage iconUrl={iconUrl} />
                            )
                        ) : null}
                        <div className="flex min-w-0 flex-1 flex-col gap-0">
                            <h1
                                className="mt-0 mb-1 flex min-w-0 items-center gap-2 text-2xl font-semibold tracking-tight text-foreground"
                                data-recent-problem-icon-url={iconUrl ?? undefined}
                            >
                                {showActions && status ? <ProblemStatusIcon status={status} /> : null}
                                <span className="min-w-0">{problem.title}</span>
                            </h1>
                            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                {problem.abstract_problem.driver_id ? (
                                    <ProblemTypeIcon
                                        type={problem.abstract_problem.driver_id}
                                        className="size-3 shrink-0"
                                    />
                                ) : null}
                                {problem.problem_nm}
                                {data.languageVariants.map((variant) => {
                                    const isCurrent = variant.problem_id === problem.problem_id
                                    return (
                                        <Tooltip key={variant.problem_id}>
                                            <TooltipTrigger asChild>
                                                <Badge
                                                    variant={isCurrent ? 'default' : 'outline'}
                                                    asChild={!isCurrent}
                                                    className={cn(!isCurrent && 'hover:bg-muted')}
                                                >
                                                    {isCurrent ? (
                                                        <span>{variant.language_id}</span>
                                                    ) : (
                                                        <Link
                                                            href={
                                                                supervisionContext
                                                                    ? supervisionProblemHref(
                                                                          supervisionContext,
                                                                          variant.problem_id,
                                                                      )
                                                                    : `/problems/${variant.problem_id}`
                                                            }
                                                        >
                                                            {variant.language_id}
                                                        </Link>
                                                    )}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">{variant.title}</TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                                <ProblemInformation data={data} />
                            </p>
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                <SignatureIcon className="size-3 shrink-0" aria-hidden />
                                {problem.abstract_problem.author}
                            </p>
                            {problem.translator && problem.translator !== problem.abstract_problem.author ? (
                                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <LanguagesIcon className="size-3 shrink-0" aria-hidden />
                                    {problem.translator}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    {showActions ? (
                        <div className="flex shrink-0 items-center gap-4">
                            <ProblemHeaderNavButton href={`/problems/${pageKey}`} label="Show statement">
                                <ScrollIcon className="size-8 stroke-[1.5] shrink-0" aria-hidden />
                            </ProblemHeaderNavButton>
                            <ProblemHeaderNavButton href={`/problems/${pageKey}/submissions`} label="List submissions">
                                <ListTodoIcon className="size-8 stroke-[1.5] shrink-0" aria-hidden />
                            </ProblemHeaderNavButton>
                            <ProblemHeaderAction>
                                <ProblemSubmitButton
                                    problemId={problem.problem_id}
                                    compilers={data.compilers}
                                    defaultCompilerId={defaultCompilerId}
                                />
                            </ProblemHeaderAction>
                        </div>
                    ) : null}
                </div>
            </TooltipProvider>
        </div>
    )
}
