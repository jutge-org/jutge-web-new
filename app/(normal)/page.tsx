'use client'

import { HomePageGuest } from '@/components/home/HomePageGuest'
import { HomePageUser } from '@/components/general/HomePageUser'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
    const { user } = useAuth()

    if (user) {
        return <HomePageUser user={user} />
    }

    return <HomePageGuest />
}
