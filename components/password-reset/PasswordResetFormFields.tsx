'use client'

import { HomeIcon, KeyRoundIcon, MailIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { requestPasswordResetAction } from '@/lib/data/passwordResetActions'
import { RECAPTCHA_PASSWORD_RESET_ACTION } from '@/lib/recaptcha'

type PasswordResetFormFieldsProps = {
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

export function PasswordResetFormFields({ recaptchaConfigured, executeRecaptcha }: PasswordResetFormFieldsProps) {
    const [email, setEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [sentEmail, setSentEmail] = useState<string | null>(null)

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)

    const canSubmit = email.trim().length > 0 && recaptchaReady && !pending && !sentEmail

    async function handleSubmit() {
        setErrorMessage(null)

        if (!email.trim()) {
            setErrorMessage('Email is required.')
            return
        }

        if (!recaptchaConfigured) {
            setErrorMessage('Password reset is not available because reCAPTCHA is not configured.')
            return
        }

        setPending(true)
        try {
            let recaptchaToken = ''
            if (recaptchaConfigured) {
                if (!executeRecaptcha) {
                    setErrorMessage('Security check is not ready yet. Please try again.')
                    return
                }

                const token = await executeRecaptcha(RECAPTCHA_PASSWORD_RESET_ACTION)
                if (!token) {
                    setErrorMessage('Security check failed. Please try again.')
                    return
                }
                recaptchaToken = token
            }

            const trimmedEmail = email.trim()
            const result = await requestPasswordResetAction({
                email: trimmedEmail,
                recaptcha_token: recaptchaToken,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            setSentEmail(trimmedEmail)
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="rounded-xl border border-border bg-card shadow-xs flex justify-center">
                {sentEmail ? (
                    <div className="mb-3 flex w-full max-w-3xl flex-col gap-2 px-6 py-8">
                        <p className="text-sm text-muted-foreground">
                            A password reset email has been sent to <span className="font-medium text-foreground">{sentEmail}</span>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Follow the link in that email to choose a new password.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            If you don't receive the email, please wait a few minutes, check your spam folder, check that this is the correct email address for your account at Jutge.org, or contact support.
                        </p>
                        <SmoothButton asChild color="accent" variant="candy" className="w-full gap-2 mt-4">
                            <Link href="mailto:">
                                <MailIcon className="size-4" aria-hidden />
                                Open email app
                            </Link>
                        </SmoothButton>
                        <SmoothButton asChild color="accent" variant="candy" className="w-full gap-2 mt-2">
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
                        <dl className="px-6 py-4">
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
                                <div className="flex min-w-0 flex-col gap-3 mt-4">
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
                                        <KeyRoundIcon className="size-4" aria-hidden />
                                        {pending ? 'Sending…' : 'Reset password'}
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
