'use client'

import { UserPlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { HonorCodeDialog } from '@/components/registration/HonorCodeDialog'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import { TermsOfServiceDialog } from '@/components/registration/TermsOfServiceDialog'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { registerAction } from '@/lib/data/registrationActions'
import type { Country } from '@/lib/jutge_api_client'
import { RECAPTCHA_REGISTRATION_ACTION } from '@/lib/recaptcha'

type RegistrationFormFieldsProps = {
    countries: Country[]
    initialEmail?: string
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

export function RegistrationFormFields({
    countries,
    initialEmail = '',
    recaptchaConfigured,
    executeRecaptcha,
}: RegistrationFormFieldsProps) {
    const router = useRouter()
    const { login } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState(initialEmail)
    const [birthYear, setBirthYear] = useState('')
    const [parentEmail, setParentEmail] = useState('')
    const [countryId, setCountryId] = useState('')
    const [agreedToPolicies, setAgreedToPolicies] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [nameHelperVisible, setNameHelperVisible] = useState(false)
    const [parentEmailHelperVisible, setParentEmailHelperVisible] = useState(false)
    const [passwordHelperVisible, setPasswordHelperVisible] = useState(false)

    function updatePasswordHelperVisibility(visible: boolean) {
        if (visible) {
            setPasswordHelperVisible(true)
            return
        }
        window.setTimeout(() => {
            const active = document.activeElement
            if (
                active?.id !== 'registration-password' &&
                active?.id !== 'registration-confirm-password'
            ) {
                setPasswordHelperVisible(false)
            }
        }, 0)
    }

    const recaptchaReady = !recaptchaConfigured || Boolean(executeRecaptcha)

    const canSubmit =
        name.trim().length > 0 &&
        email.trim().length > 0 &&
        birthYear.trim().length > 0 &&
        countryId.length > 0 &&
        agreedToPolicies &&
        isStrongPassword(password) &&
        password === confirmPassword &&
        recaptchaReady &&
        !pending

    async function handleSubmit() {
        setErrorMessage(null)

        if (!name.trim()) {
            setErrorMessage('Complete name is required.')
            return
        }

        if (!email.trim()) {
            setErrorMessage('Email is required.')
            return
        }

        if (birthYear.trim() === '') {
            setErrorMessage('Birth year is required.')
            return
        }

        const parsedBirthYear = Number.parseInt(birthYear, 10)
        if (Number.isNaN(parsedBirthYear) || parsedBirthYear < 1900 || parsedBirthYear > new Date().getFullYear()) {
            setErrorMessage('Birth year must be a valid year.')
            return
        }

        if (!countryId) {
            setErrorMessage('Country is required.')
            return
        }

        if (!agreedToPolicies) {
            setErrorMessage('You must agree to the Terms of Service and Honor Code.')
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
            setErrorMessage('Registration is not available because reCAPTCHA is not configured.')
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

                const token = await executeRecaptcha(RECAPTCHA_REGISTRATION_ACTION)
                if (!token) {
                    setErrorMessage('Security check failed. Please try again.')
                    return
                }
                recaptchaToken = token
            }

            const trimmedEmail = email.trim()
            const result = await registerAction({
                name: name.trim(),
                email: trimmedEmail,
                birth_year: parsedBirthYear,
                parent_email: parentEmail.trim() || null,
                country_id: countryId,
                recaptcha_token: recaptchaToken,
                password,
                confirmPassword,
            })

            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            const loginResult = await login({ email: trimmedEmail, password })
            if (!loginResult.ok) {
                setErrorMessage(
                    `Your account was created, but automatic sign-in failed: ${loginResult.error} Please sign in manually.`,
                )
                return
            }

            setErrorMessage(null)
            toast.success(`A confirmation email has been sent to ${result.email}. Please sign in to your account.`)
            router.push('/')
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="rounded-xl border border-border bg-card shadow-xs flex justify-center">
                <form
                    className="mb-3 w-full max-w-3xl"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (canSubmit) void handleSubmit()
                    }}
                >
                    <dl className="px-6 py-4">
                        <ProfileFormRow label="Email" htmlFor="registration-email">
                            <Input
                                id="registration-email"
                                name="username"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email"
                                autoComplete="username"
                            />
                        </ProfileFormRow>

                        {nameHelperVisible ? (
                            <div className="grid gap-2 pt-8 sm:grid-cols-[10rem_1fr] sm:gap-4">
                                <div className="hidden sm:block" />
                                <p className="text-sm text-muted-foreground">
                                    Please write your full name as you would write it in your own language for an official
                                    document and capitalize it correctly.
                                </p>
                            </div>
                        ) : null}

                        <ProfileFormRow
                            label="Full name"
                            htmlFor="registration-name"
                        >
                            <Input
                                id="registration-name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onFocus={() => setNameHelperVisible(true)}
                                onBlur={() => setNameHelperVisible(false)}
                                placeholder="Your complete and official name"
                                autoComplete="name"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Birth year" htmlFor="registration-birth-year">
                            <Input
                                id="registration-birth-year"
                                name="bday-year"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{4}"
                                maxLength={4}
                                value={birthYear}
                                onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="Year"
                                className="w-24"
                                autoComplete="bday-year"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Country" htmlFor="registration-country">
                            <Select value={countryId} onValueChange={setCountryId}>
                                <SelectTrigger id="registration-country" className="w-full">
                                    <SelectValue placeholder="Select your country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem key={country.country_id} value={country.country_id}>
                                            {country.eng_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </ProfileFormRow>

                        <ProfileFormRow label="Policies agreement" alignStart>
                            <div className="flex items-start gap-3 mt-1">
                                <Checkbox
                                    id="registration-policies"
                                    checked={agreedToPolicies}
                                    onCheckedChange={(checked) => setAgreedToPolicies(checked === true)}
                                    aria-describedby="registration-policies-description"
                                />
                                <Label
                                    id="registration-policies-description"
                                    htmlFor="registration-policies"
                                    className="text-sm leading-snug font-normal"
                                >
                                    I agree with Jutge.org&apos;s <TermsOfServiceDialog /> and
                                    <HonorCodeDialog />
                                </Label>
                            </div>
                        </ProfileFormRow>


                        {parentEmailHelperVisible ? (
                            <div className="grid gap-2 pt-8 sm:grid-cols-[10rem_1fr] sm:gap-4">
                                <div className="hidden sm:block" />
                                <p className="text-sm text-muted-foreground">
                                    If you are a minor under your jurisdiction, you need to provide the email of a parent
                                    or guardian.
                                </p>
                            </div>
                        ) : null}

                        <ProfileFormRow
                            label="Guardian email"
                            htmlFor="registration-parent-email"
                        >
                            <Input
                                id="registration-parent-email"
                                name="parent-email"
                                type="email"
                                value={parentEmail}
                                onChange={(e) => setParentEmail(e.target.value)}
                                onFocus={() => setParentEmailHelperVisible(true)}
                                onBlur={() => setParentEmailHelperVisible(false)}
                                placeholder="Email of your parent or guardian, if you are minor"
                                autoComplete="off"
                            />
                        </ProfileFormRow>

                        {passwordHelperVisible ? (
                            <div className="grid gap-2 pt-8 sm:grid-cols-[10rem_1fr] sm:gap-4">
                                <div className="hidden sm:block" />
                                <p className="text-sm text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
                            </div>
                        ) : null}

                        <ProfileFormRow label="Password" htmlFor="registration-password">
                            <Input
                                id="registration-password"
                                name="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => updatePasswordHelperVisibility(true)}
                                onBlur={() => updatePasswordHelperVisibility(false)}
                                placeholder="Your password"
                                autoComplete="new-password"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Repeat password" htmlFor="registration-confirm-password">
                            <Input
                                id="registration-confirm-password"
                                name="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onFocus={() => updatePasswordHelperVisibility(true)}
                                onBlur={() => updatePasswordHelperVisibility(false)}
                                placeholder="Repeat your password"
                                autoComplete="new-password"
                            />
                        </ProfileFormRow>
                    </dl>

                    <div className="grid gap-4 px-8 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <div className="hidden sm:block" />
                        <div className="flex flex-col gap-3">
                            {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
                            <SmoothButton
                                type="submit"
                                color="accent"
                                variant="candy"
                                disabled={!canSubmit}
                                className="w-full gap-2 sm:w-auto"
                            >
                                <UserPlusIcon className="size-4" aria-hidden />
                                {pending ? 'Registering…' : 'Register'}
                            </SmoothButton>
                        </div>
                    </div>
                </form>
            </section>
            <div className="mt-auto flex justify-end pt-12">
                <RecaptchaNotice configured={recaptchaConfigured} />
            </div>
        </div>
    )
}
