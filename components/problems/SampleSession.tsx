'use client'

import { useState } from 'react'
import { AArrowDownIcon, AArrowUpIcon } from 'lucide-react'

import { HighlightedSourceCode } from '@/components/submissions/HighlightedSourceCode'
import { HljsHighlightThemeMenu } from '@/components/submissions/HljsHighlightThemeMenu'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFontScalePreference } from '@/hooks/use-font-scale-preference'
import { useHljsThemePreference } from '@/hooks/use-hljs-theme-preference'
import { FONT_SCALE_STEP, MAX_FONT_SCALE, MIN_FONT_SCALE, SOURCE_CODE_FONT_SCALE_KEY } from '@/lib/fontScale'
import type { HljsThemeSelection } from '@/lib/hljsThemes'

type SampleSessionProps = {
    session: string
}

export function SampleSession({ session }: SampleSessionProps) {
    const [fontScale, setFontScale] = useFontScalePreference(SOURCE_CODE_FONT_SCALE_KEY)
    const [highlightTheme, setHighlightTheme] = useHljsThemePreference()
    const [previewTheme, setPreviewTheme] = useState<HljsThemeSelection | null>(null)
    const activeTheme = previewTheme ?? highlightTheme

    return (
        <TooltipProvider>
            <Card className="gap-0 overflow-hidden pt-0 ring-0 border border-border shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle>Sample session</CardTitle>
                    <CardAction>
                        <div className="inline-flex items-center gap-2">
                            <div className="inline-flex overflow-hidden rounded-lg border border-input">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            aria-label="Decrease sample session font size"
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
                                            aria-label="Increase sample session font size"
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
                            <HljsHighlightThemeMenu
                                highlightTheme={highlightTheme}
                                setHighlightTheme={setHighlightTheme}
                                setPreviewTheme={setPreviewTheme}
                            />
                        </div>
                    </CardAction>
                </CardHeader>
                <CardContent className="p-0">
                    <HighlightedSourceCode
                        code={session}
                        codeExtension="py"
                        fontScale={fontScale}
                        highlightTheme={activeTheme}
                    />
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}
