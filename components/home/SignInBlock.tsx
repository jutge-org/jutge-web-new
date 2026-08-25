'use client'

import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { useAuth } from '@/components/AuthProvider'
import { CompleteNameHelpDialog } from '@/components/registration/CompleteNameHelpDialog'
import { HonorCodeDialog } from '@/components/registration/HonorCodeDialog'
import { RecaptchaNotice } from '@/components/registration/RecaptchaNotice'
import { TermsOfServiceDialog } from '@/components/registration/TermsOfServiceDialog'
import AnimatedTabs from '@/components/smoothui/animated-tabs'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Checkbox } from '@/components/ui/checkbox'
import { requestPasswordResetAction } from '@/lib/data/passwordResetActions'
import { registerAction } from '@/lib/data/registrationActions'
import { fetchCountries } from '@/lib/data/tables'
import type { Country } from '@/lib/jutge_api_client'
import { getRecaptchaSiteKey, RECAPTCHA_PASSWORD_RESET_ACTION, RECAPTCHA_REGISTRATION_ACTION } from '@/lib/recaptcha'
import { cn } from '@/lib/utils'
import { BookMarkedIcon, LockOpenIcon, LogInIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'
import validator from 'validator'

const TABS = [
    { id: 'signup', label: 'Sign up', icon: <BookMarkedIcon className="size-4" aria-hidden /> },
    { id: 'signin', label: 'Sign in', icon: <LogInIcon className="size-4" aria-hidden /> },
    {
        id: 'reset',
        label: 'Reset password',
        icon: <LockOpenIcon className="size-4" aria-hidden />,
    },
]

export type AccountTabId = 'signin' | 'signup' | 'reset'

const ACCOUNT_TABS_LAYOUT_ID = 'home-account-tabs'

const underlineInputClass = cn(
    'min-w-0 flex-1 border-0 border-b border-foreground/30 bg-transparent px-0 py-1.5 text-sm text-foreground',
    'placeholder:text-transparent',
    'outline-none transition-[border-color] duration-200',
    'focus-visible:border-foreground',
    'aria-invalid:border-destructive',
    'px-2',
)

const labelClass = 'w-20 shrink-0 text-left text-sm text-foreground mr-2'

function SignInPanel({ focusEmailKey }: { focusEmailKey: number }) {
    const { login } = useAuth()
    const formId = useId()
    const emailId = `${formId}-email`
    const passwordId = `${formId}-password`
    const errorId = `${formId}-error`

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)
    const canSubmit = validator.isEmail(email.trim()) && password.length >= 8 && !pending

    useEffect(() => {
        emailRef.current?.focus({ preventScroll: focusEmailKey > 0 })
    }, [])

    useEffect(() => {
        if (focusEmailKey === 0) return
        emailRef.current?.focus({ preventScroll: true })
    }, [focusEmailKey])

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)

        const trimmed = email.trim()
        if (!validator.isEmail(trimmed)) {
            setErrorMessage('Please enter a valid email address.')
            emailRef.current?.focus()
            return
        }
        if (password.length < 8) {
            setErrorMessage('Password must be at least 8 characters.')
            passwordRef.current?.focus()
            return
        }

        startTransition(async () => {
            const result = await login({ email: trimmed, password })
            if (!result.ok) {
                setErrorMessage(result.error)
                passwordRef.current?.focus()
                return
            }
            toast.success(`Signed in as ${result.userName}`)
            setEmail('')
            setPassword('')
        })
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="mx-auto flex w-96 max-w-full flex-col gap-4">
            <div className="flex items-baseline gap-3">
                <label htmlFor={emailId} className={labelClass}>
                    Email:
                </label>
                <input
                    ref={emailRef}
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        if (errorMessage) setErrorMessage(null)
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={underlineInputClass}
                />
            </div>
            <div className="flex items-baseline gap-3">
                <label htmlFor={passwordId} className={labelClass}>
                    Password:
                </label>
                <input
                    ref={passwordRef}
                    id={passwordId}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value)
                        if (errorMessage) setErrorMessage(null)
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={underlineInputClass}
                />
            </div>
            <div className="flex items-baseline gap-3">
                <div className={labelClass} aria-hidden />
                <SmoothButton
                    type="submit"
                    color="accent"
                    variant="candy"
                    disabled={!canSubmit}
                    className="min-w-0 flex-1 h-8 mt-4"
                >
                    <LogInIcon className="size-4" aria-hidden />
                    {pending ? 'Signing in…' : 'Sign in'}
                </SmoothButton>
            </div>

            {errorMessage ? (
                <p id={errorId} role="alert" className="text-sm text-destructive">
                    {errorMessage}
                </p>
            ) : null}
        </form>
    )
}

function ResetPasswordPanelFields({
    recaptchaConfigured,
    executeRecaptcha,
}: {
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
}) {
    const formId = useId()
    const emailId = `${formId}-email`
    const errorId = `${formId}-error`

    const [email, setEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const emailRef = useRef<HTMLInputElement>(null)
    const canSubmit = validator.isEmail(email.trim()) && !pending

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)

        const trimmed = email.trim()
        if (!validator.isEmail(trimmed)) {
            setErrorMessage('Please enter a valid email address.')
            emailRef.current?.focus()
            return
        }
        if (!recaptchaConfigured) {
            setErrorMessage('Password reset is not available because reCAPTCHA is not configured.')
            return
        }

        startTransition(async () => {
            if (!executeRecaptcha) {
                setErrorMessage('Security check is not ready yet. Please try again.')
                return
            }

            const token = await executeRecaptcha(RECAPTCHA_PASSWORD_RESET_ACTION)
            if (!token) {
                setErrorMessage('Security check failed. Please try again.')
                return
            }

            const result = await requestPasswordResetAction({
                email: trimmed,
                recaptcha_token: token,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                emailRef.current?.focus()
                return
            }

            toast.success('Password reset email sent. Check your inbox.')
            setEmail('')
        })
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="mx-auto flex w-96 max-w-full flex-col gap-4">
            <div className="flex items-baseline gap-3">
                <label htmlFor={emailId} className={labelClass}>
                    Email:
                </label>
                <input
                    ref={emailRef}
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        if (errorMessage) setErrorMessage(null)
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={underlineInputClass}
                />
            </div>
            <div className="flex items-baseline gap-3">
                <div className={labelClass} aria-hidden />
                <SmoothButton
                    type="submit"
                    color="accent"
                    variant="candy"
                    disabled={!canSubmit}
                    className="min-w-0 flex-1 h-8 mt-4"
                >
                    <LockOpenIcon className="size-4" aria-hidden />
                    {pending ? 'Sending…' : 'Reset password'}
                </SmoothButton>
            </div>

            {errorMessage ? (
                <p id={errorId} role="alert" className="text-sm text-destructive">
                    {errorMessage}
                </p>
            ) : null}

            <div className="flex items-baseline gap-3">
                <div className={labelClass} aria-hidden />
                <div className="min-w-0 flex-1">
                    <RecaptchaNotice configured={recaptchaConfigured} />
                </div>
            </div>
        </form>
    )
}

function ResetPasswordPanelWithRecaptcha() {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return <ResetPasswordPanelFields recaptchaConfigured executeRecaptcha={executeRecaptcha ?? undefined} />
}

function ResetPasswordPanel() {
    const siteKey = getRecaptchaSiteKey()

    if (!siteKey) {
        return <ResetPasswordPanelFields recaptchaConfigured={false} />
    }

    return (
        <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
            <ResetPasswordPanelWithRecaptcha />
        </GoogleReCaptchaProvider>
    )
}

const signUpFieldClass = 'flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3'
const signUpLabelClass = 'text-left text-sm text-foreground md:mr-2 md:w-28 md:shrink-0'
const signUpLabelSpacerClass = 'hidden md:mr-2 md:block md:w-28 md:shrink-0'

const PASSWORD_HINT = 'At least 12 characters with upper, lower, digit, and special character.'

function isStrongPassword(password: string): boolean {
    if (password.length < 12) return false
    if (!/[A-Z]/.test(password)) return false
    if (!/[a-z]/.test(password)) return false
    if (!/\d/.test(password)) return false
    if (!/[^A-Za-z0-9]/.test(password)) return false
    return true
}

function SignUpPanelFields({
    countries,
    recaptchaConfigured,
    executeRecaptcha,
    focusEmailKey,
}: {
    countries: Country[]
    recaptchaConfigured: boolean
    executeRecaptcha?: (action?: string) => Promise<string>
    focusEmailKey: number
}) {
    const { login } = useAuth()
    const formId = useId()
    const nameId = `${formId}-name`
    const emailId = `${formId}-email`
    const birthYearId = `${formId}-birth-year`
    const parentEmailId = `${formId}-parent-email`
    const countryIdField = `${formId}-country`
    const passwordId = `${formId}-password`
    const confirmPasswordId = `${formId}-confirm-password`
    const policiesId = `${formId}-policies`
    const errorId = `${formId}-error`
    const passwordHintId = `${formId}-password-hint`

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [birthYear, setBirthYear] = useState('')
    const [parentEmail, setParentEmail] = useState('')
    const [countryId, setCountryId] = useState('')
    const [agreedToPolicies, setAgreedToPolicies] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const nameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const birthYearRef = useRef<HTMLInputElement>(null)
    const countryRef = useRef<HTMLSelectElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)
    const confirmPasswordRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (focusEmailKey === 0) return
        nameRef.current?.focus({ preventScroll: true })
    }, [focusEmailKey])

    const canSubmit =
        name.trim().length > 0 &&
        validator.isEmail(email.trim()) &&
        birthYear.trim().length > 0 &&
        countryId.length > 0 &&
        agreedToPolicies &&
        isStrongPassword(password) &&
        password === confirmPassword &&
        !pending

    function clearError() {
        if (errorMessage) setErrorMessage(null)
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)

        const trimmedName = name.trim()
        const trimmedEmail = email.trim()
        const trimmedParentEmail = parentEmail.trim()
        const parsedBirthYear = Number.parseInt(birthYear, 10)
        const currentYear = new Date().getFullYear()

        if (!trimmedName) {
            setErrorMessage('Complete name is required.')
            nameRef.current?.focus()
            return
        }
        if (!validator.isEmail(trimmedEmail)) {
            setErrorMessage('Please enter a valid email address.')
            emailRef.current?.focus()
            return
        }
        if (Number.isNaN(parsedBirthYear) || parsedBirthYear < 1900 || parsedBirthYear > currentYear) {
            setErrorMessage('Birth year must be a valid year.')
            birthYearRef.current?.focus()
            return
        }
        if (!countryId) {
            setErrorMessage('Country is required.')
            countryRef.current?.focus()
            return
        }
        if (trimmedParentEmail && !validator.isEmail(trimmedParentEmail)) {
            setErrorMessage('Please enter a valid parent or guardian email.')
            return
        }
        if (!agreedToPolicies) {
            setErrorMessage('You must agree to the Terms of Service and Honor Code.')
            return
        }
        if (!isStrongPassword(password)) {
            setErrorMessage('Password does not meet the strength requirements.')
            passwordRef.current?.focus()
            return
        }
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.')
            confirmPasswordRef.current?.focus()
            return
        }
        if (!recaptchaConfigured) {
            setErrorMessage('Registration is not available because reCAPTCHA is not configured.')
            return
        }

        startTransition(async () => {
            if (!executeRecaptcha) {
                setErrorMessage('Security check is not ready yet. Please try again.')
                return
            }

            const token = await executeRecaptcha(RECAPTCHA_REGISTRATION_ACTION)
            if (!token) {
                setErrorMessage('Security check failed. Please try again.')
                return
            }

            const result = await registerAction({
                name: trimmedName,
                email: trimmedEmail,
                birth_year: parsedBirthYear,
                parent_email: trimmedParentEmail || null,
                country_id: countryId,
                recaptcha_token: token,
                password,
                confirmPassword,
            })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            const loginResult = await login({ email: trimmedEmail, password })
            if (!loginResult.ok) {
                toast.success(`Account created for ${result.email}. Please sign in.`)
                setErrorMessage(loginResult.error)
                return
            }

            toast.success(
                `An email has been sent to ${result.email}. You are now signed in as ${loginResult.userName}.`,
            )
        })
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="mx-auto flex w-full max-w-96 flex-col gap-4 px-2 md:px-0">
            <div className={signUpFieldClass}>
                <div className={cn(signUpLabelClass, 'inline-flex items-center gap-0.5')}>
                    <CompleteNameHelpDialog />
                    <label htmlFor={nameId}>Name:</label>
                </div>
                <input
                    ref={nameRef}
                    id={nameId}
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value)
                        clearError()
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={underlineInputClass}
                />
            </div>

            <div className={signUpFieldClass}>
                <label htmlFor={emailId} className={signUpLabelClass}>
                    Email:
                </label>
                <input
                    ref={emailRef}
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        clearError()
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={underlineInputClass}
                />
            </div>

            <div className={signUpFieldClass}>
                <label htmlFor={birthYearId} className={signUpLabelClass}>
                    Birth year:
                </label>
                <input
                    ref={birthYearRef}
                    id={birthYearId}
                    name="birth_year"
                    type="number"
                    inputMode="numeric"
                    min={1900}
                    max={new Date().getFullYear()}
                    required
                    value={birthYear}
                    onChange={(e) => {
                        setBirthYear(e.target.value)
                        clearError()
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={underlineInputClass}
                />
            </div>

            <div className={signUpFieldClass}>
                <label htmlFor={parentEmailId} className={signUpLabelClass}>
                    Parent email:
                </label>
                <input
                    id={parentEmailId}
                    name="parent_email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={parentEmail}
                    onChange={(e) => {
                        setParentEmail(e.target.value)
                        clearError()
                    }}
                    placeholder="If minor"
                    aria-describedby={`${formId}-parent-hint`}
                    className={cn(underlineInputClass, 'placeholder:text-muted-foreground/60')}
                />
            </div>
            <p id={`${formId}-parent-hint`} className="sr-only">
                Optional. Required if you are a minor under your jurisdiction.
            </p>

            <div className={signUpFieldClass}>
                <label htmlFor={countryIdField} className={signUpLabelClass}>
                    Country:
                </label>
                <select
                    ref={countryRef}
                    id={countryIdField}
                    name="country_id"
                    required
                    value={countryId}
                    onChange={(e) => {
                        setCountryId(e.target.value)
                        clearError()
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={cn(underlineInputClass, 'appearance-none')}
                >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                        <option key={country.country_id} value={country.country_id}>
                            {country.eng_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className={cn(signUpFieldClass, 'md:items-start')}>
                <div className={signUpLabelSpacerClass} aria-hidden />
                <div className="flex min-w-0 flex-1 items-start gap-2 md:pt-1">
                    <Checkbox
                        id={policiesId}
                        checked={agreedToPolicies}
                        onCheckedChange={(checked) => {
                            setAgreedToPolicies(checked === true)
                            clearError()
                        }}
                        aria-describedby={`${formId}-policies-description`}
                        className="mt-0.5"
                    />
                    <label
                        id={`${formId}-policies-description`}
                        htmlFor={policiesId}
                        className="text-sm leading-snug text-foreground"
                    >
                        I agree with the <TermsOfServiceDialog /> and <HonorCodeDialog />
                    </label>
                </div>
            </div>

            <div className={signUpFieldClass}>
                <label htmlFor={passwordId} className={signUpLabelClass}>
                    Password:
                </label>
                <input
                    ref={passwordRef}
                    id={passwordId}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value)
                        clearError()
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={`${passwordHintId}${errorMessage ? ` ${errorId}` : ''}`}
                    className={underlineInputClass}
                />
            </div>
            <div className={signUpFieldClass}>
                <div className={signUpLabelSpacerClass} aria-hidden />
                <p id={passwordHintId} className="min-w-0 flex-1 text-xs text-muted-foreground">
                    {PASSWORD_HINT}
                </p>
            </div>

            <div className={signUpFieldClass}>
                <label htmlFor={confirmPasswordId} className={signUpLabelClass}>
                    Confirm:
                </label>
                <input
                    ref={confirmPasswordRef}
                    id={confirmPasswordId}
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        clearError()
                    }}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? errorId : undefined}
                    className={underlineInputClass}
                />
            </div>

            <div className={signUpFieldClass}>
                <div className={signUpLabelSpacerClass} aria-hidden />
                <SmoothButton
                    type="submit"
                    color="accent"
                    variant="candy"
                    disabled={!canSubmit}
                    className="mt-2 h-8 min-w-0 flex-1 md:mt-4"
                >
                    <BookMarkedIcon className="size-4" aria-hidden />
                    {pending ? 'Registering…' : 'Sign up'}
                </SmoothButton>
            </div>

            {errorMessage ? (
                <p id={errorId} role="alert" className="text-sm text-destructive">
                    {errorMessage}
                </p>
            ) : null}

            <div className={signUpFieldClass}>
                <div className={signUpLabelSpacerClass} aria-hidden />
                <div className="min-w-0 flex-1">
                    <RecaptchaNotice configured={recaptchaConfigured} />
                </div>
            </div>
        </form>
    )
}

function SignUpPanelWithRecaptcha({ countries, focusEmailKey }: { countries: Country[]; focusEmailKey: number }) {
    const { executeRecaptcha } = useGoogleReCaptcha()

    return (
        <SignUpPanelFields
            countries={countries}
            recaptchaConfigured
            executeRecaptcha={executeRecaptcha ?? undefined}
            focusEmailKey={focusEmailKey}
        />
    )
}

function SignUpForm({ focusEmailKey }: { focusEmailKey: number }) {
    const siteKey = getRecaptchaSiteKey()
    const [countries, setCountries] = useState<Country[] | null>(null)

    useEffect(() => {
        let cancelled = false
        void fetchCountries().then((result) => {
            if (!cancelled) setCountries(result)
        })
        return () => {
            cancelled = true
        }
    }, [])

    if (!countries) {
        return <p className="text-center text-sm text-muted-foreground">Loading…</p>
    }

    if (countries.length === 0) {
        return (
            <p className="text-center text-sm text-muted-foreground">
                Could not load registration form. Please try again later or{' '}
                <Link href="/registration" className="underline underline-offset-4">
                    register here
                </Link>
                .
            </p>
        )
    }

    if (!siteKey) {
        return <SignUpPanelFields countries={countries} recaptchaConfigured={false} focusEmailKey={focusEmailKey} />
    }

    return (
        <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
            <SignUpPanelWithRecaptcha countries={countries} focusEmailKey={focusEmailKey} />
        </GoogleReCaptchaProvider>
    )
}

function SignUpPanel({ focusEmailKey }: { focusEmailKey: number }) {
    return <SignUpForm focusEmailKey={focusEmailKey} />
}

type SignInBlockProps = {
    activeTab: AccountTabId
    onActiveTabChange: (tab: AccountTabId) => void
    focusEmailKey?: number
}

export function SignInBlock({ activeTab, onActiveTabChange, focusEmailKey = 0 }: SignInBlockProps) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-account" aria-label="Account" className="scroll-mt-14">
            <div className="w-full px-6">
                <motion.div
                    className="relative flex flex-col gap-6 overflow-hidden rounded-xl border bg-primary/5 px-2 pt-2 pb-8"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-brand/15 blur-2xl"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -bottom-10 -left-6 size-36 rounded-full bg-primary/10 blur-2xl"
                    />

                    <AnimatedTabs
                        activeTab={activeTab}
                        className="relative w-full"
                        layoutId={ACCOUNT_TABS_LAYOUT_ID}
                        onChange={(tabId) => onActiveTabChange(tabId as AccountTabId)}
                        tabs={TABS}
                        variant="underline"
                    />

                    <div
                        aria-labelledby={`${ACCOUNT_TABS_LAYOUT_ID}-tab-${activeTab}`}
                        id={`${ACCOUNT_TABS_LAYOUT_ID}-panel-${activeTab}`}
                        role="tabpanel"
                        className="relative pt-2"
                    >
                        {activeTab === 'signin' ? <SignInPanel focusEmailKey={focusEmailKey} /> : null}
                        {activeTab === 'signup' ? <SignUpPanel focusEmailKey={focusEmailKey} /> : null}
                        {activeTab === 'reset' ? <ResetPasswordPanel /> : null}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
