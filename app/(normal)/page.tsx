'use client'

import dynamic from 'next/dynamic'

import { HomePageGuest } from '@/components/home/HomePageGuest'
import { HomePageUser } from '@/components/general/HomePageUser'
import { useAuth } from '@/components/AuthProvider'
import { useSiteMode } from '@/components/SiteModeProvider'

const LiveHome = dynamic(() => import('@/components/live/LiveHome').then((mod) => mod.LiveHome))

export default function Home() {
    const site = useSiteMode()
    if (site.kind !== 'normal') return <LiveHome />
    return <NormalHome />
}

function NormalHome() {
    const { user } = useAuth()

    if (user) {
        return <HomePageUser user={user} />
    }

    return <HomePageGuest />
}
