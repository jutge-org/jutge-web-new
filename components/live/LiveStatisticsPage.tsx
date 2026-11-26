'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { ExamStatisticsView } from '@/components/instructor/exams/ExamStatisticsView'
import { LiveNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'

export function LiveStatisticsPage() {
    const session = useLiveSession()
    const { profile } = useAuth()
    const live = useMemo(
        () =>
            session.role === 'tutor'
                ? {
                      examKey: session.examKey,
                      instructor: session.instructor,
                      tutorStatus: session.tutorStatus,
                  }
                : undefined,
        [session.examKey, session.instructor, session.role, session.tutorStatus],
    )

    if (session.loading) return <LiveSpinner />
    if (session.role !== 'tutor') {
        return (
            <LivePage>
                <LiveNotice>
                    {session.authenticated ? 'Statistics are for tutors.' : <Link href="/">Sign in</Link>}
                </LiveNotice>
            </LivePage>
        )
    }
    if (!profile) return <LiveSpinner />

    return (
        <LivePage>
            <ExamStatisticsView profile={profile} live={live} />
        </LivePage>
    )
}