'use client'

import { LayoutWidthContainer } from '@/components/layout/LayoutWidthContainer'
import { isFullscreenSubmissionEditorPath } from '@/lib/submissions'
import { isBlackScreenPath, isUtilityEditorViewPath } from '@/lib/utilities'
import { useClockFullscreen } from '@/store/clockFullscreen'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

type RootShellProps = {
    children: ReactNode
    header: ReactNode
    footer: ReactNode
}

export function RootShell({ children, header, footer }: RootShellProps) {
    const pathname = usePathname() ?? ''
    const clockFullscreen = useClockFullscreen((state) => state.active)

    if (isFullscreenSubmissionEditorPath(pathname) || isBlackScreenPath(pathname) || isUtilityEditorViewPath(pathname)) {
        return children
    }

    const hideClockChrome = clockFullscreen && pathname === '/utilities/clock'

    return (
        <>
            {hideClockChrome ? null : header}
            <LayoutWidthContainer as="main" id="main-content" className="flex-1 flex flex-col px-4 pt-4 pb-8 sm:px-6">
                {children}
            </LayoutWidthContainer>
            {hideClockChrome ? null : footer}
        </>
    )
}
