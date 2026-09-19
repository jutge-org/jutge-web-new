'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { PasswordResetConfirmForm } from '@/components/password-reset/PasswordResetConfirmForm'
import { parsePasswordResetToken } from '@/lib/data/passwordResetActions'

export default function PasswordResetConfirmPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const params = useParams<{ token: string }>()
    const token = typeof params.token === 'string' ? params.token : ''
    const parsed = parsePasswordResetToken(decodeURIComponent(token))

    useEffect(() => {
        if (!loading && user) {
            router.replace('/')
        }
    }, [loading, user, router])

    if (loading || user) {
        return <PageSpinner />
    }

    if (!parsed) {
        return (
            <div className="flex flex-1 flex-col gap-6">
                <MainBreadcrumbs breadcrumbs={[{ title: 'Password reset', url: '/password-reset' }]} />
                <PageTitle section="/password-reset" authenticated={false} hidden={false} />
                <p className="text-muted-foreground">
                    This password reset link is invalid or incomplete.{' '}
                    <Link
                        href="/password-reset"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                        Request a new reset
                    </Link>
                    .
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Password reset', url: '/password-reset' }]} />
            <PageTitle
                section="/password-reset"
                authenticated={false}
                hidden={false}
                description="Choose a new password for your Jutge.org account."
            />
            <PasswordResetConfirmForm email={parsed.email} code={parsed.code} />
        </div>
    )
}
