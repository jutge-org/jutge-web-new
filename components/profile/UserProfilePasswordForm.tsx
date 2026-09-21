'use client'

import { KeyRoundIcon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { updateProfilePasswordAction } from '@/lib/data/profileActions'

export function UserProfilePasswordForm() {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const canSave =
        oldPassword.length > 0 &&
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword &&
        !pending

    function handleSave() {
        setErrorMessage(null)

        if (!oldPassword || !newPassword) {
            setErrorMessage('Current and new password are required.')
            return
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('New passwords do not match.')
            return
        }

        startTransition(async () => {
            const result = await updateProfilePasswordAction({
                oldPassword,
                newPassword,
            })

            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            toast.success('Password updated.')
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
        })
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex justify-center rounded-xl border border-border bg-card shadow-xs">
                <form
                    className="mb-3 w-full max-w-3xl"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (canSave) handleSave()
                    }}
                >
                    <div className="grid gap-3 px-6 pt-8 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <div className="hidden sm:block" />
                        <div className="min-w-0 space-y-3 text-sm text-muted-foreground">
                            <p>
                                Enter your current password and choose a new one for your Jutge.org account.
                            </p>
                            <p>
                                <span className="font-bold text-foreground">Important:</span> Password must be at
                                least 12 characters long and contain at least one uppercase letter, one lowercase
                                letter, one digit, and one special character.
                            </p>
                            <p>
                                For your own security, choose a strong password and do not use the same password on
                                other websites.
                            </p>
                        </div>
                    </div>

                    <dl className="px-6 py-4">
                        <ProfileFormRow label="Current password" htmlFor="profile-old-password">
                            <Input
                                id="profile-old-password"
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Your current password"
                                autoComplete="current-password"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="New password" htmlFor="profile-new-password">
                            <Input
                                id="profile-new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Your new password"
                                autoComplete="new-password"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Confirm password" htmlFor="profile-confirm-password">
                            <Input
                                id="profile-confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat your new password"
                                autoComplete="new-password"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <div className="grid gap-3 pt-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
                            <div className="hidden sm:block" />
                            <div className="mt-4 flex min-w-0 flex-col gap-3">
                                {errorMessage ? (
                                    <p role="alert" className="text-sm text-destructive">
                                        {errorMessage}
                                    </p>
                                ) : null}
                                <SmoothButton
                                    type="submit"
                                    color="accent"
                                    variant="candy"
                                    disabled={!canSave}
                                    loading={pending}
                                    className="w-full gap-2"
                                    prefix={<KeyRoundIcon className="size-4" aria-hidden />}
                                >
                                    {pending ? 'Changing password…' : 'Change password'}
                                </SmoothButton>
                            </div>
                        </div>
                    </dl>
                </form>
            </section>
        </div>
    )
}
