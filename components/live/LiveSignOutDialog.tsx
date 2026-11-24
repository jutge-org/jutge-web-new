'use client'

import { CircleCheckIcon, FlagIcon, LogOutIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { SmoothDialogContent } from '@/components/smoothui/dialog/animated-content'
import SmoothButton from '@/components/smoothui/smooth-button'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { liveErrorMessage } from '@/lib/data/liveExam'

export type LiveStudentDialogIntent = 'sign-out' | 'finish'

export function LiveSignOutDialog({
    open,
    onOpenChange,
    intent,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    intent: LiveStudentDialogIntent
}) {
    const site = useSiteMode()
    const session = useLiveSession()
    const noun = site.kind === 'contest' ? 'contest' : 'exam'
    const [confirmed, setConfirmed] = useState(false)
    const [signOutPending, setSignOutPending] = useState(false)
    const [finishPending, setFinishPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const pending = signOutPending || finishPending
    const finish = intent === 'finish'

    useEffect(() => {
        if (!open) {
            setConfirmed(false)
            setSignOutPending(false)
            setFinishPending(false)
            setError(null)
        }
    }, [open])

    useEffect(() => {
        setConfirmed(false)
        setError(null)
    }, [intent])

    function handleOpenChange(next: boolean) {
        if (pending) return
        onOpenChange(next)
        if (!next) {
            setConfirmed(false)
            setError(null)
        }
    }

    async function handleSignOut() {
        if (!confirmed) {
            setConfirmed(true)
            setError(null)
            return
        }
        setSignOutPending(true)
        setError(null)
        onOpenChange(false)
        try {
            await session.logout()
        } catch (signOutError: unknown) {
            setError(liveErrorMessage(signOutError, 'Could not sign out.'))
            setSignOutPending(false)
            onOpenChange(true)
        }
    }

    async function handleFinish() {
        if (!confirmed) {
            setConfirmed(true)
            setError(null)
            return
        }
        setFinishPending(true)
        setError(null)
        try {
            await session.finishExamAndSignOut()
        } catch (finishError: unknown) {
            setError(liveErrorMessage(finishError, `Could not finish the ${noun}.`))
            setFinishPending(false)
            return
        }
        toast.success(`You have finished the ${noun}. You cannot sign in again.`)
        setConfirmed(false)
        setFinishPending(false)
        onOpenChange(false)
    }

    const title = finish ? `Finish ${noun}` : 'Sign out'
    const description = finish
        ? `Finishing closes your access to this ${noun}. You cannot sign in to this ${noun} again.`
        : 'Signing out ends this session only. You can sign in again later.'

    const actionLabel = finish
        ? finishPending
            ? 'Finishing…'
            : confirmed
              ? `Yes, finish ${noun}`
              : `Finish ${noun}`
        : signOutPending
          ? 'Signing out…'
          : confirmed
            ? 'Yes, sign out'
            : 'Sign out'

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <SmoothDialogContent className="flex flex-col gap-10 rounded-xl p-8 sm:max-w-sm">
                <DialogHeader className="gap-4 space-y-0">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {error ? (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                ) : null}
                <div className="flex flex-col gap-6">
                    <SmoothButton
                        type="button"
                        color={finish ? 'destructive' : 'blue'}
                        variant="candy"
                        className="w-full"
                        disabled={pending}
                        aria-live="polite"
                        onClick={() => void (finish ? handleFinish() : handleSignOut())}
                    >
                        {finish ? (
                            confirmed ? (
                                <CircleCheckIcon aria-hidden />
                            ) : (
                                <FlagIcon aria-hidden />
                            )
                        ) : (
                            <LogOutIcon aria-hidden />
                        )}
                        {actionLabel}
                    </SmoothButton>
                </div>
            </SmoothDialogContent>
        </Dialog>
    )
}