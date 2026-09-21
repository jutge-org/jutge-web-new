'use client'

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { ChangeEmailConfirmFormFields } from '@/components/profile/ChangeEmailConfirmFormFields'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'

type ChangeEmailConfirmFormProps = {
    oldEmail: string
    newEmail: string
    code: string
}

function ChangeEmailConfirmFormWithRecaptcha({ oldEmail, newEmail, code }: ChangeEmailConfirmFormProps) {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return (
        <ChangeEmailConfirmFormFields
            oldEmail={oldEmail}
            newEmail={newEmail}
            code={code}
            recaptchaConfigured
            executeRecaptcha={executeRecaptcha ?? undefined}
        />
    )
}

export function ChangeEmailConfirmForm({ oldEmail, newEmail, code }: ChangeEmailConfirmFormProps) {
    const siteKey = getRecaptchaSiteKey()

    if (!siteKey) {
        return (
            <div className="flex flex-1 flex-col">
                <ChangeEmailConfirmFormFields
                    oldEmail={oldEmail}
                    newEmail={newEmail}
                    code={code}
                    recaptchaConfigured={false}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col">
            <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
                <ChangeEmailConfirmFormWithRecaptcha oldEmail={oldEmail} newEmail={newEmail} code={code} />
            </GoogleReCaptchaProvider>
        </div>
    )
}
