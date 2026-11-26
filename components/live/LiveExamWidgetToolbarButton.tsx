'use client'

import { headerToolbarIconButtonClassName } from '@/components/layout/headerToolbarClasses'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSiteMode } from '@/components/SiteModeProvider'
import { liveSessionMayUseExamFloatingWidget } from '@/lib/examFloatingWidget'
import { openExamFloatingWidget } from '@/lib/openExamFloatingWidget'
import { PictureInPicture2Icon } from 'lucide-react'

export function LiveExamWidgetToolbarButton() {
    const site = useSiteMode()
    const session = useLiveSession()
    const label = site.kind === 'contest' ? 'Contest floating widget' : 'Exam floating widget'

    if (!session.authenticated) return null
    if (!liveSessionMayUseExamFloatingWidget(session.role, session.controllerEntry)) return null

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <SmoothButton
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className={headerToolbarIconButtonClassName}
                        aria-label={label}
                        onClick={() => {
                            void openExamFloatingWidget()
                        }}
                    >
                        <PictureInPicture2Icon aria-hidden />
                    </SmoothButton>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}