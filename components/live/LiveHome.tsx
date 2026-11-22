'use client'

import { EyeIcon, SwordsIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ContestWatchForm } from '@/components/live/ContestWatchForm'
import { LiveNotice, LivePage, LiveSpinner, liveFieldClassName } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import AnimatedTabs from '@/components/smoothui/animated-tabs'
import SmoothButton from '@/components/smoothui/smooth-button'
import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchReadyExams, filterReadyExams, liveErrorMessage } from '@/lib/data/liveExam'
import { isMotionReduced } from '@/lib/reducedMotion'
import type { ReadyExam } from '@/lib/jutge_api_client'
import { siteBrand } from '@/lib/siteMode'
import { cn } from '@/lib/utils'

const CONTEST_TABS_LAYOUT_ID = 'contest-home-tabs'

const CONTEST_TABS = [
    { id: 'arena', label: 'Player arena', icon: <SwordsIcon aria-hidden className="size-4" /> },
    { id: 'lounge', label: 'Spectator lounge', icon: <EyeIcon aria-hidden className="size-4" /> },
]

type ContestTabId = 'arena' | 'lounge'

export function LiveHome() {
    const site = useSiteMode()
    const session = useLiveSession()
    const router = useRouter()
    const contest = site.kind === 'contest'

    useEffect(() => {
        if (!session.loading && session.authenticated) {
            router.replace('/dashboard')
        }
    }, [session.loading, session.authenticated, router])

    if (session.loading || session.authenticated) return <LiveSpinner />
    if (contest) return <ContestHome />

    return (
        <LivePage title={siteBrand('exam')}>
            <p className="text-muted-foreground">Sign in with your Jutge account to enter an exam.</p>
            <LiveSignIn contest={false} />
        </LivePage>
    )
}

function ContestHome() {
    const [tab, setTab] = useState<ContestTabId>('arena')
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)

    return (
        <LivePage>
            <div className="flex justify-center">
                <Image
                    alt="Contest on Jutge.org"
                    className={cn('h-auto w-96 max-w-full', !motionReduced && 'hover:animate-pulse')}
                    height={384}
                    priority
                    src="/jutge/contest.png"
                    width={384}
                />
            </div>
            <AnimatedTabs
                activeTab={tab}
                className="flex w-full"
                layoutId={CONTEST_TABS_LAYOUT_ID}
                onChange={(tabId) => setTab(tabId as ContestTabId)}
                tabs={CONTEST_TABS}
                variant="segment"
            />
            <div
                aria-labelledby={`${CONTEST_TABS_LAYOUT_ID}-tab-arena`}
                className="w-full"
                hidden={tab !== 'arena'}
                id={`${CONTEST_TABS_LAYOUT_ID}-panel-arena`}
                role="tabpanel"
            >
                <Card className="w-full border border-border shadow-sm ring-0">
                    <CardContent className="flex justify-center p-5">
                        <div className="flex w-full max-w-md flex-col gap-4">
                            <LiveSignIn contest className="w-full text-left" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div
                aria-labelledby={`${CONTEST_TABS_LAYOUT_ID}-tab-lounge`}
                className="w-full"
                hidden={tab !== 'lounge'}
                id={`${CONTEST_TABS_LAYOUT_ID}-panel-lounge`}
                role="tabpanel"
            >
                <Card className="w-full border border-border shadow-sm ring-0">
                    <CardContent className="flex justify-center p-5">
                        <ContestWatchForm className="w-full max-w-md" />
                    </CardContent>
                </Card>
            </div>
        </LivePage>
    )
}

function LiveSignIn({ contest, className }: { contest: boolean; className?: string }) {
    const session = useLiveSession()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [exams, setExams] = useState<ReadyExam[] | null>(null)
    const [examKey, setExamKey] = useState('')
    const [examPassword, setExamPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    async function continueToExams() {
        setError(null)
        setPending(true)
        try {
            const ready = await fetchReadyExams(email.trim(), password)
            const filtered = filterReadyExams(ready, contest)
            if (filtered.length === 0) {
                setExams(null)
                setError(contest ? 'No contest is ready for this account.' : 'No exam is ready for this account.')
                return
            }
            setExams(filtered)
            setExamKey(filtered[0]?.exam_key ?? '')
        } catch (loadError) {
            setError(liveErrorMessage(loadError, 'Could not look up exams.'))
        } finally {
            setPending(false)
        }
    }

    async function enterExam() {
        setError(null)
        setPending(true)
        const result = await session.login({
            email: email.trim(),
            password,
            exam: examKey,
            exam_password: examPassword,
        })
        setPending(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        router.replace('/dashboard')
    }

    return (
        <>
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
            <form
                className={cn('flex flex-col gap-4', className)}
                onSubmit={(event) => {
                    event.preventDefault()
                    if (exams) void enterExam()
                    else void continueToExams()
                }}
            >
                <div className="flex flex-col gap-2">
                    <Label htmlFor="live-email">Email</Label>
                    <Input
                        id="live-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={exams !== null || pending}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="live-password">Password</Label>
                    <Input
                        id="live-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={exams !== null || pending}
                    />
                </div>
                {exams ? (
                    <>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="live-exam">{contest ? 'Contest' : 'Exam'}</Label>
                            <select
                                id="live-exam"
                                className={liveFieldClassName}
                                value={examKey}
                                onChange={(event) => setExamKey(event.target.value)}
                            >
                                {exams.map((exam) => (
                                    <option key={exam.exam_key} value={exam.exam_key}>
                                        {exam.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="live-exam-password">Exam password</Label>
                            <Input
                                id="live-exam-password"
                                type="password"
                                autoComplete="off"
                                value={examPassword}
                                onChange={(event) => setExamPassword(event.target.value)}
                            />
                        </div>
                    </>
                ) : null}
                <div
                    className={cn(
                        'flex gap-2',
                        contest && 'mt-2',
                        contest && !exams ? 'w-full' : 'justify-center',
                    )}
                >
                    {contest ? (
                        <SmoothButton
                            className={exams ? undefined : 'w-full'}
                            color="blue"
                            loading={pending}
                            type="submit"
                            variant="candy"
                        >
                            {exams ? 'Enter' : 'Continue'}
                        </SmoothButton>
                    ) : (
                        <Button type="submit" disabled={pending}>
                            {pending ? 'Please wait…' : exams ? 'Enter' : 'Continue'}
                        </Button>
                    )}
                    {exams ? (
                        contest ? (
                            <SmoothButton
                                color="blue"
                                disabled={pending}
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setExams(null)
                                    setExamPassword('')
                                    setError(null)
                                }}
                            >
                                Back
                            </SmoothButton>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setExams(null)
                                    setExamPassword('')
                                    setError(null)
                                }}
                            >
                                Back
                            </Button>
                        )
                    ) : null}
                </div>
            </form>
        </>
    )
}
