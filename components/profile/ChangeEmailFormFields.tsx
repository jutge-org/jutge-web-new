'use client'

import { CheckIcon, HomeIcon, MailIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import AnimatedToggle from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { requestChangeEmailAction } from '@/lib/data/changeEmailActions'
import { RECAPTCHA_CHANGE_EMAIL_ACTION } from '@/lib/recaptcha'

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
    const [sentEmail, setSentEmail] = useState<string | null>(null)

    const currentEmail = profile?.email ?? ''
    const isUpcEmail = currentEmail.toLowerCase().endsWith('upc.edu')
    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)

    const canSubmit =
        newEmail.trim().length > 0 &&
        password.length > 0 &&
        confirmed &&
        recaptchaReady &&
        !pending &&
        !sentEmail

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

            setSentEmail(currentEmail)
            setPassword('')
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex justify-center rounded-xl border border-border bg-card shadow-xs">
                {sentEmail ? (
                    <div className="mb-3 flex w-full max-w-3xl flex-col gap-2 px-6 py-8">
                        <p className="text-sm text-muted-foreground">
                            A confirmation email has been sent to your current address{' '}
                            <span className="font-medium text-foreground">{sentEmail}</span>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Follow the link in that email to complete the email change. You must remain signed in with
                            your current account until you confirm.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            If you don&apos;t receive the email, please wait a few minutes, check your spam folder, or
                            contact support.
                        </p>
                        <SmoothButton asChild color="accent" variant="candy" className="mt-4 w-full gap-2">
                            <Link href="mailto:">
                                <MailIcon className="size-4" aria-hidden />
                                Open email app
                            </Link>
                        </SmoothButton>
                        <SmoothButton asChild color="accent" variant="candy" className="mt-2 w-full gap-2">
                            <Link href="/">
                                <HomeIcon className="size-4" aria-hidden />
                                Go to home page
                            </Link>
                        </SmoothButton>
                    </div>
                ) : (
                    <form
                        className="mb-3 w-full max-w-3xl"
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (canSubmit) void handleSubmit()
                        }}
                    >
                        <div className="grid gap-3 px-6 pt-8 sm:grid-cols-[10rem_1fr] sm:gap-4">
                            <div className="hidden sm:block" />
                            <div className="min-w-0 space-y-3 text-sm text-muted-foreground">
                                <p>
                                    In order to change your email for Jutge.org, you need to request a confirmation email to be sent to your current address.
                                </p>
                                <p>
                                    <span className="font-bold text-foreground">Important:</span> You need access to your current email to complete the email change.
                                </p>
                                <p>
                                    <span className="font-bold text-foreground">Warning:</span> Please take into account that when changing your email, instructors and
                                    tutors of the courses you were enrolled will not be able to track you.
                                </p>
                                {isUpcEmail ? (
                                    <p>
                                        <span className="font-bold text-foreground">Warning:</span> If you change your email and you
                                        are enrolled in UPC courses, you will likely have problems with lab exams or
                                        assignment submissions because your instructors will no longer be able to track
                                        you.
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <dl className="px-6 py-4">
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
                                            ? 'I understand the implications of changing my email.'
                                            : 'Check to confirm you understand implications of changing your email.'}
                                    </p>
                                </div>
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
                                    >
                                        {pending ? 'Sending…' : 'Request email change'}
                                    </SmoothButton>
                                </div>
                            </div>
                        </dl>
                    </form>
                )}
            </section>
            <div className="mt-auto flex justify-end pt-12">
                <RecaptchaNotice configured={recaptchaConfigured} />
            </div>
        </div>
    )
}
