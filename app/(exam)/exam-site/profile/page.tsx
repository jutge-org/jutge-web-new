'use client'

import { AuthedGate } from '@/components/ClientGates'
import { ProfilePageShell } from '@/components/profile/ProfilePageShell'
import { UserProfileBasicView } from '@/components/profile/UserProfileBasicView'

export default function ExamProfilePage() {
    return (
        <AuthedGate>
            <ProfilePageShell activeTab="index" titleHidden={false} liveBasic>
                <UserProfileBasicView />
            </ProfilePageShell>
        </AuthedGate>
    )
}
