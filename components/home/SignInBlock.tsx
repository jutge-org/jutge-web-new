'use client'

import { useAuth } from '@/components/AuthProvider'
import AnimatedTabs from '@/components/smoothui/animated-tabs'
import SmoothButton from '@/components/smoothui/smooth-button'
import { cn } from '@/lib/utils'
import { UserPlusIcon, LogInIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from 'react'
import { toast } from 'sonner'
import validator from 'validator'

const TABS = [
    { id: 'signin', label: 'Sign in', icon: <LogInIcon className="size-4" aria-hidden /> },
    { id: 'signup', label: 'Sign up', icon: <UserPlusIcon className="size-4" aria-hidden /> },
]

export type AccountTabId = 'signin' | 'signup'

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
            <div className="flex items-baseline gap-3 -mt-2">
                <div className={labelClass} aria-hidden />
                <div className="min-w-0 flex-1 text-right -mt-2">
                    <Link
                        href="/password-reset"
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>
            </div>
            <div className="flex items-baseline gap-3">
                <div className={labelClass} aria-hidden />
                <SmoothButton
                    type="submit"
                    color="accent"
                    variant="candy"
                    disabled={!canSubmit}
                    className="min-w-0 flex-1 h-8 mt-0"
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

function SignUpPanel({ focusEmailKey }: { focusEmailKey: number }) {
    const router = useRouter()
    const formId = useId()
    const emailId = `${formId}-email`
    const errorId = `${formId}-error`

    const [email, setEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const canSubmit = validator.isEmail(email.trim())

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

        router.push(`/sign-up?user_mail=${encodeURIComponent(trimmed)}`)
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
                    <UserPlusIcon className="size-4" aria-hidden />
                    Sign up
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


type SignInBlockProps = {
    activeTab: AccountTabId
    onActiveTabChange: (tab: AccountTabId) => void
    focusEmailKey?: number
}

export function SignInBlock({ activeTab, onActiveTabChange, focusEmailKey = 0 }: SignInBlockProps) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <section id="home-account" aria-label="Account" className="scroll-mt-14">
            <div className="w-full px-0 sm:px-6">
                <motion.div
                    className="relative flex flex-col gap-6 overflow-hidden rounded-xl border bg-muted px-2 pt-2 pb-8 dark:bg-primary/5"
                    initial={false}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-8 -top-8 hidden size-40 rounded-full bg-brand/15 blur-2xl dark:block"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -bottom-10 -left-6 hidden size-36 rounded-full bg-primary/10 blur-2xl dark:block"
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
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
