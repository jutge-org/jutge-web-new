'use client'

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { ChangeEmailFormFields } from '@/components/profile/ChangeEmailFormFields'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'

function ChangeEmailFormWithRecaptcha() {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return <ChangeEmailFormFields recaptchaConfigured executeRecaptcha={executeRecaptcha ?? undefined} />
}

export function ChangeEmailForm() {
    const siteKey = getRecaptchaSiteKey()

    if (!siteKey) {
        return (
            <div className="flex flex-1 flex-col">
                <ChangeEmailFormFields recaptchaConfigured={false} />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col">
            <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
                <ChangeEmailFormWithRecaptcha />
            </GoogleReCaptchaProvider>
        </div>
    )
}
