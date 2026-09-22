import { getCurrentClient } from '@/lib/data/auth'

export type RequestUnregistrationActionInput = {
    password: string
    recaptcha_token: string
}

export type ConfirmUnregistrationActionInput = {
    email: string
    code: string
    password: string
    recaptcha_token: string
}

export type UnregistrationResult = { ok: true } | { ok: false; error: string }

export async function requestUnregistrationAction(
    data: RequestUnregistrationActionInput,
): Promise<UnregistrationResult> {
    const password = data.password
    const recaptchaToken = data.recaptcha_token.trim()

    if (!password) {
        return { ok: false, error: 'Password is required.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    try {
        const client = await getCurrentClient()
        await client.auth.requestUnregistration({
            password,
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
    const password = data.password
    const recaptchaToken = data.recaptcha_token.trim()

    if (!email) {
        return { ok: false, error: 'Email is required.' }
    }

    if (!code) {
        return { ok: false, error: 'Enter the confirmation code sent to your email.' }
    }

    if (!password) {
        return { ok: false, error: 'Password is required.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    try {
        const client = await getCurrentClient()
        await client.auth.confirmUnregistration({
            email,
            code,
            password,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unregistration failed.'
        return { ok: false, error: message }
    }
}
