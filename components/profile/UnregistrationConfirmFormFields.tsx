'use client'

import { CheckIcon, HeartIcon, UserXIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import AnimatedToggle from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import { confirmUnregistrationAction } from '@/lib/data/unregistrationActions'
import { RECAPTCHA_UNREGISTRATION_ACTION } from '@/lib/recaptcha'

type UnregistrationConfirmFormFieldsProps = {
    email: string
    code: string
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

export function UnregistrationConfirmFormFields({
    email,
    code,
    recaptchaConfigured,
    executeRecaptcha,
}: UnregistrationConfirmFormFieldsProps) {
    const router = useRouter()
    const { logout } = useAuth()
    const [confirmed, setConfirmed] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)
    const canProceed = confirmed && recaptchaReady && !pending

    async function handleProceed() {
        setErrorMessage(null)

        if (!confirmed) {
            setErrorMessage('Please confirm that you understand this action is irreversible.')
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
                code,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            toast.success('Your account has been unregistered.')
            await logout()
            window.location.assign('/')
        } finally {
            setPending(false)
        }
    }

    function handleCancel() {
        toast.info('Unregistration cancelled.')
        router.push('/')
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex w-full justify-center rounded-xl border border-border bg-card shadow-xs">
                <div className="flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
                    <div className="space-y-2 text-center text-sm text-muted-foreground">
                        <p className="text-base font-medium text-foreground">Confirm account unregistration</p>
                        <p>
                            You are about to permanently unregister{' '}
                            <span className="font-medium text-foreground">{email}</span>. All account data will be lost
                            and cannot be recovered.
                        </p>
                        <p>
                            This is the last step to unregister your account.
                        </p>
                    </div>

                    <dl>
                        <ProfileFormRow label="Confirmation" alignStart>
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
                        </ProfileFormRow>
                    </dl>

                    {errorMessage ? (
                        <p role="alert" className="text-center text-sm text-destructive">
                            {errorMessage}
                        </p>
                    ) : null}

                    <div className="flex w-full flex-row gap-6">
                        <SmoothButton
                            type="button"
                            color="green"
                            variant="candy"
                            className="w-full gap-2"
                            prefix={<HeartIcon className="size-4" aria-hidden />}
                            disabled={pending}
                            onClick={handleCancel}
                        >
                            Keep my account
                        </SmoothButton>
                        <SmoothButton
                            type="button"
                            color="destructive"
                            variant="candy"
                            className="w-full gap-2"
                            prefix={<UserXIcon className="size-4" aria-hidden />}
                            disabled={!canProceed}
                            loading={pending}
                            onClick={() => void handleProceed()}
                        >
                            {pending ? 'Unregistering…' : 'Unregister permanently'}
                        </SmoothButton>
                    </div>
                </div>
            </section>

            <div className="mt-auto flex justify-end pt-12">
                <RecaptchaNotice configured={recaptchaConfigured} />
            </div>
        </div>
    )
}
