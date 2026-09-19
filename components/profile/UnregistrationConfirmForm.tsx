'use client'

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { UnregistrationConfirmFormFields } from '@/components/profile/UnregistrationConfirmFormFields'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'

type UnregistrationConfirmFormProps = {
    email: string
    code: string
}

function UnregistrationConfirmFormWithRecaptcha({ email, code }: UnregistrationConfirmFormProps) {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return (
        <UnregistrationConfirmFormFields
            email={email}
            code={code}
            recaptchaConfigured
            executeRecaptcha={executeRecaptcha ?? undefined}
        />
    )
}

export function UnregistrationConfirmForm({ email, code }: UnregistrationConfirmFormProps) {
    const siteKey = getRecaptchaSiteKey()

    if (!siteKey) {
        return (
            <div className="flex flex-1 flex-col">
                <UnregistrationConfirmFormFields email={email} code={code} recaptchaConfigured={false} />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col">
            <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
                <UnregistrationConfirmFormWithRecaptcha email={email} code={code} />
            </GoogleReCaptchaProvider>
        </div>
    )
}
