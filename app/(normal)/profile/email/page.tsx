'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ChangeEmailForm } from '@/components/profile/ChangeEmailForm'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'

export default function ProfileEmailPage() {
    return (
        <AuthedGate>
            <ProfilePageShell
                activeTab="email"
                subpage={{ title: 'Change email', url: '/profile/email' }}
                titleSection="/change-email"
                titleHidden={false}
            >
                <ChangeEmailForm />
            </ProfilePageShell>
        </AuthedGate>
    )
}
