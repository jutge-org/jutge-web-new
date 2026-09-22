'use client'

import { ArrowRightIcon, CheckIcon, MailIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { ChangeEmailConfirmFormFields } from '@/components/profile/ChangeEmailConfirmFormFields'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import AnimatedStepper, { type StepItem } from '@/components/smoothui/animated-stepper'
import AnimatedToggle from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { requestChangeEmailAction } from '@/lib/data/changeEmailActions'
import { RECAPTCHA_CHANGE_EMAIL_ACTION } from '@/lib/recaptcha'

const EMAIL_CHANGE_STEPS: StepItem[] = [
    { label: 'Instructions' },
    { label: 'Request' },
    { label: 'Confirmation' },
]

type ChangeEmailFormFieldsProps = {
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

export function ChangeEmailFormFields({ recaptchaConfigured, executeRecaptcha }: ChangeEmailFormFieldsProps) {
    const { profile } = useAuth()
    const [newEmail, setNewEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmed, setConfirmed] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [step, setStep] = useState(0)
    const [requestedChange, setRequestedChange] = useState<{ oldEmail: string; newEmail: string } | null>(null)

    const currentEmail = profile?.email ?? ''
    const isUpcEmail = currentEmail.toLowerCase().endsWith('upc.edu')
    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)

    const canSubmit = newEmail.trim().length > 0 && password.length > 0 && confirmed && recaptchaReady && !pending

    async function handleSubmit() {
        setErrorMessage(null)

        if (!currentEmail) {
            setErrorMessage('Could not determine your current email.')
            return
        }

        const trimmedNewEmail = newEmail.trim()
        if (!trimmedNewEmail) {
            setErrorMessage('New email is required.')
            return
        }

        if (trimmedNewEmail.toLowerCase() === currentEmail.toLowerCase()) {
            setErrorMessage('New email must differ from your current email.')
            return
        }

        if (!password) {
            setErrorMessage('Password is required.')
            return
        }

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

            const result = await requestChangeEmailAction({
                old_email: currentEmail,
                new_email: trimmedNewEmail,
                password,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            setRequestedChange({ oldEmail: currentEmail, newEmail: trimmedNewEmail })
            setPassword('')
            setStep(2)
        } finally {
            setPending(false)
        }
    }

    function handleStepChange(next: number) {
        if (next === step) return
        if (next > 0 && !confirmed) return
        if (next > 1 && !requestedChange) return
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
                        steps={EMAIL_CHANGE_STEPS}
                        variant="horizontal"
                    />

                    {step === 0 ? (
                        <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                            <div className="hidden sm:block" />
                            <div className="min-w-0 space-y-6">
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <p>
                                        To change your email for Jutge.org, request confirmation codes. One code is sent
                                        to your current address and another to the new address.
                                    </p>
                                    <p>
                                        <span className="font-bold text-foreground">Important:</span> You need access to
                                        both addresses, and you must stay signed in with your current email until you
                                        confirm.
                                    </p>
                                    <p>
                                        <span className="font-bold text-foreground">Warning:</span> Please take into
                                        account that when changing your email, instructors and tutors of the courses you
                                        were enrolled will not be able to track you.
                                    </p>
                                    {isUpcEmail ? (
                                        <p>
                                            <span className="font-bold text-foreground">Warning:</span> If you change
                                            your email and you are enrolled in UPC courses, you will likely have problems
                                            with lab exams or assignment submissions because your instructors will no
                                            longer be able to track you.
                                        </p>
                                    ) : null}
                                </div>

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
                                            ? 'I understand the implications of changing my email.'
                                            : 'Check to confirm you understand implications of changing your email.'}
                                    </p>
                                </div>

                                <SmoothButton
                                    type="button"
                                    color="accent"
                                    variant="candy"
                                    disabled={!confirmed}
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
                                <ProfileFormRow label="Current email" htmlFor="change-email-current">
                                    <Input
                                        id="change-email-current"
                                        type="email"
                                        value={currentEmail}
                                        readOnly
                                        autoComplete="username"
                                        className="w-full"
                                    />
                                </ProfileFormRow>

                                <ProfileFormRow label="New email" htmlFor="change-email-new">
                                    <Input
                                        id="change-email-new"
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="Your new email address"
                                        autoComplete="email"
                                        className="w-full"
                                    />
                                </ProfileFormRow>

                                <ProfileFormRow label="Password" htmlFor="change-email-password">
                                    <Input
                                        id="change-email-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Your current password"
                                        autoComplete="current-password"
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
                                            className="w-full gap-2"
                                            prefix={<MailIcon className="size-4" aria-hidden />}
                                        >
                                            {pending ? 'Sending…' : 'Send confirmation codes'}
                                        </SmoothButton>
                                    </div>
                                </div>
                            </dl>
                        </form>
                    ) : null}

                    {step === 2 && requestedChange ? (
                        <ChangeEmailConfirmFormFields
                            oldEmail={requestedChange.oldEmail}
                            newEmail={requestedChange.newEmail}
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
