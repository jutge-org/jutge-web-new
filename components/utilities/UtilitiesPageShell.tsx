'use client'

import { useAuth } from '@/components/AuthProvider'
import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { UtilitiesNav } from '@/components/utilities/UtilitiesNav'
import type { UtilitiesTab } from '@/lib/utilities'
import type { ReactNode } from 'react'

type UtilitiesPageShellProps = {
    activeTab: UtilitiesTab
    breadcrumbs: { title: string; url: string }[]
    children: ReactNode
    titleHidden?: boolean
    title?: string
    titleDescription?: string
}

export function UtilitiesPageShell({
    activeTab,
    breadcrumbs,
    children,
    titleHidden,
    title,
    titleDescription,
}: UtilitiesPageShellProps) {
    const { user } = useAuth()

    return (
        <AuthedGate>
            <div className="flex flex-col gap-6">
                <MainBreadcrumbs breadcrumbs={breadcrumbs} />
                <PageTitle
                    section="/utilities"
                    authenticated={user !== null}
                    title={title}
                    description={titleDescription}
                    hidden={titleHidden}
                />
                <UtilitiesNav activeTab={activeTab} />
                {children}
            </div>
        </AuthedGate>
    )
}
