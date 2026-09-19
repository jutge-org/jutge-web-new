'use client'

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { getRecaptchaSiteKey } from '@/lib/recaptcha'

import { PasswordResetConfirmFormFields } from './PasswordResetConfirmFormFields'

type PasswordResetConfirmFormProps = {
    email: string
    code: string
}

function PasswordResetConfirmFormWithRecaptcha({ email, code }: PasswordResetConfirmFormProps) {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return (
        <PasswordResetConfirmFormFields
            email={email}
            code={code}
            recaptchaConfigured
            executeRecaptcha={executeRecaptcha ?? undefined}
        />
    )
}

export function PasswordResetConfirmForm({ email, code }: PasswordResetConfirmFormProps) {
    const siteKey = getRecaptchaSiteKey()

    if (!siteKey) {
        return (
            <div className="flex flex-1 flex-col">
                <PasswordResetConfirmFormFields email={email} code={code} recaptchaConfigured={false} />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col">
            <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
                <PasswordResetConfirmFormWithRecaptcha email={email} code={code} />
            </GoogleReCaptchaProvider>
        </div>
    )
}
