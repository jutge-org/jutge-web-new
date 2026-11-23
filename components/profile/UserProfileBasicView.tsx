'use client'

import { useAuth } from '@/components/AuthProvider'
import { PageSpinner } from '@/components/ClientGates'
import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import { Input } from '@/components/ui/input'
import jutge from '@/lib/jutge'
import { useEffect, useState } from 'react'

function displayValue(value: string | null | undefined): string {
    const trimmed = value?.trim() ?? ''
    return trimmed === '' ? '—' : trimmed
}

export function UserProfileBasicView() {
    const { profile, loading } = useAuth()
    const [countryName, setCountryName] = useState<string | null>(null)

    useEffect(() => {
        const countryId = profile?.country_id
        if (!countryId) {
            setCountryName(null)
            return
        }
        let cancelled = false
        void jutge.tables.getCountries().then((countries) => {
            if (cancelled) return
            const match = countries[countryId]
            setCountryName(match?.eng_name ?? null)
        })
        return () => {
            cancelled = true
        }
    }, [profile?.country_id])

    if (loading || !profile) {
        return <PageSpinner />
    }

    const birthYear =
        profile.birth_year != null && profile.birth_year > 0 ? String(profile.birth_year) : '—'

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex justify-center rounded-xl border border-border bg-card shadow-xs">
                <dl className="mb-3 w-full max-w-3xl px-6 py-4">
                    <ProfileFormRow label="Email" htmlFor="profile-email">
                        <Input
                            id="profile-email"
                            type="email"
                            value={profile.email}
                            readOnly
                            tabIndex={-1}
                            className="w-full"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow label="Name" htmlFor="profile-name">
                        <Input
                            id="profile-name"
                            value={displayValue(profile.name)}
                            readOnly
                            tabIndex={-1}
                            className="w-full"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow label="Birth year" htmlFor="profile-birth-year">
                        <Input
                            id="profile-birth-year"
                            value={birthYear}
                            readOnly
                            tabIndex={-1}
                            className="w-full"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow label="Country" htmlFor="profile-country">
                        <Input
                            id="profile-country"
                            value={displayValue(countryName ?? profile.country_id)}
                            readOnly
                            tabIndex={-1}
                            className="w-full"
                        />
                    </ProfileFormRow>

                    <ProfileFormRow label="Timezone" htmlFor="profile-timezone">
                        <Input
                            id="profile-timezone"
                            value={displayValue(profile.timezone_id)}
                            readOnly
                            tabIndex={-1}
                            className="w-full"
                        />
                    </ProfileFormRow>
                </dl>
            </section>
        </div>
    )
}