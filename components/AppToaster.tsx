'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { toast, Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'

import { consumeFlashToast } from '@/lib/flashToast'

export function AppToaster({ ...props }: ToasterProps) {
    const { resolvedTheme } = useTheme()
    const invertedTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    useEffect(() => {
        const flash = consumeFlashToast()
        if (!flash) return
        if (flash.type === 'success') toast.success(flash.message)
        else if (flash.type === 'info') toast.info(flash.message)
        else toast.error(flash.message)
    }, [])

    return (
        <Sonner
            theme={invertedTheme}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <TriangleAlertIcon className="size-4" />,
                error: <OctagonXIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            style={
                {
                    '--normal-bg': 'var(--toast-bg)',
                    '--normal-text': 'var(--toast-fg)',
                    '--normal-border': 'var(--toast-border)',
                    '--border-radius': 'var(--radius)',
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: 'cn-toast shadow-xl',
                },
            }}
            {...props}
        />
    )
}
