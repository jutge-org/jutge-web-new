'use client'

import { UserXIcon } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { confirmUnregistrationAction } from '@/lib/data/unregistrationActions'
import { queueFlashToast } from '@/lib/flashToast'
import { RECAPTCHA_UNREGISTRATION_ACTION } from '@/lib/recaptcha'

type UnregistrationConfirmFormFieldsProps = {
    email: string
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

export function UnregistrationConfirmFormFields({
    email,
    recaptchaConfigured,
    executeRecaptcha,
}: UnregistrationConfirmFormFieldsProps) {
    const { logout } = useAuth()
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)
    const canSubmit = code.trim().length > 0 && password.length > 0 && recaptchaReady && !pending

    async function handleSubmit() {
        setErrorMessage(null)

        if (!code.trim()) {
            setErrorMessage('Enter the confirmation code sent to your email.')
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

            const result = await confirmUnregistrationAction({
                email,
                code: code.trim(),
                password,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            queueFlashToast({
                type: 'success',
                message: 'Your account has been unregistered.',
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
                        A confirmation code was sent to <span className="font-medium text-foreground">{email}</span>.
                    </p>
                    <p>
                        Enter that code and your current password to permanently unregister your account. All account
                        data will be lost and cannot be recovered.
                    </p>
                    <p>If you don&apos;t receive the email, wait a few minutes and check your spam folder.</p>
                </div>
            </div>

            <dl className="py-4">
                <ProfileFormRow label="Email" htmlFor="unregistration-confirm-email">
                    <Input
                        id="unregistration-confirm-email"
                        type="email"
                        value={email}
                        readOnly
                        autoComplete="username"
                        className="w-full"
                    />
                </ProfileFormRow>

                <ProfileFormRow label="Confirmation code" htmlFor="unregistration-confirm-code">
                    <Input
                        id="unregistration-confirm-code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Code sent to your email"
                        autoComplete="one-time-code"
                        spellCheck={false}
                        className="w-full"
                    />
                </ProfileFormRow>

                <ProfileFormRow label="Password" htmlFor="unregistration-confirm-password">
                    <Input
                        id="unregistration-confirm-password"
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
                <div className="flex min-w-0 flex-col gap-3">
                    {errorMessage ? (
                        <p role="alert" className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    ) : null}
                    <SmoothButton
                        type="submit"
                        color="destructive"
                        variant="candy"
                        disabled={!canSubmit}
                        loading={pending}
                        className="w-full gap-2"
                        prefix={<UserXIcon className="size-4" aria-hidden />}
                    >
                        {pending ? 'Unregistering…' : 'Unregister permanently'}
                    </SmoothButton>
                </div>
            </div>
        </form>
    )
}
