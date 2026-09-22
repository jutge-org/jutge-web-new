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

export async function requestPasswordResetAction(data: PasswordResetActionInput): Promise<PasswordResetResult> {
    const email = data.email.trim()
    const recaptchaToken = data.recaptcha_token.trim()

    if (!email) {
        return { ok: false, error: 'Email is required.' }
    }

    if (!recaptchaToken) {
        return { ok: false, error: 'Security check failed. Please try again.' }
    }

    try {
        await jutge.auth.requestPasswordReset({
            email,
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
        return { ok: false, error: 'Confirmation code is required.' }
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
