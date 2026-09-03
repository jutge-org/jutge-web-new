'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'

export default function ProfileEmailPage() {
    return (
        <AuthedGate>
            <ProfilePageShell activeTab="email" subpage={{ title: 'Change email', url: '/profile/email' }}>
                <p className="text-muted-foreground">Change email is not implemented yet.</p>
            </ProfilePageShell>
        </AuthedGate>
    )
}
