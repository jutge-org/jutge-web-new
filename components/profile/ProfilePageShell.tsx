import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle, type PageTitleSection } from '@/components/general/PageTitle'
import { ProfileNav } from '@/components/profile/ProfileNav'
import type { ProfileTab } from '@/lib/profile'
import type { ReactNode } from 'react'

type ProfilePageShellProps = {
    activeTab: ProfileTab
    subpage?: { title: string; url: string } | null
    children: ReactNode
    titleSection?: PageTitleSection
    titleDescription?: string
    titleHidden?: boolean
}

export function ProfilePageShell({
    activeTab,
    subpage,
    children,
    titleSection = '/profile',
    titleDescription,
    titleHidden,
}: ProfilePageShellProps) {
    const breadcrumbs = subpage
        ? [
              { title: 'Profile', url: '/profile' },
              { title: subpage.title, url: subpage.url },
          ]
        : [{ title: 'Profile', url: '/profile' }]

    return (
        <div className="flex flex-1 flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={breadcrumbs} />
            <PageTitle
                section={titleSection}
                authenticated
                description={titleDescription}
                hidden={titleHidden}
            />
            <ProfileNav activeTab={activeTab} />
            {children}
        </div>
    )
}
