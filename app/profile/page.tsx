'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UserProfileEdit } from '@/components/profile/UserProfileEdit'

export default function ProfilePage() {
    return (
        <AuthedGate>
            <ProfilePageShell activeTab="index" titleHidden={false}>
                <UserProfileEdit />
            </ProfilePageShell>
        </AuthedGate>
    )
}
