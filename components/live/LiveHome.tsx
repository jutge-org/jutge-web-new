'use client'

import { EyeIcon, RefreshCwIcon, SwordsIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isMotionReduced } from '@/lib/reducedMotion'
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

    return <ExamHome />
}

function ExamHome() {
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)

    return (
        <LivePage>
            <div className="flex justify-center">
                <Image
                    alt="Exam on Jutge.org"
                    className={cn('h-auto w-96 max-w-full', !motionReduced && 'hover:animate-pulse')}
                    height={384}
                    priority
                    src="/jutge/exam.png"
                    width={384}
                />
            </div>
            <Card className="w-full border border-border shadow-sm ring-0">
                <CardContent className="flex justify-center p-5">
                    <div className="flex w-full max-w-md flex-col gap-4">
                        <LiveSignIn contest={false} polished className="w-full text-left" />
                    </div>
                </CardContent>
            </Card>
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

function LiveSignIn({
    contest,
    polished = false,
    className,
}: {
    contest: boolean
    polished?: boolean
    className?: string
}) {
    const arenaStyle = contest || polished
    const session = useLiveSession()
    const router = useRouter()
    const inPreExam = session.phase === 'pre-exam'
    const readyExams = inPreExam ? session.readyExams : null

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [examKey, setExamKey] = useState('')
    const [examPassword, setExamPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    useEffect(() => {
        if (session.email && inPreExam) {
            setEmail(session.email)
        }
    }, [session.email, inPreExam])

    useEffect(() => {
        if (!readyExams?.length) return
        setExamKey((current) => {
            if (current && readyExams.some((exam) => exam.exam_key === current)) return current
            return readyExams[0]?.exam_key ?? ''
        })
    }, [readyExams])

    async function continueToExams() {
        setError(null)
        setPending(true)
        const result = await session.continueSignIn({ email: email.trim(), password }, contest)
        setPending(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        setExamKey(result.exams[0]?.exam_key ?? '')
        setPassword('')
    }

    async function enterExam() {
        setError(null)
        setPending(true)
        const result = await session.enterExam({ exam: examKey, exam_password: examPassword })
        setPending(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        router.replace('/dashboard')
    }

    async function reloadExams() {
        setError(null)
        setPending(true)
        const result = await session.reloadReadyExams(contest)
        setPending(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        setExamKey(result.exams[0]?.exam_key ?? '')
    }

    function handleBack() {
        session.cancelPreExam()
        setExamPassword('')
        setError(null)
    }

    return (
        <>
            {error ? <LiveNotice>{error}</LiveNotice> : null}
            {session.error ? <LiveNotice>{session.error}</LiveNotice> : null}
            <form
                className={cn('flex flex-col gap-4', className)}
                onSubmit={(event) => {
                    event.preventDefault()
                    if (inPreExam) void enterExam()
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
                        disabled={inPreExam || pending}
                    />
                </div>
                {!inPreExam ? (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="live-password">Password</Label>
                        <Input
                            id="live-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            disabled={pending}
                        />
                    </div>
                ) : null}
                {inPreExam && readyExams ? (
                    <>
                        <div className="flex flex-col gap-2">
                            <ExamPickerHeader className="flex items-center justify-between gap-2">
                                <Label htmlFor="live-exam" className="mb-0">
                                    {contest ? 'Contest' : 'Exam'}
                                </Label>
                                <ReloadReadyExamsButton
                                    contest={contest}
                                    disabled={pending}
                                    onReload={() => void reloadExams()}
                                />
                            </ExamPickerHeader>
                            <select
                                id="live-exam"
                                className={liveFieldClassName}
                                value={examKey}
                                onChange={(event) => setExamKey(event.target.value)}
                                required
                            >
                                {readyExams.map((exam) => (
                                    <option key={exam.exam_key} value={exam.exam_key}>
                                        {exam.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="live-exam-key-manual">
                                {contest ? 'Contest' : 'Exam'} key (optional)
                            </Label>
                            <Input
                                id="live-exam-key-manual"
                                type="text"
                                autoComplete="off"
                                value={examKey}
                                onChange={(event) => setExamKey(event.target.value)}
                                placeholder="Use a custom key if needed"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="live-exam-password">
                                {contest ? 'Contest' : 'Exam'} password
                            </Label>
                            <Input
                                id="live-exam-password"
                                type="password"
                                autoComplete="off"
                                value={examPassword}
                                onChange={(event) => setExamPassword(event.target.value)}
                                required
                            />
                        </div>
                    </>
                ) : null}
                <div
                    className={cn(
                        'flex gap-2',
                        arenaStyle && 'mt-2',
                        arenaStyle && !inPreExam ? 'w-full' : 'justify-center',
                    )}
                >
                    {arenaStyle ? (
                        <SmoothButton
                            className={inPreExam ? undefined : 'w-full'}
                            color="blue"
                            loading={pending}
                            type="submit"
                            variant="candy"
                        >
                            {inPreExam ? (contest ? 'Enter contest' : 'Enter exam') : 'Continue'}
                        </SmoothButton>
                    ) : (
                        <Button type="submit" disabled={pending}>
                            {pending
                                ? 'Please wait…'
                                : inPreExam
                                  ? contest
                                      ? 'Enter contest'
                                      : 'Enter exam'
                                  : 'Continue'}
                        </Button>
                    )}
                    {inPreExam ? (
                        arenaStyle ? (
                            <SmoothButton
                                color="blue"
                                disabled={pending}
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                            >
                                Cancel
                            </SmoothButton>
                        ) : (
                            <Button type="button" variant="outline" disabled={pending} onClick={handleBack}>
                                Cancel
                            </Button>
                        )
                    ) : null}
                </div>
            </form>
        </>
    )
}

function ExamPickerHeader({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={className}>{children}</div>
}

function ReloadReadyExamsButton({
    contest,
    disabled,
    onReload,
}: {
    contest: boolean
    disabled: boolean
    onReload: () => void
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label={`Reload ${contest ? 'contests' : 'exams'}`}
                    onClick={onReload}
                >
                    <RefreshCwIcon aria-hidden className="size-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Reload list</TooltipContent>
        </Tooltip>
    )
}