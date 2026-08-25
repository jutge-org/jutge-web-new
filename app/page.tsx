'use client'

import { HomePageGuest } from '@/components/home/HomePageGuest'
import { HomePageUser } from '@/components/general/HomePageUser'
import { PageSpinner } from '@/components/ClientGates'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
    const { user, loading } = useAuth()

    if (loading) {
        return <PageSpinner />
    }

    if (user) {
        return <HomePageUser user={user} />
    }

    return <HomePageGuest />
}
