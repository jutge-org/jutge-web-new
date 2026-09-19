import { getCurrentClient } from '@/lib/data/auth'
import { parsePasswordResetToken } from '@/lib/data/passwordResetActions'

export type RequestUnregistrationActionInput = {
    password: string
    recaptcha_token: string
}

export type ConfirmUnregistrationActionInput = {
    email: string
    code: string
    recaptcha_token: string
}

export type UnregistrationResult = { ok: true } | { ok: false; error: string }

function getHostname(): string {
    if (typeof window === 'undefined') {
        return ''
    }
    return window.location.hostname
}

export async function requestUnregistrationAction(
    data: RequestUnregistrationActionInput,
): Promise<UnregistrationResult> {
    const password = data.password
    const recaptchaToken = data.recaptcha_token.trim()
    const hostname = getHostname()

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
        await client.auth.requestUnregistration({
            password,
            hostname,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unregistration request failed.'
        return { ok: false, error: message }
    }
}

export async function confirmUnregistrationAction(
    data: ConfirmUnregistrationActionInput,
): Promise<UnregistrationResult> {
    const email = data.email.trim()
    const code = data.code.trim()
    const recaptchaToken = data.recaptcha_token.trim()

    if (!email) {
        return { ok: false, error: 'Email is required.' }
    }

    if (!code) {
        return { ok: false, error: 'Invalid or expired unregistration link.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    try {
        const client = await getCurrentClient()
        await client.auth.confirmUnregistration({
            email,
            code,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unregistration failed.'
        return { ok: false, error: message }
    }
}

/** Decode `base64url(email):code` from the unregistration email link path segment. */
export function parseUnregistrationToken(token: string): { email: string; code: string } | null {
    return parsePasswordResetToken(token)
}
