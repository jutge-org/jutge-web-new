'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AuthedGate, PageSpinner } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { ChangeEmailConfirmForm } from '@/components/profile/ChangeEmailConfirmForm'
import { parseChangeEmailToken } from '@/lib/data/changeEmailActions'

function tokenFromParams(token: string | string[] | undefined): string {
    if (typeof token === 'string') return token
    if (Array.isArray(token)) return token.join(':')
    return ''
}

function tokenFromLocation(): string {
    if (typeof window === 'undefined') return ''
    const marker = '/change-email/'
    const href = window.location.href
    const index = href.indexOf(marker)
    if (index < 0) return ''
    return href.slice(index + marker.length).split(/[?#]/)[0] ?? ''
}

export default function ChangeEmailConfirmPage() {
    const params = useParams<{ token: string }>()
    const paramToken = tokenFromParams(params.token)
    const [locationToken, setLocationToken] = useState('')
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setLocationToken(tokenFromLocation())
        setReady(true)
    }, [paramToken])

    const parsed = parseChangeEmailToken(paramToken) ?? (locationToken ? parseChangeEmailToken(locationToken) : null)

    if (!ready && !parsed) {
        return (
            <AuthedGate>
                <PageSpinner />
            </AuthedGate>
        )
    }

    if (!parsed) {
        return (
            <AuthedGate>
                <div className="flex flex-1 flex-col gap-6">
                    <MainBreadcrumbs
                        breadcrumbs={[
                            { title: 'Profile', url: '/profile' },
                            { title: 'Change email', url: '/profile/email' },
                        ]}
                    />
                    <PageTitle section="/change-email" authenticated hidden={false} />
                    <p className="text-muted-foreground">
                        This email change link is invalid or incomplete.{' '}
                        <Link
                            href="/profile/email"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                            Request a new email change
                        </Link>
                        .
                    </p>
                </div>
            </AuthedGate>
        )
    }

    return (
        <AuthedGate>
            <div className="flex flex-1 flex-col gap-6">
                <MainBreadcrumbs
                    breadcrumbs={[
                        { title: 'Profile', url: '/profile' },
                        { title: 'Change email', url: '/profile/email' },
                    ]}
                />
                <PageTitle
                    section="/change-email"
                    authenticated
                    hidden={false}
                    description="Confirm the email change for your Jutge.org account."
                />
                <ChangeEmailConfirmForm
                    oldEmail={parsed.old_email}
                    newEmail={parsed.new_email}
                    code={parsed.code}
                />
            </div>
        </AuthedGate>
    )
}
