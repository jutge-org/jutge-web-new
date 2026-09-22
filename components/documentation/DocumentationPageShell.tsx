'use client'

import { useAuth } from '@/components/AuthProvider'
import { DocumentationNav } from '@/components/documentation/DocumentationNav'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import type { DocumentationTab } from '@/lib/documentation'
import type { ReactNode } from 'react'

type DocumentationPageShellProps = {
    activeTab: DocumentationTab
    breadcrumbs: { title: string; url: string }[]
    children: ReactNode
    titleHidden?: boolean
    title?: string
    titleDescription?: string
}

export function DocumentationPageShell({
    activeTab,
    breadcrumbs,
    children,
    titleHidden,
    title,
    titleDescription,
}: DocumentationPageShellProps) {
    const { user } = useAuth()

    return (
        <div className="flex flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={breadcrumbs} />
            <PageTitle
                section="/documentation"
                authenticated={user !== null}
                title={title}
                description={titleDescription}
                hidden={titleHidden}
            />
            <DocumentationNav activeTab={activeTab} />
            {children}
        </div>
    )
}
