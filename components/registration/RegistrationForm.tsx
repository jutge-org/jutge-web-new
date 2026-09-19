'use client'

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { PageSpinner } from '@/components/ClientGates'
import { getRecaptchaSiteKey } from '@/lib/recaptcha'
import type { Country } from '@/lib/jutge_api_client'

import { RegistrationFormFields } from './RegistrationFormFields'

type RegistrationFormProps = {
    countries: Country[] | null
    initialEmail?: string
}

function CountriesUnavailableMessage() {
    return <p className="text-muted-foreground">Could not load sign up form. Please try again later.</p>
}

function RegistrationFormBody({ countries, initialEmail, recaptchaConfigured, executeRecaptcha }: RegistrationFormProps & {
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}) {
    if (countries === null) {
        return <PageSpinner />
    }

    if (countries.length === 0) {
        return <CountriesUnavailableMessage />
    }

    return (
        <RegistrationFormFields
            countries={countries}
            initialEmail={initialEmail}
            recaptchaConfigured={recaptchaConfigured}
            executeRecaptcha={executeRecaptcha}
        />
    )
}

function RegistrationFormWithRecaptcha({ countries, initialEmail }: RegistrationFormProps) {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return (
        <RegistrationFormBody
            countries={countries}
            initialEmail={initialEmail}
            recaptchaConfigured
            executeRecaptcha={executeRecaptcha ?? undefined}
        />
    )
}

export function RegistrationForm({ countries, initialEmail }: RegistrationFormProps) {
    const siteKey = getRecaptchaSiteKey()

    return (
        <div className="flex flex-1 flex-col">
            {!siteKey ? (
                <RegistrationFormBody countries={countries} initialEmail={initialEmail} recaptchaConfigured={false} />
            ) : (
                <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
                    <RegistrationFormWithRecaptcha countries={countries} initialEmail={initialEmail} />
                </GoogleReCaptchaProvider>
            )}
        </div>
    )
}
