'use client'

import { AppShell } from '@/components/AppShell'
import type { ReactNode } from 'react'

export default function NormalLayout({ children }: { children: ReactNode }) {
    return <AppShell>{children}</AppShell>
}
