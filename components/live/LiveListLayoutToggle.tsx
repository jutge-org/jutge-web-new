'use client'

import { LayoutGridIcon, TableIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { LiveExamListLayout } from '@/lib/liveExamListLayout'

type LiveListLayoutToggleProps = {
    layout: LiveExamListLayout
    onToggle: () => void
}

export function LiveListLayoutToggle({ layout, onToggle }: LiveListLayoutToggleProps) {
    const layoutToggleLabel = layout === 'cards' ? 'Show table' : 'Show cards'

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={layoutToggleLabel}
                        onClick={onToggle}
                    >
                        {layout === 'cards' ? (
                            <TableIcon className="size-4" aria-hidden />
                        ) : (
                            <LayoutGridIcon className="size-4" aria-hidden />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">{layoutToggleLabel}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}