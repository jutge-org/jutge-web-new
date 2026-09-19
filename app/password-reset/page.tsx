'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { PasswordResetForm } from '@/components/password-reset/PasswordResetForm'

export default function PasswordResetPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && user) {
            router.replace('/')
        }
    }, [loading, user, router])

    if (loading || user) {
        return <PageSpinner />
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Password reset', url: '/password-reset' }]} />
            <PageTitle section="/password-reset" authenticated={false} hidden={false} />
            <PasswordResetForm />
        </div>
    )
}
