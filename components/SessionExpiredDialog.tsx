'use client'

import { useEffect, useState } from 'react'

import SmoothButton from '@/components/smoothui/smooth-button'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { RefreshCwIcon } from 'lucide-react'

type SessionExpiredDialogProps = {
    open: boolean
}

export function SessionExpiredDialog({ open }: SessionExpiredDialogProps) {
    const [reloadShortcut, setReloadShortcut] = useState('Ctrl+R')

    useEffect(() => {
        const isApplePlatform =
            typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
        setReloadShortcut(isApplePlatform ? '⌘R' : 'Ctrl+R')
    }, [])

    return (
        <AlertDialog open={open}>
            <AlertDialogContent size="default">
                <AlertDialogHeader>
                    <AlertDialogMedia>
                        <RefreshCwIcon aria-hidden />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Session expired</AlertDialogTitle>
                    <AlertDialogDescription className="text-balance">
                        Your sign-in has expired. Reload the page to sign in again{' '}
                        <KbdGroup className="inline-flex align-middle">
                            <Kbd>{reloadShortcut}</Kbd>
                        </KbdGroup>
                        .
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <SmoothButton type="button" onClick={() => window.location.reload()}>
                        Reload page
                    </SmoothButton>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
