'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { ProblemIconImage } from '@/components/problems/ProblemIconImage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { isMotionReduced } from '@/lib/reducedMotion'
import type { SolvedProblemRow } from '@/lib/statistics/data'
import { cn } from '@/lib/utils'

type SolvedProblemsCardProps = {
    problems: SolvedProblemRow[]
    loading?: boolean
}

function WidgetSpinner() {
    return (
        <div className="flex items-center justify-center py-8">
            <Spinner className="size-8 text-muted-foreground" />
        </div>
    )
}

function SolvedProblemDialog({
    problem,
    open,
    onOpenChange,
}: {
    problem: SolvedProblemRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    if (!problem) {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[min(100%-2rem,544px)]">
                <DialogHeader className="sr-only">
                    <DialogTitle>{problem.problem_nm}</DialogTitle>
                    <DialogDescription>{problem.title}</DialogDescription>
                </DialogHeader>
                <div className="flex justify-center px-4 pt-10">
                    {problem.iconUrl ? (
                        <Image
                            src={problem.iconUrl}
                            alt=""
                            width={512}
                            height={512}
                            className="w-full max-w-[512px] object-contain"
                            style={{ width: '100%', height: 'auto' }}
                        />
                    ) : (
                        <span className="flex aspect-square w-full max-w-[512px] items-center justify-center rounded-sm bg-muted px-4 text-center text-2xl font-medium">
                            {problem.problem_nm}
                        </span>
                    )}
                </div>
                <div className="p-4">
                    <Button asChild className="w-full">
                        <Link href={problem.href}>{problem.title}</Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function SolvedProblemsCard({ problems, loading }: SolvedProblemsCardProps) {
    const [selectedProblem, setSelectedProblem] = useState<SolvedProblemRow | null>(null)
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)

    return (
        <>
            <Card className="gap-4 rounded-2xl border border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Solved problems</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <WidgetSpinner />
                    ) : problems.length > 0 ? (
                        <TooltipProvider>
                            <div className="overflow-x-auto pb-2">
                                <div className="flex flex-nowrap items-center gap-4">
                                    {problems.map((problem) => (
                                        <Tooltip key={problem.problem_nm}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProblem(problem)}
                                                    className={cn(
                                                        'shrink-0 rounded-md',
                                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                    )}
                                                    aria-label={`${problem.problem_nm}: ${problem.title}`}
                                                >
                                                    {problem.iconUrl ? (
                                                        <ProblemIconImage
                                                            iconUrl={problem.iconUrl}
                                                            size="lg"
                                                            className={cn(
                                                                'shrink-0',
                                                                !motionReduced &&
                                                                    'hover:animate-[spin_3s_linear_infinite]',
                                                            )}
                                                        />
                                                    ) : (
                                                        <span className="flex size-28 items-center justify-center rounded-sm bg-muted px-2 text-center text-sm font-medium">
                                                            {problem.problem_nm}
                                                        </span>
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p className="font-medium">{problem.problem_nm}</p>
                                                <p className="text-background/70">{problem.title}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                        </TooltipProvider>
                    ) : (
                        <p className="text-sm text-muted-foreground">No solved problems yet.</p>
                    )}
                </CardContent>
            </Card>

            <SolvedProblemDialog
                problem={selectedProblem}
                open={selectedProblem !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedProblem(null)
                    }
                }}
            />
        </>
    )
}
