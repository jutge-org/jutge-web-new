import jutge from '@/lib/jutge'

export type RegisterActionInput = {
    name: string
    email: string
    birth_year: number
    parent_email: string | null
    country_id: string
    recaptcha_token: string
    password: string
    confirmPassword: string
}

type RegisterActionResult = { ok: true; email: string } | { ok: false; error: string }

function isStrongPassword(password: string): boolean {
    if (password.length < 12) return false
    if (!/[A-Z]/.test(password)) return false
    if (!/[a-z]/.test(password)) return false
    if (!/\d/.test(password)) return false
    if (!/[^A-Za-z0-9]/.test(password)) return false
    return true
}

export async function registerAction(data: RegisterActionInput): Promise<RegisterActionResult> {
    const name = data.name.trim()
    const email = data.email.trim()
    const countryId = data.country_id.trim()
    const parentEmail = data.parent_email?.trim() ?? ''
    const recaptchaToken = data.recaptcha_token.trim()

    if (!name) {
        return { ok: false, error: 'Complete name is required.' }
    }

    if (!email) {
        return { ok: false, error: 'Email is required.' }
    }

    if (!Number.isInteger(data.birth_year) || data.birth_year < 1900 || data.birth_year > new Date().getFullYear()) {
        return { ok: false, error: 'Birth year must be a valid year.' }
    }

    if (!countryId) {
        return { ok: false, error: 'Country is required.' }
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
        await jutge.auth.register({
            name,
            email,
            birth_year: data.birth_year,
            parent_email: parentEmail || null,
            country_id: countryId,
            policies_agreement: true,
            recaptcha_token: recaptchaToken,
            password: data.password,
        })
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Registration failed.'
        return { ok: false, error: message }
    }

    return { ok: true, email }
}
