'use client'

import { HomePageGuest } from '@/components/home/HomePageGuest'
import { HomePageUser } from '@/components/general/HomePageUser'
import { HeroBlock } from '@/components/home/HeroBlock'
import { useAuth } from '@/components/AuthProvider'
import { Spinner } from '@/components/ui/spinner'

export default function Home() {
    const { user, loading } = useAuth()

    if (loading) {
        return <div className="pt-6 flex flex-col items-center justify-center gap-16">
            <HeroBlock />
            <Spinner className="size-24 animate-spin" />
        </div>
    }

    if (user) {
        return <HomePageUser user={user} />
    } else {
        return <HomePageGuest />
    }
}
