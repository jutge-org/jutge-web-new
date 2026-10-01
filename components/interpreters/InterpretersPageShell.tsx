'use client'

import { useAuth } from '@/components/AuthProvider'
import { InterpretersNav } from '@/components/interpreters/InterpretersNav'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import type { InterpretersTab } from '@/lib/interpreters'
import type { ReactNode } from 'react'

type InterpretersPageShellProps = {
    activeTab: InterpretersTab
    breadcrumbs: { title: string; url: string }[]
    children: ReactNode
    titleHidden?: boolean
    title?: string
    titleDescription?: string
}

export function InterpretersPageShell({
    activeTab,
    breadcrumbs,
    children,
    titleHidden,
    title,
    titleDescription,
}: InterpretersPageShellProps) {
    const { user } = useAuth()

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={breadcrumbs} />
            <PageTitle
                section="/interpreters"
                authenticated={user !== null}
                title={title}
                description={titleDescription}
                hidden={titleHidden}
            />
            <InterpretersNav activeTab={activeTab} />
            {children}
        </div>
    )
}
