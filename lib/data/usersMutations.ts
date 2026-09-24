import type { JutgeApiClient, NewPassword, NewProfile } from '@/lib/jutge_api_client'

export async function updateProfile(client: JutgeApiClient, data: NewProfile): Promise<void> {
    await client.student.profile.update(data)
}

export async function updateProfileAvatar(client: JutgeApiClient, file: File): Promise<void> {
    await client.student.profile.updateAvatar(file)
}

export async function deleteProfileAvatar(client: JutgeApiClient): Promise<void> {
    await client.student.profile.updateAvatar(new File([], 'avatar.png', { type: 'image/png' }))
}

export async function updateProfilePassword(client: JutgeApiClient, data: NewPassword): Promise<void> {
    await client.student.profile.updatePassword(data)
}
