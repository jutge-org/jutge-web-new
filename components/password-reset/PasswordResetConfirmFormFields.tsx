'use client'

import { KeyRoundIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { confirmPasswordResetAction } from '@/lib/data/passwordResetActions'
import { RECAPTCHA_PASSWORD_RESET_ACTION } from '@/lib/recaptcha'

type PasswordResetConfirmFormFieldsProps = {
    email: string
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

const PASSWORD_REQUIREMENTS =
    'Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character. For your own security, choose a strong password and do not use the same password on other websites. Password will be reset periodically by the system.'

function isStrongPassword(password: string): boolean {
    if (password.length < 12) return false
    if (!/[A-Z]/.test(password)) return false
    if (!/[a-z]/.test(password)) return false
    if (!/\d/.test(password)) return false
    if (!/[^A-Za-z0-9]/.test(password)) return false
    return true
}

export function PasswordResetConfirmFormFields({
    email,
    recaptchaConfigured,
    executeRecaptcha,
}: PasswordResetConfirmFormFieldsProps) {
    const router = useRouter()
    const { login } = useAuth()
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [passwordHelperVisible, setPasswordHelperVisible] = useState(false)

    function updatePasswordHelperVisibility(visible: boolean) {
        if (visible) {
            setPasswordHelperVisible(true)
            return
        }
        window.setTimeout(() => {
            const active = document.activeElement
            if (active?.id !== 'password-reset-confirm-password' && active?.id !== 'password-reset-confirm-repeat') {
                setPasswordHelperVisible(false)
            }
        }, 0)
    }

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)

    const canSubmit =
        code.trim().length > 0 &&
        isStrongPassword(password) &&
        password === confirmPassword &&
        recaptchaReady &&
        !pending

    async function handleSubmit() {
        setErrorMessage(null)

        if (!code.trim()) {
            setErrorMessage('Enter the confirmation code sent to your email.')
            return
        }

        if (!isStrongPassword(password)) {
            setErrorMessage('Password does not meet the strength requirements.')
            return
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.')
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

            const result = await confirmPasswordResetAction({
                email,
                code,
                password,
                confirmPassword,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            const loginResult = await login({ email, password })
            if (!loginResult.ok) {
                toast.success('Your password has been reset. Please sign in with your new password.')
                router.push('/')
                return
            }

            toast.success(`Password reset successful. Welcome back, ${loginResult.userName}.`)
            router.push('/')
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
                    <p>Enter the code and choose a new password.</p>
                    <p>If you don&apos;t receive the email, wait a few minutes and check your spam folder.</p>
                </div>
            </div>

            <dl className="py-4">
                <ProfileFormRow label="Email" htmlFor="password-reset-confirm-email">
                    <Input
                        id="password-reset-confirm-email"
                        type="email"
                        value={email}
                        readOnly
                        autoComplete="username"
                        className="w-full"
                    />
                </ProfileFormRow>

                <ProfileFormRow label="Confirmation code" htmlFor="password-reset-confirm-code">
                    <Input
                        id="password-reset-confirm-code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Code sent to your email"
                        autoComplete="one-time-code"
                        spellCheck={false}
                        className="w-full"
                    />
                </ProfileFormRow>

                {passwordHelperVisible ? (
                    <div className="grid gap-2 pt-8 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <div className="hidden sm:block" />
                        <p className="text-sm text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
                    </div>
                ) : null}

                <ProfileFormRow label="New password" htmlFor="password-reset-confirm-password">
                    <Input
                        id="password-reset-confirm-password"
                        name="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => updatePasswordHelperVisibility(true)}
                        onBlur={() => updatePasswordHelperVisibility(false)}
                        placeholder="Your new password"
                        autoComplete="new-password"
                        className="w-full"
                    />
                </ProfileFormRow>

                <ProfileFormRow label="Repeat password" htmlFor="password-reset-confirm-repeat">
                    <Input
                        id="password-reset-confirm-repeat"
                        name="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => updatePasswordHelperVisibility(true)}
                        onBlur={() => updatePasswordHelperVisibility(false)}
                        placeholder="Repeat your new password"
                        autoComplete="new-password"
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
                        <KeyRoundIcon className="size-4" aria-hidden />
                        {pending ? 'Saving…' : 'Set new password'}
                    </SmoothButton>
                </div>
            </div>
        </form>
    )
}
