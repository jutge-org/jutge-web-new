'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/AuthProvider'
import { SmoothDialogContent } from '@/components/smoothui/dialog/animated-content'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogInIcon } from 'lucide-react'
import Link from 'next/link'

export type SignInDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSignedIn?: () => void
    /** Called when the dialog is closed without a successful sign-in. */
    onDismiss?: () => void
    /** Prefills the email field when the dialog opens. */
    initialEmail?: string
}

export function SignInDialog({ open, onOpenChange, onSignedIn, onDismiss, initialEmail }: SignInDialogProps) {
    const router = useRouter()
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const signedInRef = useRef(false)

    useEffect(() => {
        if (open && initialEmail) {
            setEmail(initialEmail)
        }
    }, [open, initialEmail])

    function resetForm() {
        setEmail('')
        setPassword('')
        setErrorMessage(null)
    }

    function handleOpenChange(next: boolean) {
        if (!next && !signedInRef.current) {
            onDismiss?.()
        }
        onOpenChange(next)
        if (!next) {
            signedInRef.current = false
            resetForm()
        }
    }

    function handleResetPassword() {
        handleOpenChange(false)
        router.push('/password-reset')
    }

    function handleSignIn() {
        setErrorMessage(null)
        startTransition(async () => {
            const result = await login({ email: email.trim(), password })
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }
            signedInRef.current = true
            toast.success(`Signed in as ${result.userName}`)
            resetForm()
            handleOpenChange(false)
            onSignedIn?.()
        })
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <SmoothDialogContent className="sm:max-w-sm rounded-xl p-6">
                <DialogHeader>
                    <DialogTitle>Sign in</DialogTitle>
                    <DialogDescription className="">Sign in with your Jutge.org email and password.</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="grid gap-1.5 mt-4">
                        <Label htmlFor="jutge-auth-email">Email</Label>
                        <Input
                            id="jutge-auth-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-invalid={errorMessage ? true : undefined}
                            aria-describedby={errorMessage ? 'jutge-auth-error' : undefined}
                        />
                    </div>
                    {/* The link renders in the label row but sits after the input in DOM order,
                        so Tab goes email → password → forgotten password. */}
                    <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5">
                        <Label htmlFor="jutge-auth-password">Password</Label>
                        <Input
                            id="jutge-auth-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            className="col-span-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSignIn()
                            }}
                            aria-invalid={errorMessage ? true : undefined}
                            aria-describedby={errorMessage ? 'jutge-auth-error' : undefined}
                        />
                        <Link
                            href="/password-reset"
                            className="col-start-2 row-start-1 flex items-center gap-2 text-xs text-muted-foreground hover:underline"
                            onClick={(e) => {
                                e.preventDefault()
                                handleResetPassword()
                            }}
                        >
                            Forgotten password?
                        </Link>
                    </div>
                    {errorMessage ? (
                        <p id="jutge-auth-error" role="alert" className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    ) : null}
                </div>

                <SmoothButton
                    type="button"
                    color="accent"
                    variant="candy"
                    onClick={handleSignIn}
                    disabled={pending}
                    className="mt-6 w-full"
                >
                    <LogInIcon className="size-4" aria-hidden />
                    {pending ? 'Signing in…' : 'Sign in'}
                </SmoothButton>
            </SmoothDialogContent>
        </Dialog>
    )
}
