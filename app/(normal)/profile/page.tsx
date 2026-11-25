'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UserProfileBasicView } from '@/components/profile/UserProfileBasicView'
import { UserProfileEdit } from '@/components/profile/UserProfileEdit'
import { useSiteMode } from '@/components/SiteModeProvider'
import { isLiveKind } from '@/lib/siteMode'

export default function ProfilePage() {
    const site = useSiteMode()
    const liveBasic = isLiveKind(site.kind)

    return (
        <AuthedGate>
            <ProfilePageShell activeTab="index" titleHidden={false} liveBasic={liveBasic}>
                {liveBasic ? <UserProfileBasicView /> : <UserProfileEdit />}
            </ProfilePageShell>
        </AuthedGate>
    )
}