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
    /** Exam/contest: hide section nav and show profile as view-only. */
    liveBasic?: boolean
}

export function ProfilePageShell({
    activeTab,
    subpage,
    children,
    titleSection = '/profile',
    titleDescription,
    titleHidden,
    liveBasic = false,
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
                description={
                    titleDescription ??
                    (liveBasic ? 'Your account details for this session.' : undefined)
                }
                hidden={titleHidden}
            />
            {liveBasic ? null : <ProfileNav activeTab={activeTab} />}
            {children}
        </div>
    )
}
