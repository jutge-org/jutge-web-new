'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { LiveStudentsPage } from '@/components/live/LiveStudentsPage'
import { LiveSpinner } from '@/components/live/LiveChrome'
import { useSiteMode } from '@/components/SiteModeProvider'

export default function StudentsPage() {
    const { kind } = useSiteMode()
    const router = useRouter()

    useEffect(() => {
        if (kind === 'exam') {
            router.replace('/participants')
        }
    }, [kind, router])

    if (kind === 'exam') {
        return <LiveSpinner />
    }

    return <LiveStudentsPage />
}