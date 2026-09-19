'use client'

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { getRecaptchaSiteKey } from '@/lib/recaptcha'

import { PasswordResetFormFields } from './PasswordResetFormFields'

function PasswordResetFormWithRecaptcha() {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return <PasswordResetFormFields recaptchaConfigured executeRecaptcha={executeRecaptcha ?? undefined} />
}

export function PasswordResetForm() {
    const siteKey = getRecaptchaSiteKey()

    if (!siteKey) {
        return (
            <div className="flex flex-1 flex-col">
                <PasswordResetFormFields recaptchaConfigured={false} />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col">
            <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
                <PasswordResetFormWithRecaptcha />
            </GoogleReCaptchaProvider>
        </div>
    )
}
