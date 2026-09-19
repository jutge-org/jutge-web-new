'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UnregistrationForm } from '@/components/profile/UnregistrationForm'

export default function ProfileUnregistrationPage() {
    return (
        <AuthedGate>
            <ProfilePageShell
                activeTab="unregistration"
                subpage={{ title: 'Unregistration', url: '/profile/unregistration' }}
                titleSection="/unregistration"
                titleHidden={false}
            >
                <UnregistrationForm />
            </ProfilePageShell>
        </AuthedGate>
    )
}
