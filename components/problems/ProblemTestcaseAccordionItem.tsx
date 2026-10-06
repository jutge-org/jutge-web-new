'use client'

import {
    AArrowDownIcon,
    AArrowUpIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Columns2Icon,
    EyeIcon,
    EyeOffIcon,
    Rows2Icon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WidgetSpinner } from '@/components/general/WidgetSpinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TestcaseField } from '@/components/TestcaseField'
import { useFontScalePreference } from '@/hooks/use-font-scale-preference'
import { fetchProblemTestcaseAction } from '@/lib/data/problemTestcases'
import type { InstructorProblemResourceAccess } from '@/lib/data/instructorSharedResources'
import { formatTestcaseDisplayName, type DecodedTestcase } from '@/lib/data/problemDetail'
import { FONT_SCALE_STEP, MAX_FONT_SCALE, MIN_FONT_SCALE, TESTCASES_FONT_SCALE_KEY } from '@/lib/fontScale'
import jutge from '@/lib/jutge'
import { cn } from '@/lib/utils'

type ProblemTestcaseAccordionItemProps = {
    problemId: string
    testcaseName: string
    driverId: string | null | undefined
    testcaseAccess: InstructorProblemResourceAccess
    shared_testcases: number
    isOpen: boolean
    onToggle: () => void
}

export function ProblemTestcaseAccordionItem({
    problemId,
    testcaseName,
    driverId,
    testcaseAccess,
    shared_testcases,
    isOpen,
    onToggle,
}: ProblemTestcaseAccordionItemProps) {
    const [testcase, setTestcase] = useState<DecodedTestcase | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showWhitespace, setShowWhitespace] = useState(false)
    const [sideways, setSideways] = useState(true)
    const [fontScale, setFontScale] = useFontScalePreference(TESTCASES_FONT_SCALE_KEY)
    const loadedNameRef = useRef<string | null>(null)

    const displayName = formatTestcaseDisplayName(testcaseName)
    const expandLabel = isOpen ? `Collapse test case ${displayName}` : `Expand test case ${displayName}`
    const pendingContent = isOpen && !testcase && !error

    useEffect(() => {
        if (!isOpen || loadedNameRef.current === testcaseName) {
            return
        }

        let cancelled = false
        setError(null)

        void fetchProblemTestcaseAction(jutge, {
            problem_id: problemId,
            testcase: testcaseName,
            driverId,
            access: testcaseAccess,
            shared_testcases,
        }).then((result) => {
            if (cancelled) {
                return
            }

            if (!result.ok) {
                setError(result.error)
                return
            }

            loadedNameRef.current = testcaseName
            setTestcase(result.testcase)
        })

        return () => {
            cancelled = true
        }
    }, [driverId, isOpen, problemId, shared_testcases, testcaseAccess, testcaseName])

    return (
        <TooltipProvider>
            <Card className={cn('gap-0 pt-2 ring-0 border border-border shadow-sm', isOpen ? 'pb-0' : 'pb-2')}>
                <CardHeader className={cn('px-4 py-2', isOpen && 'border-b border-border')}>
                    <div className="flex w-full items-center gap-2">
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-expanded={isOpen}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                            <CardTitle className="text-lg font-semibold">{displayName}</CardTitle>
                        </button>
                        {isOpen && testcase ? (
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
                                            {showWhitespace
                                                ? 'Hide whitespace characters'
                                                : 'Show whitespace characters'}
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
                        ) : null}
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-label={expandLabel}
                            className="flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                            {isOpen ? (
                                <ChevronUpIcon className="size-4 text-muted-foreground" aria-hidden />
                            ) : (
                                <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden />
                            )}
                        </button>
                    </div>
                </CardHeader>
                {isOpen ? (
                    <CardContent className={cn('flex flex-col gap-4 px-6 py-4', pendingContent && 'min-h-48')}>
                        {pendingContent ? <WidgetSpinner className="min-h-48" label="Loading test case" /> : null}
                        {error ? <p className="text-sm text-destructive">{error}</p> : null}
                        {testcase ? (
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
                        ) : null}
                    </CardContent>
                ) : null}
            </Card>
        </TooltipProvider>
    )
}
