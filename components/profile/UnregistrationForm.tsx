'use client'

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { UnregistrationView } from '@/components/profile/UnregistrationView'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'

function UnregistrationFormWithRecaptcha() {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return <UnregistrationView recaptchaConfigured executeRecaptcha={executeRecaptcha ?? undefined} />
}

export function UnregistrationForm() {
    const siteKey = getRecaptchaSiteKey()

    if (!siteKey) {
        return (
            <div className="flex flex-1 flex-col">
                <UnregistrationView recaptchaConfigured={false} />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col">
            <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
                <UnregistrationFormWithRecaptcha />
            </GoogleReCaptchaProvider>
        </div>
    )
}
