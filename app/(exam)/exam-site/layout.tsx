'use client'

import { LiveAppShell } from '@/components/live/LiveAppShell'
import { usePublicPathname } from '@/hooks/usePublicPathname'
import type { ReactNode } from 'react'

export default function ExamSiteLayout({ children }: { children: ReactNode }) {
    const pathname = usePublicPathname()
    if (pathname === '/exam-floating-widget') return children
    return <LiveAppShell>{children}</LiveAppShell>
}
