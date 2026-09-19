'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { AuthedGate } from '@/components/ClientGates'
import MainBreadcrumbs from '@/components/general/MainBreadcrumbs'
import { PageTitle } from '@/components/general/PageTitle'
import { UnregistrationConfirmForm } from '@/components/profile/UnregistrationConfirmForm'
import { parseUnregistrationToken } from '@/lib/data/unregistrationActions'

export default function UnregisterConfirmPage() {
    const params = useParams<{ token: string }>()
    const token = typeof params.token === 'string' ? params.token : ''
    const parsed = parseUnregistrationToken(decodeURIComponent(token))

    if (!parsed) {
        return (
            <AuthedGate>
                <div className="flex flex-1 flex-col gap-6">
                    <MainBreadcrumbs
                        breadcrumbs={[
                            { title: 'Profile', url: '/profile' },
                            { title: 'Unregistration', url: '/profile/unregistration' },
                        ]}
                    />
                    <PageTitle section="/unregistration" authenticated hidden={false} />
                    <p className="text-muted-foreground">
                        This unregistration link is invalid or incomplete.{' '}
                        <Link
                            href="/profile/unregistration"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                            Request a new unregistration
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
                        { title: 'Unregistration', url: '/profile/unregistration' },
                    ]}
                />
                <PageTitle
                    section="/unregistration"
                    authenticated
                    hidden={false}
                    description="Confirm permanent unregistration of your Jutge.org account."
                />
                <UnregistrationConfirmForm email={parsed.email} code={parsed.code} />
            </div>
        </AuthedGate>
    )
}
