'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { LiveNotice } from '@/components/live/LiveChrome'
import { SignInDialog } from '@/components/SignInDialog'
import { useSiteMode } from '@/components/SiteModeProvider'

export function LoginGate() {
    const site = useSiteMode()
    if (site.kind !== 'normal') {
        return (
            <LiveNotice>
                <Link href="/">Sign in</Link> to view this page.
            </LiveNotice>
        )
    }
    return <NormalLoginGate />
}

function NormalLoginGate() {
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = useState(true)

    return (
        <>
            <p className="py-16 text-center text-muted-foreground">Sign in to view this page.</p>
            <SignInDialog
                open={open}
                onOpenChange={setOpen}
                onDismiss={() => {
                    toast.info('Sign in required to view this page')
                    router.push('/')
                }}
                onSignedIn={() => {
                    window.location.assign(pathname)
                }}
            />
        </>
    )
}
