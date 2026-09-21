'use client'

import MDEditor from '@uiw/react-md-editor'
import { UserPenIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateProfileAction } from '@/lib/data/profileActions'
import type { Country, Profile } from '@/lib/jutge_api_client'

type UserProfileEditFormProps = {
    profile: Profile
    countries: Country[]
}

export function UserProfileEditForm({ profile, countries }: UserProfileEditFormProps) {
    const router = useRouter()
    const [name, setName] = useState(profile.name)
    const [nickname, setNickname] = useState(profile.nickname ?? '')
    const [affiliation, setAffiliation] = useState(profile.affiliation ?? '')
    const [description, setDescription] = useState(profile.description ?? '')
    const [webpage, setWebpage] = useState(profile.webpage ?? '')
    const [birthYear, setBirthYear] = useState(profile.birth_year?.toString() ?? '')
    const [countryId, setCountryId] = useState(profile.country_id ?? '')
    const [timezoneId, setTimezoneId] = useState(profile.timezone_id)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    function handleSave() {
        setErrorMessage(null)

        const parsedBirthYear = birthYear.trim() === '' ? 0 : Number.parseInt(birthYear, 10)
        if (birthYear.trim() !== '' && Number.isNaN(parsedBirthYear)) {
            setErrorMessage('Birth year must be a valid number.')
            return
        }

        startTransition(async () => {
            const result = await updateProfileAction({
                name,
                nickname,
                affiliation,
                description,
                webpage,
                birth_year: parsedBirthYear,
                country_id: countryId,
                timezone_id: timezoneId,
                compiler_id: profile.compiler_id,
                language_id: profile.language_id,
            })

            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            toast.success('Profile saved.')
            router.refresh()
        })
    }

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex justify-center rounded-xl border border-border bg-card shadow-xs">
                <form
                    className="mb-3 w-full max-w-3xl"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (!pending) handleSave()
                    }}
                >
                    <dl className="px-6 py-4">
                        <ProfileFormRow label="Name" htmlFor="profile-name">
                            <Input
                                id="profile-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                className="w-full"
                                aria-invalid={errorMessage && !name.trim() ? true : undefined}
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Nickname" htmlFor="profile-nickname">
                            <Input
                                id="profile-nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                autoComplete="nickname"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Affiliation" htmlFor="profile-affiliation">
                            <Input
                                id="profile-affiliation"
                                value={affiliation}
                                onChange={(e) => setAffiliation(e.target.value)}
                                placeholder="University or organization"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Country" htmlFor="profile-country">
                            <Select value={countryId || undefined} onValueChange={setCountryId}>
                                <SelectTrigger id="profile-country" className="w-full">
                                    <SelectValue placeholder="Select a country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem key={country.country_id} value={country.country_id}>
                                            {country.eng_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </ProfileFormRow>

                        <ProfileFormRow label="Birth year" htmlFor="profile-birth-year">
                            <Input
                                id="profile-birth-year"
                                type="number"
                                inputMode="numeric"
                                min={1900}
                                max={new Date().getFullYear()}
                                value={birthYear}
                                onChange={(e) => setBirthYear(e.target.value)}
                                placeholder="Optional"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Timezone" htmlFor="profile-timezone">
                            <Input
                                id="profile-timezone"
                                value={timezoneId}
                                onChange={(e) => setTimezoneId(e.target.value)}
                                placeholder="Europe/Madrid"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Web page" htmlFor="profile-webpage">
                            <Input
                                id="profile-webpage"
                                type="url"
                                value={webpage}
                                onChange={(e) => setWebpage(e.target.value)}
                                placeholder="https://"
                                autoComplete="url"
                                className="w-full"
                            />
                        </ProfileFormRow>

                        <ProfileFormRow label="Description" htmlFor="profile-description" alignStart>
                            <MDEditor
                                className="mx-px"
                                height={200}
                                value={description}
                                onChange={(value) => setDescription(value ?? '')}
                                textareaProps={{
                                    id: 'profile-description',
                                    placeholder: 'A short bio about yourself',
                                }}
                                toolbarBottom
                            />
                        </ProfileFormRow>

                        <div className="grid gap-3 pt-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
                            <div className="hidden sm:block" />
                            <div className="mt-4 flex min-w-0 flex-col gap-3">
                                {errorMessage ? (
                                    <p role="alert" className="text-sm text-destructive">
                                        {errorMessage}
                                    </p>
                                ) : null}
                                <SmoothButton
                                    type="submit"
                                    color="accent"
                                    variant="candy"
                                    disabled={pending}
                                    loading={pending}
                                    className="w-full gap-2"
                                    prefix={<UserPenIcon className="size-4" aria-hidden />}
                                >
                                    {pending ? 'Updating profile…' : 'Update profile'}
                                </SmoothButton>
                            </div>
                        </div>
                    </dl>
                </form>
            </section>
        </div>
    )
}
