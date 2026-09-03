'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UserProfilePasswordForm } from '@/components/profile/UserProfilePasswordForm'

export default function ProfilePasswordPage() {
    return (
        <AuthedGate>
            <ProfilePageShell
                activeTab="password"
                subpage={{ title: 'Change password', url: '/profile/password' }}
            >
                <UserProfilePasswordForm />
            </ProfilePageShell>
        </AuthedGate>
    )
}
