'use client'

import { ArrowRightIcon, MailIcon } from 'lucide-react'
import { useState } from 'react'

import { PasswordResetConfirmFormFields } from '@/components/password-reset/PasswordResetConfirmFormFields'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import AnimatedStepper, { type StepItem } from '@/components/smoothui/animated-stepper'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { requestPasswordResetAction } from '@/lib/data/passwordResetActions'
import { RECAPTCHA_PASSWORD_RESET_ACTION } from '@/lib/recaptcha'

const PASSWORD_RESET_STEPS: StepItem[] = [{ label: 'Instructions' }, { label: 'Request' }, { label: 'Confirmation' }]

type PasswordResetFormFieldsProps = {
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

export function PasswordResetFormFields({ recaptchaConfigured, executeRecaptcha }: PasswordResetFormFieldsProps) {
    const [email, setEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [step, setStep] = useState(0)
    const [requestedEmail, setRequestedEmail] = useState<string | null>(null)

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)
    const canSubmit = email.trim().length > 0 && recaptchaReady && !pending

    async function handleSubmit() {
        setErrorMessage(null)

        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            setErrorMessage('Email is required.')
            return
        }

        if (!recaptchaConfigured) {
            setErrorMessage('Password reset is not available because reCAPTCHA is not configured.')
            return
        }

        setPending(true)
        try {
            if (!executeRecaptcha) {
                setErrorMessage('Security check is not ready yet. Please try again.')
                return
            }

            const token = await executeRecaptcha(RECAPTCHA_PASSWORD_RESET_ACTION)
            if (!token) {
                setErrorMessage('Security check failed. Please try again.')
                return
            }

            const result = await requestPasswordResetAction({
                email: trimmedEmail,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            setRequestedEmail(trimmedEmail)
            setStep(2)
        } finally {
            setPending(false)
        }
    }

    function handleStepChange(next: number) {
        if (next === step) return
        if (next > 1 && !requestedEmail) return
        setErrorMessage(null)
        setStep(next)
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex justify-center rounded-xl border border-border bg-card shadow-xs">
                <div className="mb-3 w-full max-w-3xl px-6 pt-8 pb-4">
                    <AnimatedStepper
                        allowClickNavigation
                        className="mb-6 px-6 sm:px-10"
                        currentStep={step}
                        onStepChange={handleStepChange}
                        steps={PASSWORD_RESET_STEPS}
                        variant="horizontal"
                    />

                    {step === 0 ? (
                        <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                            <div className="hidden sm:block" />
                            <div className="min-w-0 space-y-6">
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <p>
                                        To reset your password for Jutge.org, request a confirmation code. The code is
                                        sent to the email address of your account.
                                    </p>
                                    <p>
                                        <span className="font-bold text-foreground">Important:</span> You need access to
                                        that inbox. Enter the code and a new password on the confirmation step.
                                    </p>
                                    <p>
                                        If you don&apos;t receive the email, wait a few minutes, check your spam folder,
                                        and confirm that the address is the one registered on Jutge.org.
                                    </p>
                                </div>

                                <SmoothButton
                                    type="button"
                                    color="accent"
                                    variant="candy"
                                    className="w-full gap-2"
                                    prefix={<ArrowRightIcon className="size-4" aria-hidden />}
                                    onClick={() => handleStepChange(1)}
                                >
                                    Continue
                                </SmoothButton>
                            </div>
                        </div>
                    ) : null}

                    {step === 1 ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                if (canSubmit) void handleSubmit()
                            }}
                        >
                            <dl>
                                <ProfileFormRow label="Email" htmlFor="password-reset-email">
                                    <Input
                                        id="password-reset-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Your Jutge.org email"
                                        autoComplete="email"
                                        className="w-full"
                                    />
                                </ProfileFormRow>

                                <div className="grid gap-3 pt-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
                                    <div className="hidden sm:block" />
                                    <div className="mt-4 flex min-w-0 flex-col gap-3">
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
                                            prefix={<MailIcon className="size-4" aria-hidden />}
                                        >
                                            {pending ? 'Sending…' : 'Send confirmation code'}
                                        </SmoothButton>
                                    </div>
                                </div>
                            </dl>
                        </form>
                    ) : null}

                    {step === 2 && requestedEmail ? (
                        <PasswordResetConfirmFormFields
                            email={requestedEmail}
                            recaptchaConfigured={recaptchaConfigured}
                            executeRecaptcha={executeRecaptcha}
                        />
                    ) : null}
                </div>
            </section>
            <div className="mt-auto flex justify-end pt-12">
                <RecaptchaNotice configured={recaptchaConfigured} />
            </div>
        </div>
    )
}
