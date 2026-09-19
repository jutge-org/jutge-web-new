'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { RegistrationForm } from '@/components/registration/RegistrationForm'
import { fetchCountries } from '@/lib/data/tables'
import type { Country } from '@/lib/jutge_api_client'

export default function RegistrationPage() {
    return (
        <Suspense fallback={<PageSpinner />}>
            <RegistrationPageContent />
        </Suspense>
    )
}

function RegistrationPageContent() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialEmail = searchParams.get('user_mail')?.trim() ?? ''
    const [countries, setCountries] = useState<Country[] | null>(null)

    useEffect(() => {
        if (!loading && user) {
            router.replace('/')
        }
    }, [loading, user, router])

    useEffect(() => {
        if (loading || user) return
        void fetchCountries().then(setCountries)
    }, [loading, user])

    if (loading || user) {
        return <PageSpinner />
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <MainBreadcrumbs breadcrumbs={[{ title: 'Sign up', url: '/sign-up' }]} />
            <PageTitle section="/sign-up" authenticated={false} hidden={false} />
            <RegistrationForm countries={countries} initialEmail={initialEmail} />
        </div>
    )
}
