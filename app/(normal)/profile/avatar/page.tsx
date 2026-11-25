'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UserProfileAvatar } from '@/components/profile/UserProfileAvatar'

export default function ProfileAvatarPage() {
    return (
        <AuthedGate>
            <ProfilePageShell
                activeTab="avatar"
                subpage={{ title: 'Avatar', url: '/profile/avatar' }}
                titleSection="/avatar"
                titleHidden={false}
            >
                <UserProfileAvatar />
            </ProfilePageShell>
        </AuthedGate>
    )
}
