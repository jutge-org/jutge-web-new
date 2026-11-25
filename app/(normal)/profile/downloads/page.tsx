'use client'

import { AuthedGate } from '@/components/ClientGates'
import { DownloadsView } from '@/components/profile/DownloadsView'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'

export default function ProfileDownloadsPage() {
    return (
        <AuthedGate>
            <ProfilePageShell
                activeTab="downloads"
                subpage={{ title: 'Downloads', url: '/profile/downloads' }}
                titleSection="/downloads"
                titleHidden={false}
            >
                <DownloadsView />
            </ProfilePageShell>
        </AuthedGate>
    )
}
