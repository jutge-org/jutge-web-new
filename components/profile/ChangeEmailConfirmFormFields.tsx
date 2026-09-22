'use client'

import { useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { confirmChangeEmailAction } from '@/lib/data/changeEmailActions'
import { queueFlashToast } from '@/lib/flashToast'
import { RECAPTCHA_CHANGE_EMAIL_ACTION } from '@/lib/recaptcha'

type ChangeEmailConfirmFormFieldsProps = {
    oldEmail: string
    newEmail: string
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

export function ChangeEmailConfirmFormFields({
    oldEmail,
    newEmail,
    recaptchaConfigured,
    executeRecaptcha,
}: ChangeEmailConfirmFormFieldsProps) {
    const { logout } = useAuth()
    const [oldEmailCode, setOldEmailCode] = useState('')
    const [newEmailCode, setNewEmailCode] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)
    const canSubmit =
        oldEmailCode.trim().length > 0 &&
        newEmailCode.trim().length > 0 &&
        password.length > 0 &&
        recaptchaReady &&
        !pending

    async function handleSubmit() {
        setErrorMessage(null)

        if (!oldEmailCode.trim()) {
            setErrorMessage('Enter the confirmation code sent to your current email.')
            return
        }

        if (!newEmailCode.trim()) {
            setErrorMessage('Enter the confirmation code sent to your new email.')
            return
        }

        if (!password) {
            setErrorMessage('Password is required.')
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
                old_email_code: oldEmailCode.trim(),
                new_email_code: newEmailCode.trim(),
                password,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            queueFlashToast({
                type: 'success',
                message: `Your email has been changed to ${newEmail}. Please sign in with that address.`,
            })
            await logout()
            window.location.assign('/')
        } finally {
            setPending(false)
        }
    }

    return (
        <form
            className="w-full"
            onSubmit={(e) => {
                e.preventDefault()
                if (canSubmit) void handleSubmit()
            }}
        >
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <div className="hidden sm:block" />
                <div className="min-w-0 space-y-2 text-sm text-muted-foreground">
                    <p>
                        An old email confirmation code was sent to your current address{' '}
                        <span className="font-medium text-foreground">{oldEmail}</span> and a new email confirmation
                        code to <span className="font-medium text-foreground">{newEmail}</span>.
                    </p>
                    <p>
                        Enter both codes and your current password.
                        After the change, you session will end and you will need to sign in with your new email.
                    </p>
                    <p>If you don&apos;t receive the emails, wait a few minutes and check your spam folder.</p>
                </div>
            </div>

            <dl className="py-4">
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

                <ProfileFormRow label="Old email code" htmlFor="change-email-confirm-old-code">
                    <Input
                        id="change-email-confirm-old-code"
                        type="text"
                        value={oldEmailCode}
                        onChange={(e) => setOldEmailCode(e.target.value)}
                        placeholder="Code sent to your current email"
                        autoComplete="one-time-code"
                        spellCheck={false}
                        className="w-full"
                    />
                </ProfileFormRow>

                <ProfileFormRow label="New email code" htmlFor="change-email-confirm-new-code">
                    <Input
                        id="change-email-confirm-new-code"
                        type="text"
                        value={newEmailCode}
                        onChange={(e) => setNewEmailCode(e.target.value)}
                        placeholder="Code sent to your new email"
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full"
                    />
                </ProfileFormRow>

                <ProfileFormRow label="Password" htmlFor="change-email-confirm-password">
                    <Input
                        id="change-email-confirm-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your current password"
                        autoComplete="current-password"
                        className="w-full"
                    />
                </ProfileFormRow>
            </dl>

            <div className="grid gap-4 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
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
    )
}
