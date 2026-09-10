'use client'

import { useState } from 'react'
import { AArrowDownIcon, AArrowUpIcon, Columns2Icon, EyeIcon, EyeOffIcon, Rows2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TestcaseField } from '@/components/TestcaseField'
import { useFontScalePreference } from '@/hooks/use-font-scale-preference'
import { FONT_SCALE_STEP, MAX_FONT_SCALE, MIN_FONT_SCALE, TESTCASES_FONT_SCALE_KEY } from '@/lib/fontScale'
import { cn } from '@/lib/utils'
import type { DecodedTestcase } from '@/lib/data/problemDetail'

type PublicTestcasesProps = {
    testcases: DecodedTestcase[]
}

export function PublicTestcasesSkeleton() {
    return (
        <Card className="ring-0 border border-border shadow-sm" aria-busy="true" aria-label="Loading public test cases">
            <CardHeader className="border-b">
                <CardTitle>Public test cases</CardTitle>
                <CardAction>
                    <div className="inline-flex items-center gap-2">
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-24 w-full rounded-md" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-24 w-full rounded-md" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-24 w-full rounded-md" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-24 w-full rounded-md" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function PublicTestcases({ testcases }: PublicTestcasesProps) {
    const [showWhitespace, setShowWhitespace] = useState(false)
    const [sideways, setSideways] = useState(true)
    const [fontScale, setFontScale] = useFontScalePreference(TESTCASES_FONT_SCALE_KEY)

    return (
        <TooltipProvider>
            <Card className="ring-0 border border-border shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle>Public test cases</CardTitle>
                    <CardAction>
                        <div className="inline-flex items-center gap-2">
                            <div className="inline-flex overflow-hidden rounded-lg border border-input">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            aria-label={
                                                showWhitespace
                                                    ? 'Hide whitespace characters'
                                                    : 'Show whitespace characters'
                                            }
                                            onClick={() => setShowWhitespace((value) => !value)}
                                            className="rounded-none border-0 border-r border-input"
                                        >
                                            {showWhitespace ? <EyeOffIcon /> : <EyeIcon />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {showWhitespace ? 'Hide whitespace characters' : 'Show whitespace characters'}
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            aria-label={
                                                sideways
                                                    ? 'Stack input and output vertically'
                                                    : 'Show input and output side by side'
                                            }
                                            onClick={() => setSideways((value) => !value)}
                                            className="rounded-none border-0"
                                        >
                                            {sideways ? <Rows2Icon /> : <Columns2Icon />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {sideways
                                            ? 'Stack input and output vertically'
                                            : 'Show input and output side by side'}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="inline-flex overflow-hidden rounded-lg border border-input">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            aria-label="Decrease test case font size"
                                            disabled={fontScale <= MIN_FONT_SCALE}
                                            onClick={() =>
                                                setFontScale((scale) =>
                                                    Math.max(MIN_FONT_SCALE, scale - FONT_SCALE_STEP),
                                                )
                                            }
                                            className="rounded-none border-0 border-r border-input"
                                        >
                                            <AArrowDownIcon />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Decrease font size</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            aria-label="Increase test case font size"
                                            disabled={fontScale >= MAX_FONT_SCALE}
                                            onClick={() =>
                                                setFontScale((scale) =>
                                                    Math.min(MAX_FONT_SCALE, scale + FONT_SCALE_STEP),
                                                )
                                            }
                                            className="rounded-none border-0"
                                        >
                                            <AArrowUpIcon />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">Increase font size</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col">
                    {testcases.map((testcase) => (
                        <div key={testcase.name} className="pb-4 last:pb-0">
                            <div className={cn('grid gap-4', sideways && 'md:grid-cols-2')}>
                                <TestcaseField
                                    label="Input"
                                    text={testcase.input}
                                    showWhitespace={showWhitespace}
                                    fontScale={fontScale}
                                />
                                <TestcaseField
                                    label="Output"
                                    text={testcase.output}
                                    imageSrc={testcase.outputImageSrc}
                                    showWhitespace={showWhitespace}
                                    fontScale={fontScale}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}
