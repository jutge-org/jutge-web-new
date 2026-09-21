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
    code: string
    recaptcha_token: string
}

export type ChangeEmailResult = { ok: true } | { ok: false; error: string }

function getHostname(): string {
    if (typeof window === 'undefined') {
        return ''
    }
    return window.location.hostname
}

function looksLikeEmail(value: string): boolean {
    return value.includes('@') && value.includes('.')
}

function decodeBase64Url(value: string): string {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}

export async function requestChangeEmailAction(
    data: RequestChangeEmailActionInput,
): Promise<ChangeEmailResult> {
    const oldEmail = data.old_email?.trim() ?? ''
    const newEmail = data.new_email?.trim() ?? ''
    const password = data.password ?? ''
    const recaptchaToken = data.recaptcha_token?.trim() ?? ''
    const hostname = getHostname()

    if (!oldEmail) {
        return { ok: false, error: 'Current email is required.' }
    }

    if (!newEmail) {
        return { ok: false, error: 'New email is required.' }
    }

    if (!looksLikeEmail(newEmail)) {
        return { ok: false, error: 'Please enter a valid email address.' }
    }

    if (!password) {
        return { ok: false, error: 'Password is required.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    if (!hostname) {
        return { ok: false, error: 'Could not determine the current site hostname.' }
    }

    try {
        const client = await getCurrentClient()
        await client.auth.requestChangeEmail({
            old_email: oldEmail,
            new_email: newEmail,
            password,
            hostname,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Email change request failed.'
        return { ok: false, error: message }
    }
}

export async function confirmChangeEmailAction(
    data: ConfirmChangeEmailActionInput,
): Promise<ChangeEmailResult> {
    const oldEmail = data.old_email?.trim() ?? ''
    const newEmail = data.new_email?.trim() ?? ''
    const code = data.code?.trim() ?? ''
    const recaptchaToken = data.recaptcha_token?.trim() ?? ''

    if (!oldEmail) {
        return { ok: false, error: 'Current email is required.' }
    }

    if (!newEmail) {
        return { ok: false, error: 'New email is required.' }
    }

    if (!code) {
        return { ok: false, error: 'Invalid or expired email change link.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    try {
        const client = await getCurrentClient()
        await client.auth.confirmChangeEmail({
            old_email: oldEmail,
            new_email: newEmail,
            code,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Email change failed.'
        return { ok: false, error: message }
    }
}

function decodeToken(token: string): string {
    let value = token.trim()
    for (let i = 0; i < 2 && value.includes('%'); i += 1) {
        try {
            const decoded = decodeURIComponent(value)
            if (decoded === value) break
            value = decoded
        } catch {
            break
        }
    }
    return value
}

/**
 * Decode `base64url(oldEmail):base64url(newEmail):code` from the email change link path segment.
 * Colons may arrive percent-encoded as `%3A`.
 */
export function parseChangeEmailToken(
    token: string,
): { old_email: string; new_email: string; code: string } | null {
    const parts = decodeToken(token).split(':')
    if (parts.length !== 3) {
        return null
    }

    const [encodedOldEmail, encodedNewEmail, code] = parts
    if (!encodedOldEmail || !encodedNewEmail || !code) {
        return null
    }

    try {
        const old_email = decodeBase64Url(encodedOldEmail).trim()
        const new_email = decodeBase64Url(encodedNewEmail).trim()
        if (!looksLikeEmail(old_email) || !looksLikeEmail(new_email)) {
            return null
        }
        return { old_email, new_email, code }
    } catch {
        return null
    }
}
