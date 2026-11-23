'use client'

import { CircleCheckIcon, FlagIcon, LogOutIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useLiveSession } from '@/components/live/LiveSessionProvider'
import { SmoothDialogContent } from '@/components/smoothui/dialog/animated-content'
import SmoothButton from '@/components/smoothui/smooth-button'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { finishLiveExam, liveErrorMessage } from '@/lib/data/liveExam'

export function LiveSignOutDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const site = useSiteMode()
    const session = useLiveSession()
    const noun = site.kind === 'contest' ? 'contest' : 'exam'
    const [confirmFinish, setConfirmFinish] = useState(false)
    const [signOutPending, setSignOutPending] = useState(false)
    const [finishPending, setFinishPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const pending = signOutPending || finishPending

    useEffect(() => {
        if (!open) {
            setConfirmFinish(false)
            setSignOutPending(false)
            setFinishPending(false)
            setError(null)
        }
    }, [open])

    function handleOpenChange(next: boolean) {
        if (pending) return
        onOpenChange(next)
        if (!next) {
            setConfirmFinish(false)
            setError(null)
        }
    }

    async function handleSignOut() {
        setSignOutPending(true)
        setError(null)
        onOpenChange(false)
        try {
            await session.logout()
        } catch (signOutError: unknown) {
            setError(liveErrorMessage(signOutError, 'Could not sign out.'))
            setSignOutPending(false)
        }
    }

    async function handleFinish() {
        if (!confirmFinish) {
            setConfirmFinish(true)
            setError(null)
            return
        }
        setFinishPending(true)
        setError(null)
        try {
            await finishLiveExam()
        } catch (finishError: unknown) {
            setError(liveErrorMessage(finishError, `Could not finish the ${noun}.`))
            setFinishPending(false)
            return
        }
        toast.success(`You have finished the ${noun}. You cannot sign in again.`)
        setConfirmFinish(false)
        setFinishPending(false)
        onOpenChange(false)
        await session.refresh()
    }

    const finishLabel = finishPending ? 'Finishing…' : confirmFinish ? `Yes, finish ${noun}` : `Finish ${noun}`

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <SmoothDialogContent className="gap-6 rounded-xl p-6 sm:max-w-sm">
                <DialogHeader className="gap-3">
                    <DialogTitle>Sign out</DialogTitle>
                    <DialogDescription>
                        Sign out only ends this session. You can sign in again. Finish {noun} closes your access, so
                        you cannot sign in to this {noun} again.
                    </DialogDescription>
                </DialogHeader>
                {error ? (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                ) : null}
                <div className="flex flex-col gap-4">
                    <SmoothButton
                        type="button"
                        color="blue"
                        variant="candy"
                        className="w-full"
                        disabled={pending}
                        onClick={() => void handleSignOut()}
                    >
                        <LogOutIcon aria-hidden />
                        {signOutPending ? 'Signing out…' : 'Sign out'}
                    </SmoothButton>
                    <SmoothButton
                        type="button"
                        color="destructive"
                        variant="candy"
                        className="w-full"
                        disabled={pending}
                        aria-live="polite"
                        onClick={() => void handleFinish()}
                    >
                        {confirmFinish ? <CircleCheckIcon aria-hidden /> : <FlagIcon aria-hidden />}
                        {finishLabel}
                    </SmoothButton>
                </div>
            </SmoothDialogContent>
        </Dialog>
    )
}
