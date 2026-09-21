import { getCurrentClient } from '@/lib/data/auth'
import type { NewPassword, NewProfile } from '@/lib/jutge_api_client'
import { deleteProfileAvatar, updateProfile, updateProfileAvatar, updateProfilePassword } from '@/lib/data/usersMutations'

type ProfileActionResult = { ok: true } | { ok: false; error: string }

function trimToNull(value: string | null): string | null {
    if (value == null) return null
    const trimmed = value.trim()
    return trimmed ? trimmed : null
}

export async function updateProfileAction(data: NewProfile): Promise<ProfileActionResult> {
    const name = data.name.trim()
    if (!name) {
        return { ok: false, error: 'Name is required.' }
    }

    const countryId = data.country_id?.trim()
    if (!countryId) {
        return { ok: false, error: 'Country is required.' }
    }

    const timezoneId = data.timezone_id?.trim()
    if (!timezoneId) {
        return { ok: false, error: 'Timezone is required.' }
    }

    try {
        const client = await getCurrentClient()
        await updateProfile(client, {
            name,
            nickname: trimToNull(data.nickname),
            affiliation: trimToNull(data.affiliation),
            description: trimToNull(data.description),
            webpage: trimToNull(data.webpage),
            birth_year: data.birth_year,
            country_id: countryId,
            timezone_id: timezoneId,
            compiler_id: data.compiler_id,
            language_id: data.language_id,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update profile.'
        return { ok: false, error: message }
    }
}

export async function updateProfileAvatarAction(file: File): Promise<ProfileActionResult> {
    if (!file || file.size === 0) {
        return { ok: false, error: 'Avatar file is required.' }
    }

    if (file.type !== 'image/png') {
        return { ok: false, error: 'Avatar must be a PNG image.' }
    }

    try {
        const client = await getCurrentClient()
        await updateProfileAvatar(client, file)
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update avatar.'
        return { ok: false, error: message }
    }
}

export async function deleteProfileAvatarAction(): Promise<ProfileActionResult> {
    try {
        const client = await getCurrentClient()
        await deleteProfileAvatar(client)
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to remove avatar.'
        return { ok: false, error: message }
    }
}

export async function updateProfilePasswordAction(data: NewPassword): Promise<ProfileActionResult> {
    if (!data.oldPassword) {
        return { ok: false, error: 'Current password is required.' }
    }

    if (!data.newPassword) {
        return { ok: false, error: 'New password is required.' }
    }

    try {
        const client = await getCurrentClient()
        await updateProfilePassword(client, {
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update password.'
        return { ok: false, error: message }
    }
}
