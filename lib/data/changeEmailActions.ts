import { getCurrentClient } from '@/lib/data/auth'

export type RequestChangeEmailActionInput = {
    old_email: string
    new_email: string
    password: string
    recaptcha_token: string
}

export type ConfirmChangeEmailActionInput = {
    old_email: string
    new_email: string
    old_email_code: string
    new_email_code: string
    password: string
    recaptcha_token: string
}

export type ChangeEmailResult = { ok: true } | { ok: false; error: string }

function looksLikeEmail(value: string): boolean {
    return value.includes('@') && value.includes('.')
}

function sameEmail(left: string, right: string): boolean {
    return left.trim().toLowerCase() === right.trim().toLowerCase()
}

export async function requestChangeEmailAction(data: RequestChangeEmailActionInput): Promise<ChangeEmailResult> {
    const oldEmail = data.old_email?.trim() ?? ''
    const newEmail = data.new_email?.trim() ?? ''
    const password = data.password ?? ''
    const recaptchaToken = data.recaptcha_token?.trim() ?? ''

    if (!oldEmail) {
        return { ok: false, error: 'Current email is required.' }
    }

    if (!looksLikeEmail(oldEmail)) {
        return { ok: false, error: 'Current email is not valid.' }
    }

    if (!newEmail) {
        return { ok: false, error: 'New email is required.' }
    }

    if (!looksLikeEmail(newEmail)) {
        return { ok: false, error: 'Please enter a valid email address.' }
    }

    if (sameEmail(oldEmail, newEmail)) {
        return { ok: false, error: 'New email must differ from your current email.' }
    }

    if (!password) {
        return { ok: false, error: 'Password is required.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    try {
        const client = await getCurrentClient()
        const profile = await client.student.profile.get()
        if (!sameEmail(profile.email, oldEmail)) {
            return { ok: false, error: 'Current email does not match the signed-in account.' }
        }

        await client.auth.requestChangeEmail({
            old_email: oldEmail,
            new_email: newEmail,
            password,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Email change request failed.'
        return { ok: false, error: message }
    }
}

export async function confirmChangeEmailAction(data: ConfirmChangeEmailActionInput): Promise<ChangeEmailResult> {
    const oldEmail = data.old_email?.trim() ?? ''
    const newEmail = data.new_email?.trim() ?? ''
    const oldEmailCode = data.old_email_code?.trim() ?? ''
    const newEmailCode = data.new_email_code?.trim() ?? ''
    const password = data.password ?? ''
    const recaptchaToken = data.recaptcha_token?.trim() ?? ''

    if (!oldEmail) {
        return { ok: false, error: 'Current email is required.' }
    }

    if (!newEmail) {
        return { ok: false, error: 'New email is required.' }
    }

    if (sameEmail(oldEmail, newEmail)) {
        return { ok: false, error: 'New email must differ from your current email.' }
    }

    if (!oldEmailCode) {
        return { ok: false, error: 'Enter the confirmation code sent to your current email.' }
    }

    if (!newEmailCode) {
        return { ok: false, error: 'Enter the confirmation code sent to your new email.' }
    }

    if (!password) {
        return { ok: false, error: 'Password is required.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    try {
        const client = await getCurrentClient()
        const profile = await client.student.profile.get()
        if (!sameEmail(profile.email, oldEmail)) {
            return {
                ok: false,
                error: 'You must stay signed in with your current email to confirm this change.',
            }
        }

        await client.auth.confirmChangeEmail({
            old_email: oldEmail,
            new_email: newEmail,
            old_email_code: oldEmailCode,
            new_email_code: newEmailCode,
            password,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Email change failed.'
        return { ok: false, error: message }
    }
}
