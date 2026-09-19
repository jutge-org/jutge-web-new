import jutge from '@/lib/jutge'

export type PasswordResetActionInput = {
    email: string
    recaptcha_token: string
}

export type ConfirmPasswordResetActionInput = {
    email: string
    code: string
    password: string
    confirmPassword: string
    recaptcha_token: string
}

export type PasswordResetResult = { ok: true } | { ok: false; error: string }

export type ConfirmPasswordResetResult = { ok: true } | { ok: false; error: string }

function isStrongPassword(password: string): boolean {
    if (password.length < 12) return false
    if (!/[A-Z]/.test(password)) return false
    if (!/[a-z]/.test(password)) return false
    if (!/\d/.test(password)) return false
    if (!/[^A-Za-z0-9]/.test(password)) return false
    return true
}

function getHostname(): string {
    if (typeof window === 'undefined') {
        return ''
    }
    return window.location.hostname
}

export async function requestPasswordResetAction(data: PasswordResetActionInput): Promise<PasswordResetResult> {
    const email = data.email.trim()
    const recaptchaToken = data.recaptcha_token.trim()
    const hostname = getHostname()

    if (!email) {
        return { ok: false, error: 'Email is required.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    if (!hostname) {
        return { ok: false, error: 'Could not determine the current site hostname.' }
    }

    try {
        await jutge.auth.requestPasswordReset({
            email,
            hostname,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Password reset request failed.'
        return { ok: false, error: message }
    }
}

export async function confirmPasswordResetAction(
    data: ConfirmPasswordResetActionInput,
): Promise<ConfirmPasswordResetResult> {
    const email = data.email.trim()
    const code = data.code.trim()
    const recaptchaToken = data.recaptcha_token.trim()

    if (!email) {
        return { ok: false, error: 'Email is required.' }
    }

    if (!code) {
        return { ok: false, error: 'Invalid or expired reset link.' }
    }

    if (!isStrongPassword(data.password)) {
        return { ok: false, error: 'Password does not meet the strength requirements.' }
    }

    if (data.password !== data.confirmPassword) {
        return { ok: false, error: 'Passwords do not match.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    try {
        await jutge.auth.confirmPasswordRequest({
            email,
            code,
            password: data.password,
            recaptcha_token: recaptchaToken,
        })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Password reset failed.'
        return { ok: false, error: message }
    }
}

/** Decode `base64url(email):code` from the email reset link path segment. */
export function parsePasswordResetToken(token: string): { email: string; code: string } | null {
    const separator = token.indexOf(':')
    if (separator <= 0 || separator === token.length - 1) {
        return null
    }

    const encodedEmail = token.slice(0, separator)
    const code = token.slice(separator + 1)
    if (!encodedEmail || !code) {
        return null
    }

    try {
        const email = decodeBase64Url(encodedEmail).trim()
        if (!email.includes('@')) {
            return null
        }
        return { email, code }
    } catch {
        return null
    }
}

function decodeBase64Url(value: string): string {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return new TextDecoder().decode(bytes)
}
