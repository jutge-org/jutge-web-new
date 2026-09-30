'use client'

import { useAuth } from '@/components/AuthProvider'
import { AboutNav } from '@/components/about/AboutNav'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import type { AboutTab } from '@/lib/about'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type AboutPageShellProps = {
    activeTab: AboutTab
    breadcrumbs: { title: string; url: string }[]
    children: ReactNode
    className?: string
}

export function AboutPageShell({ activeTab, breadcrumbs, children, className }: AboutPageShellProps) {
    const { user } = useAuth()

    return (
        <div className={cn('flex flex-col gap-6', className)}>
            <MainBreadcrumbs breadcrumbs={breadcrumbs} />
            <PageTitle section="/about" authenticated={user !== null} />
            <AboutNav activeTab={activeTab} />
            {children}
        </div>
    )
}
