'use client'

import { CheckIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import AnimatedToggle from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { confirmChangeEmailAction } from '@/lib/data/changeEmailActions'
import { queueFlashToast } from '@/lib/flashToast'
import { RECAPTCHA_CHANGE_EMAIL_ACTION } from '@/lib/recaptcha'

type ChangeEmailConfirmFormFieldsProps = {
    oldEmail: string
    newEmail: string
    code: string
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

export function ChangeEmailConfirmFormFields({
    oldEmail,
    newEmail,
    code,
    recaptchaConfigured,
    executeRecaptcha,
}: ChangeEmailConfirmFormFieldsProps) {
    const { logout } = useAuth()
    const [confirmed, setConfirmed] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)
    const canSubmit = confirmed && recaptchaReady && !pending

    async function handleSubmit() {
        setErrorMessage(null)

        if (!confirmed) {
            setErrorMessage('Please confirm that you understand the implications of changing your email.')
            return
        }

        if (!recaptchaConfigured) {
            setErrorMessage('Email change is not available because reCAPTCHA is not configured.')
            return
        }

        setPending(true)
        try {
            if (!executeRecaptcha) {
                setErrorMessage('Security check is not ready yet. Please try again.')
                return
            }

            const token = await executeRecaptcha(RECAPTCHA_CHANGE_EMAIL_ACTION)
            if (!token) {
                setErrorMessage('Security check failed. Please try again.')
                return
            }

            const result = await confirmChangeEmailAction({
                old_email: oldEmail,
                new_email: newEmail,
                code,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            queueFlashToast({
                type: 'success',
                message: 'Your email has been changed. Please sign in with your new email.',
            })
            await logout()
            window.location.assign('/')
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex justify-center rounded-xl border border-border bg-card shadow-xs">
                <form
                    className="mb-3 w-full max-w-3xl"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (canSubmit) void handleSubmit()
                    }}
                >
                    <div className="space-y-2 px-6 pt-8 text-center text-sm text-muted-foreground">
                        <p className="text-base font-medium text-foreground">Confirm email change</p>
                        <p>
                            Confirm changing your account email. After this, all sessions will end and you will need to
                            sign in with your new email address.
                        </p>
                    </div>

                    <dl className="px-6 py-4">
                        <ProfileFormRow label="Current email" htmlFor="change-email-confirm-old">
                            <Input
                                id="change-email-confirm-old"
                                type="email"
                                value={oldEmail}
                                readOnly
                                autoComplete="username"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="New email" htmlFor="change-email-confirm-new">
                            <Input
                                id="change-email-confirm-new"
                                type="email"
                                value={newEmail}
                                readOnly
                                autoComplete="email"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Confirmation" alignStart>
                            <div className="flex items-center gap-3">
                                <AnimatedToggle
                                    checked={confirmed}
                                    onChange={setConfirmed}
                                    size="lg"
                                    variant="icon"
                                    label="Confirm that you understand the implications of changing your email"
                                    icons={{
                                        on: <CheckIcon aria-hidden />,
                                        off: <XIcon aria-hidden />,
                                    }}
                                />
                                <p className="text-sm leading-snug text-foreground">
                                    {confirmed
                                        ? 'I confirm that I want to change my email.'
                                        : 'Check to confirm.'}
                                </p>
                            </div>
                        </ProfileFormRow>
                    </dl>

                    <div className="grid gap-4 px-6 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <div className="hidden sm:block" />
                        <div className="flex flex-col gap-3">
                            {errorMessage ? (
                                <p role="alert" className="text-sm text-destructive">
                                    {errorMessage}
                                </p>
                            ) : null}
                            <SmoothButton
                                type="submit"
                                color="accent"
                                variant="candy"
                                disabled={!canSubmit}
                                loading={pending}
                                className="w-full gap-2"
                            >
                                {pending ? 'Changing email…' : 'Change email'}
                            </SmoothButton>
                        </div>
                    </div>
                </form>
            </section>
            <div className="mt-auto flex justify-end pt-12">
                <RecaptchaNotice configured={recaptchaConfigured} />
            </div>
        </div>
    )
}
