'use client'

import Link from 'next/link'
import { saveAs } from 'file-saver'
import { AArrowDownIcon, AArrowUpIcon, ClipboardIcon, DownloadIcon, Maximize2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HljsHighlightThemeMenu } from '@/components/submissions/HljsHighlightThemeMenu'
import { FONT_SCALE_STEP, MAX_FONT_SCALE, MIN_FONT_SCALE } from '@/lib/fontScale'
import type { HljsThemeSelection } from '@/lib/hljsThemes'
import { solutionViewHref } from '@/lib/solutions'
type SolutionSourceCodeToolbarProps = {
    pageKey: string
    proglang: string
    code: string
    codeFilename: string
    fontScale: number
    setFontScale: (updater: number | ((prev: number) => number)) => void
    highlightTheme: HljsThemeSelection
    setHighlightTheme: (theme: HljsThemeSelection) => void
    setPreviewTheme: (theme: HljsThemeSelection | null) => void
    /** When set, used instead of the default `/problems/.../view` link. */
    viewHrefOverride?: string
}

export function SolutionSourceCodeToolbar({
    pageKey,
    proglang,
    code,
    codeFilename,
    fontScale,
    setFontScale,
    highlightTheme,
    setHighlightTheme,
    setPreviewTheme,
    viewHrefOverride,
}: SolutionSourceCodeToolbarProps) {
    const viewHref = viewHrefOverride ?? solutionViewHref(pageKey, proglang)

    function copyCode() {
        navigator.clipboard.writeText(code).then(
            () => toast.success('Copied to clipboard'),
            () => toast.error('Failed to copy'),
        )
    }

    function downloadCode() {
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
        saveAs(blob, codeFilename)
    }

    return (
        <div className="flex shrink-0 items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-lg border border-input">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label="Decrease source code font size"
                            disabled={fontScale <= MIN_FONT_SCALE}
                            onClick={() => setFontScale((scale) => Math.max(MIN_FONT_SCALE, scale - FONT_SCALE_STEP))}
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
                            aria-label="Increase source code font size"
                            disabled={fontScale >= MAX_FONT_SCALE}
                            onClick={() => setFontScale((scale) => Math.min(MAX_FONT_SCALE, scale + FONT_SCALE_STEP))}
                            className="rounded-none border-0"
                        >
                            <AArrowUpIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Increase font size</TooltipContent>
                </Tooltip>
            </div>
            <HljsHighlightThemeMenu
                highlightTheme={highlightTheme}
                setHighlightTheme={setHighlightTheme}
                setPreviewTheme={setPreviewTheme}
            />
            <div className="inline-flex overflow-hidden rounded-lg border border-input">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label="Copy source code to clipboard"
                            onClick={copyCode}
                            className="rounded-none border-0 border-r border-input"
                        >
                            <ClipboardIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Copy to clipboard</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label="Download source code"
                            onClick={downloadCode}
                            className="rounded-none border-0 border-r border-input"
                        >
                            <DownloadIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Download source code</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            asChild
                            variant="outline"
                            size="icon-sm"
                            aria-label="Show source code in full screen (opens in new window)"
                            className="rounded-none border-0"
                        >
                            <Link href={viewHref} target="_blank" rel="noopener noreferrer">
                                <Maximize2Icon />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Show in full screen</TooltipContent>
                </Tooltip>
            </div>
        </div>
    )
}
