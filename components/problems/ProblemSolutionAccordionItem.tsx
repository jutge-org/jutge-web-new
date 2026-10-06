'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { InstructorProblemResourceAccess } from '@/lib/data/instructorSharedResources'
import { fetchProblemSolutionAction } from '@/lib/data/problemSolutionsActions'
import { DevIcon } from '@/components/administrator/DevIcon'
import { SolutionSourceCodeToolbar } from '@/components/problems/SolutionSourceCodeToolbar'
import { HighlightedSourceCode } from '@/components/submissions/HighlightedSourceCode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useFontScalePreference } from '@/hooks/use-font-scale-preference'
import { useHljsThemePreference } from '@/hooks/use-hljs-theme-preference'
import { SOURCE_CODE_FONT_SCALE_KEY } from '@/lib/fontScale'
import type { HljsThemeSelection } from '@/lib/hljsThemes'
import { formatProglangName } from '@/lib/solutions'
import { cn } from '@/lib/utils'

type ProblemSolutionAccordionItemProps = {
    pageKey: string
    problemId: string
    problem_nm: string
    proglang: string
    solutionAccess: InstructorProblemResourceAccess
    shared_solutions: number
    isOpen: boolean
    onToggle: () => void
    solutionViewHrefOverride?: string
}

export function ProblemSolutionAccordionItem({
    pageKey,
    problemId,
    problem_nm,
    proglang,
    solutionAccess,
    shared_solutions,
    isOpen,
    onToggle,
    solutionViewHrefOverride,
}: ProblemSolutionAccordionItemProps) {
    const [code, setCode] = useState<string | null>(null)
    const [codeExtension, setCodeExtension] = useState<string | null>(null)
    const [codeFilename, setCodeFilename] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [fontScale, setFontScale] = useFontScalePreference(SOURCE_CODE_FONT_SCALE_KEY)
    const [highlightTheme, setHighlightTheme] = useHljsThemePreference()
    const [previewTheme, setPreviewTheme] = useState<HljsThemeSelection | null>(null)
    const loadedProglangRef = useRef<string | null>(null)

    const activeTheme = previewTheme ?? highlightTheme

    const expandLabel = isOpen
        ? `Collapse ${formatProglangName(proglang)} solution`
        : `Expand ${formatProglangName(proglang)} solution`
    const pendingContent = isOpen && !code && !error
    const showToolbar = isOpen && Boolean(code && codeFilename)

    useEffect(() => {
        if (!isOpen || loadedProglangRef.current === proglang) {
            return
        }

        let cancelled = false
        setError(null)

        void fetchProblemSolutionAction({
            problem_id: problemId,
            problem_nm,
            proglang,
            access: solutionAccess,
            shared_solutions,
        }).then((result) => {
            if (cancelled) {
                return
            }

            if (!result.ok) {
                setError(result.error)
                return
            }

            loadedProglangRef.current = proglang
            setCode(result.code)
            setCodeExtension(result.codeExtension)
            setCodeFilename(result.codeFilename)
        })

        return () => {
            cancelled = true
        }
    }, [isOpen, problemId, problem_nm, proglang, shared_solutions, solutionAccess])

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
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <DevIcon proglang={proglang} size={16} />
                                <span>{formatProglangName(proglang)}</span>
                            </CardTitle>
                        </button>
                        {showToolbar && code && codeFilename ? (
                            <SolutionSourceCodeToolbar
                                pageKey={pageKey}
                                proglang={proglang}
                                code={code}
                                codeFilename={codeFilename}
                                fontScale={fontScale}
                                setFontScale={setFontScale}
                                highlightTheme={highlightTheme}
                                setHighlightTheme={setHighlightTheme}
                                setPreviewTheme={setPreviewTheme}
                                viewHrefOverride={solutionViewHrefOverride}
                            />
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
                    <CardContent className={cn('p-0', pendingContent && 'min-h-72')}>
                        {pendingContent ? (
                            <Skeleton className="h-72 w-full rounded-none" aria-label="Loading solution" />
                        ) : null}
                        {error ? <p className="px-4 py-3 text-sm text-destructive">{error}</p> : null}
                        {code ? (
                            <HighlightedSourceCode
                                code={code}
                                codeExtension={codeExtension}
                                fontScale={fontScale}
                                highlightTheme={activeTheme}
                            />
                        ) : null}
                    </CardContent>
                ) : null}
            </Card>
        </TooltipProvider>
    )
}
