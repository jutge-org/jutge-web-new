'use client'

import { CheckIcon, HeartIcon, HomeIcon, MailIcon, UserXIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import AnimatedToggle from '@/components/smoothui/animated-toggle'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { requestUnregistrationAction } from '@/lib/data/unregistrationActions'
import { RECAPTCHA_UNREGISTRATION_ACTION } from '@/lib/recaptcha'

type UnregistrationViewProps = {
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}

type Step = 'warning' | 'confirm' | 'sent'

export function UnregistrationView({ recaptchaConfigured, executeRecaptcha }: UnregistrationViewProps) {
    const router = useRouter()
    const { profile } = useAuth()
    const [step, setStep] = useState<Step>('warning')
    const [confirmed, setConfirmed] = useState(false)
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)
    const canProceed = confirmed && password.length > 0 && recaptchaReady && !pending

    async function handleProceed() {
        setErrorMessage(null)

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

            setStep('sent')
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
                <div className="w-full max-w-2xl px-6 py-8">
                    {step === 'warning' ? (
                        <div className="flex flex-col items-center gap-6 text-center">
                            <div className="space-y-4 text-sm leading-relaxed text-foreground">
                                <p className="text-base font-medium">Don&apos;t you love Jutge.org?</p>
                                <p>Well... you can unregister your account at any time!</p>
                                <p>Take into account that once you unregister...</p>
                                <ul className="space-y-2 text-left">
                                    <li>⚡ You will not be able to access your account anymore.</li>
                                    <li>⚡ You will not be able to access your submitted solutions anymore.</li>
                                    <li>⚡ You will not be able to view the verdicts of your submissions.</li>
                                    <li>⚡ You will be unenrolled from all the courses you were invited.</li>
                                    <li>
                                        ⚡ Instructors and tutors of the courses you were enrolled will not be able to
                                        see your status.
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
                            </div>

                            <div className="flex w-full flex-row gap-6">
                                <SmoothButton
                                    type="button"
                                    color="green"
                                    variant="candy"
                                    className="w-full gap-2"
                                    prefix={<HeartIcon className="size-4" aria-hidden />}
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
                                    onClick={() => {
                                        setErrorMessage(null)
                                        setStep('confirm')
                                    }}
                                >
                                    Unregister my account
                                </SmoothButton>
                            </div>
                        </div>
                    ) : null}

                    {step === 'confirm' ? (
                        <div className="flex flex-col gap-6">
                            <div className="space-y-2 text-center text-sm text-muted-foreground">
                                <p className="text-base font-medium text-foreground">Confirm unregistration</p>
                                <p>
                                    Enter your password and confirm that you understand this action is irreversible.
                                    We will send an unregistration email to your email address with a link to complete the process.
                                </p>
                            </div>

                            <dl>

                                <ProfileFormRow label="Password" htmlFor="unregistration-password">
                                    <Input
                                        id="unregistration-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        placeholder="Your current password"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && canProceed) void handleProceed()
                                        }}
                                    />
                                </ProfileFormRow>
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
                                <p role="alert" className="text-sm text-destructive text-center">
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
                                    prefix={<MailIcon className="size-4" aria-hidden />}
                                    disabled={!canProceed}
                                    loading={pending}
                                    onClick={() => void handleProceed()}
                                >
                                    {pending ? 'Sending email…' : 'Send unregistration email'}
                                </SmoothButton>
                            </div>
                        </div>
                    ) : null}

                    {step === 'sent' ? (
                        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                            <p>
                                An unregistration request email has been sent
                                {profile?.email ? (
                                    <>
                                        {' '}
                                        to <span className="font-medium text-foreground">{profile.email}</span>
                                    </>
                                ) : null}
                                .
                            </p>
                            <p>Follow the link in that email to permanently unregister your account.</p>
                            <p>
                                If you don&apos;t receive the email, please wait a few minutes, check your spam folder,
                                or contact support.
                            </p>
                            <SmoothButton asChild color="accent" variant="candy" className="mt-2 w-full gap-2">
                                <Link href="mailto:">
                                    <MailIcon className="size-4" aria-hidden />
                                    Open email app
                                </Link>
                            </SmoothButton>
                            <SmoothButton asChild color="accent" variant="candy" className="w-full gap-2">
                                <Link href="/">
                                    <HomeIcon className="size-4" aria-hidden />
                                    Go to home page
                                </Link>
                            </SmoothButton>
                        </div>
                    ) : null}
                </div>
            </section>

            {step === 'confirm' ? (
                <div className="mt-auto flex justify-end pt-12">
                    <RecaptchaNotice configured={recaptchaConfigured} />
                </div>
            ) : null}
        </div>
    )
}
