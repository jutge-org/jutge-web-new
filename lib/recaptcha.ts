export const RECAPTCHA_REGISTRATION_ACTION = 'registration'
export const RECAPTCHA_PASSWORD_RESET_ACTION = 'password_reset'
export const RECAPTCHA_UNREGISTRATION_ACTION = 'unregistration'

export function getRecaptchaSiteKey(): string | null {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim()
    return siteKey || null
}
