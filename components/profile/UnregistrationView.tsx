'use client'

import { ArrowRightIcon, CheckIcon, MailIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { UnregistrationConfirmFormFields } from '@/components/profile/UnregistrationConfirmFormFields'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import AnimatedStepper, { type StepItem } from '@/components/smoothui/animated-stepper'
import AnimatedToggle from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { requestUnregistrationAction } from '@/lib/data/unregistrationActions'
import { RECAPTCHA_UNREGISTRATION_ACTION } from '@/lib/recaptcha'

const UNREGISTRATION_STEPS: StepItem[] = [{ label: 'Instructions' }, { label: 'Request' }, { label: 'Confirmation' }]

type UnregistrationViewProps = {
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

export function UnregistrationView({ recaptchaConfigured, executeRecaptcha }: UnregistrationViewProps) {
    const { profile } = useAuth()
    const [password, setPassword] = useState('')
    const [confirmed, setConfirmed] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [step, setStep] = useState(0)
    const [requestedEmail, setRequestedEmail] = useState<string | null>(null)

    const currentEmail = profile?.email ?? ''
    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)
    const canSubmit = password.length > 0 && confirmed && recaptchaReady && !pending

    async function handleSubmit() {
        setErrorMessage(null)

        if (!currentEmail) {
            setErrorMessage('Could not determine your current email.')
            return
        }

        if (!confirmed) {
            setErrorMessage('Please confirm that you understand this action is irreversible.')
            return
        }

        if (!password) {
            setErrorMessage('Password is required.')
            return
        }

        if (!recaptchaConfigured) {
            setErrorMessage('Unregistration is not available because reCAPTCHA is not configured.')
            return
        }

        setPending(true)
        try {
            if (!executeRecaptcha) {
                setErrorMessage('Security check is not ready yet. Please try again.')
                return
            }

            const token = await executeRecaptcha(RECAPTCHA_UNREGISTRATION_ACTION)
            if (!token) {
                setErrorMessage('Security check failed. Please try again.')
                return
            }

            const result = await requestUnregistrationAction({
                password,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            setRequestedEmail(currentEmail)
            setPassword('')
            setStep(2)
        } finally {
            setPending(false)
        }
    }

    function handleStepChange(next: number) {
        if (next === step) return
        if (next > 0 && !confirmed) return
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
                        steps={UNREGISTRATION_STEPS}
                        variant="horizontal"
                    />

                    {step === 0 ? (
                        <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                            <div className="hidden sm:block" />
                            <div className="min-w-0 space-y-6">
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    <p>Follow the instructions below to unregister your account and clear all your data from Jutge.org.</p>
                                    <p>Take into account that once you unregister...</p>
                                    <ul className="space-y-2 text-foreground">
                                        <li>⚡ You will not be able to access your account anymore.</li>
                                        <li>⚡ You will not be able to access your submitted solutions anymore.</li>
                                        <li>⚡ You will not be able to view the verdicts of your submissions.</li>
                                        <li>⚡ You will be unenrolled from all the courses you were invited.</li>
                                        <li>
                                            ⚡ Instructors and tutors of the courses you were enrolled will not be able
                                            to see your status.
                                        </li>
                                        <li>⚡ You will lose all awards.</li>
                                        <li>
                                            💀 In brief: All the information in your Jutge.org account will be lost and
                                            cannot be recovered.
                                        </li>
                                        <li>
                                            💀 💀 Repeat: All the information in your Jutge.org account will be lost and
                                            cannot be recovered.
                                        </li>
                                        <li>
                                            💬 Suggestion: Before unregistering, we suggest that you download all your
                                            programs and save them in a safe place.
                                        </li>
                                    </ul>
                                    <p>
                                        To continue, confirm that you understand this action is irreversible. A
                                        confirmation code will be sent to your email address.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <AnimatedToggle
                                        checked={confirmed}
                                        onChange={setConfirmed}
                                        size="lg"
                                        variant="icon"
                                        label="Confirm that unregistration is permanent"
                                        icons={{
                                            on: <CheckIcon aria-hidden />,
                                            off: <XIcon aria-hidden />,
                                        }}
                                    />
                                    <p className="text-sm leading-snug text-foreground">
                                        {confirmed
                                            ? 'I confirm unregistration cannot be undone.'
                                            : 'Check to confirm unregistration is permanent.'}
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
                            <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                                <div className="hidden sm:block" />
                                <p className="min-w-0 text-sm text-muted-foreground">
                                    Enter your password. We will email a confirmation code to your address.
                                </p>
                            </div>

                            <dl>
                                <ProfileFormRow label="Email" htmlFor="unregistration-email">
                                    <Input
                                        id="unregistration-email"
                                        type="email"
                                        value={currentEmail}
                                        readOnly
                                        autoComplete="username"
                                        className="w-full"
                                    />
                                </ProfileFormRow>

                                <ProfileFormRow label="Password" htmlFor="unregistration-password">
                                    <Input
                                        id="unregistration-password"
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
                        <UnregistrationConfirmFormFields
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
