'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UserPlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { registerAction } from '@/lib/data/registrationActions'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import { CompleteNameHelpDialog } from '@/components/registration/CompleteNameHelpDialog'
import { HonorCodeDialog } from '@/components/registration/HonorCodeDialog'
import { TermsOfServiceDialog } from '@/components/registration/TermsOfServiceDialog'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RECAPTCHA_REGISTRATION_ACTION } from '@/lib/recaptcha'
import type { Country } from '@/lib/jutge_api_client'
import Link from 'next/link'

type RegistrationFormFieldsProps = {
    countries: Country[]
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
    recaptchaConfigured,
    executeRecaptcha,
}: RegistrationFormFieldsProps) {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [birthYear, setBirthYear] = useState('')
    const [parentEmail, setParentEmail] = useState('')
    const [countryId, setCountryId] = useState('')
    const [agreedToPolicies, setAgreedToPolicies] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    const canSubmit =
        name.trim().length > 0 &&
        email.trim().length > 0 &&
        birthYear.trim().length > 0 &&
        countryId.length > 0 &&
        agreedToPolicies &&
        isStrongPassword(password) &&
        password === confirmPassword &&
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

            setErrorMessage(null)
            toast.success(`An email has been sent to ${result.email}. You are now signed in as ${result.userName}.`)
            router.push('/')
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-3xl">
            <Alert className="p-4 mb-8">
                <AlertDescription>
                    If you have forgotten your password, {}
                    <Link href="/password-reset" className="font-medium text-foreground">
                        reset your password
                    </Link>
                    .
                </AlertDescription>
            </Alert>

            <section className="rounded-xl border border-border bg-card shadow-xs">
                <dl className="px-6">
                    <ProfileFormRow
                        label={
                            <>
                                <CompleteNameHelpDialog />
                                Full name
                            </>
                        }
                        htmlFor="registration-name"
                    >
                        <Input
                            id="registration-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your complete and official name."
                            autoComplete="name"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow label="Email" htmlFor="registration-email">
                        <Input
                            id="registration-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email"
                            autoComplete="email"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow label="Birth year" htmlFor="registration-birth-year">
                        <Input
                            id="registration-birth-year"
                            type="number"
                            inputMode="numeric"
                            min={1900}
                            max={new Date().getFullYear()}
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
                            placeholder="Year"
                            className="max-w-xs"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow
                        label="If you are a minor under your jurisdiction, email of a parent or guardian"
                        htmlFor="registration-parent-email"
                        alignStart
                    >
                        <Input
                            id="registration-parent-email"
                            type="email"
                            value={parentEmail}
                            onChange={(e) => setParentEmail(e.target.value)}
                            placeholder="Email of your parent or guardian, if you are minor in your jurisdiction"
                            autoComplete="email"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow label="Country" htmlFor="registration-country">
                        <Select value={countryId} onValueChange={setCountryId}>
                            <SelectTrigger id="registration-country" className="w-full">
                                <SelectValue placeholder="Select a country" />
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
                                I agree with Jutge.org&apos;s <TermsOfServiceDialog /> and with Jutge.org&apos;s{' '}
                                <HonorCodeDialog />
                            </Label>
                        </div>
                    </ProfileFormRow>

                    <div className="grid gap-2 border-t border-border py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <div className="hidden sm:block" />
                        <p className="text-sm text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
                    </div>

                    <ProfileFormRow label="Password" htmlFor="registration-password">
                        <Input
                            id="registration-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            autoComplete="new-password"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow label="Repeat password" htmlFor="registration-confirm-password">
                        <Input
                            id="registration-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && canSubmit) void handleSubmit()
                            }}
                        />
                    </ProfileFormRow>
                </dl>

                <div className="grid gap-4 border-t border-border px-6 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <div className="hidden sm:block" />
                    <div className="flex flex-col gap-3">
                        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
                        <Button
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={!canSubmit}
                            className="w-full gap-2 sm:w-auto"
                        >
                            <UserPlusIcon className="size-4" aria-hidden />
                            {pending ? 'Registering…' : 'Register'}
                        </Button>
                        <RecaptchaNotice configured={recaptchaConfigured} />
                    </div>
                </div>
            </section>
        </div>
    )
}
