'use client'

import {
    CrownIcon,
    DoorOpenIcon,
    EyeIcon,
    GraduationCapIcon,
    LogInIcon,
    LogOutIcon,
    RefreshCwIcon,
    SwordsIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react'

import { LiveDashboard } from '@/components/live/LiveDashboard'
import { ApiStatusCard } from '@/components/live/ApiStatusCard'
import { ContestWatchForm } from '@/components/live/ContestWatchForm'
import { LiveErrorNotice, LivePage, LiveSpinner } from '@/components/live/LiveChrome'
import { useLiveSession } from '@/components/live/LiveSessionProvider'
import AnimatedTabs from '@/components/smoothui/animated-tabs'
import SmoothButton from '@/components/smoothui/smooth-button'
import { useAppearancePreferences } from '@/components/AppearancePreferencesProvider'
import { useSiteMode } from '@/components/SiteModeProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatLiveDateTime } from '@/lib/data/liveExam'
import type { ReadyExam } from '@/lib/jutge_api_client'
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

    if (session.loading) return <LiveSpinner />
    if (session.authenticated) return <LiveDashboard />
    if (contest) return <ContestHome />

    return <ExamHome />
}

function ExamHome() {
    const session = useLiveSession()
    const inPreExam = session.phase === 'pre-exam'

    return (
        <LivePage className={cn('min-h-0 flex-1', inPreExam && 'pt-24')}>
            {inPreExam ? null : <LiveArenaHeroImage contest={false} />}
            <LiveSignInCardShell contest={false} inPreExam={inPreExam}>
                <LiveSignIn contest={false} polished className="w-full text-left" />
            </LiveSignInCardShell>
            <ApiStatusCard className="mt-auto shrink-0" />
        </LivePage>
    )
}

function ContestHome() {
    const [tab, setTab] = useState<ContestTabId>('arena')
    const session = useLiveSession()
    const inPreExam = session.phase === 'pre-exam'
    const { reducedMotion } = useAppearancePreferences()
    const motionReduced = isMotionReduced(reducedMotion)

    if (inPreExam) {
        return (
            <LivePage className="min-h-0 flex-1 pt-24">
                <LiveSignInCardShell contest inPreExam>
                    <LiveSignIn contest polished className="w-full text-left" />
                </LiveSignInCardShell>
                <ApiStatusCard className="mt-auto shrink-0" />
            </LivePage>
        )
    }

    return (
        <LivePage className="min-h-0 flex-1">
            <LiveArenaHeroImage contest motionReduced={motionReduced} />
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
                <LiveSignInCardShell contest inPreExam={false}>
                    <LiveSignIn contest polished className="w-full text-left" />
                </LiveSignInCardShell>
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
            <ApiStatusCard className="mt-auto shrink-0" />
        </LivePage>
    )
}

function LiveArenaHeroImage({
    contest,
    motionReduced = false,
}: {
    contest: boolean
    motionReduced?: boolean
}) {
    return (
        <div className="flex justify-center">
            <Image
                alt={contest ? 'Contest on Jutge.org' : 'Exam on Jutge.org'}
                className={cn(
                    'h-auto w-96 max-w-full',
                    contest && !motionReduced && 'hover:animate-pulse',
                )}
                height={384}
                priority
                src={contest ? '/jutge/contest.png' : '/jutge/exam.png'}
                width={384}
            />
        </div>
    )
}

function LiveSignInCardShell({
    contest,
    inPreExam,
    children,
}: {
    contest: boolean
    inPreExam: boolean
    children: ReactNode
}) {
    const card = (
        <Card className="w-full border border-border shadow-sm ring-0">
            {inPreExam ? (
                <CardHeader className="border-b">
                    <CardTitle className="w-full justify-center text-center">
                        {contest ? 'Select contest' : 'Select exam'}
                    </CardTitle>
                </CardHeader>
            ) : null}
            <CardContent className="flex justify-center p-5">
                <div className="flex w-full max-w-md flex-col gap-4">{children}</div>
            </CardContent>
        </Card>
    )

    if (!inPreExam) return card

    return (
        <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
            <div className="flex shrink-0 justify-center">
                <Image
                    alt="Select an exam or contest on Jutge.org"
                    className="h-auto w-96 max-w-full"
                    height={384}
                    priority
                    src="/jutge/select-exam.png"
                    width={384}
                />
            </div>
            <div className="w-full md:max-w-md">{card}</div>
        </div>
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
    const enterLabel = contest ? 'Enter contest' : 'Enter exam'
    const session = useLiveSession()
    const router = useRouter()
    const inPreExam = session.phase === 'pre-exam'
    const readyExams = inPreExam ? session.readyExams : null

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [examKey, setExamKey] = useState('')
    const [examPassword, setExamPassword] = useState('0000')
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

    const selectedReadyExam = useMemo(
        () => readyExams?.find((exam) => exam.exam_key === examKey) ?? null,
        [readyExams, examKey],
    )
    const controllerEntry = selectedReadyExam?.role === 'controller'
    const participantEntry = selectedReadyExam?.role === 'participant'

    useEffect(() => {
        if (!inPreExam) return
        setExamPassword(controllerEntry ? '' : '0000')
    }, [controllerEntry, inPreExam])

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
        const result = await session.enterExam({
            exam: examKey,
            exam_password: controllerEntry ? '' : examPassword,
        })
        setPending(false)
        if (!result.ok) {
            setError(result.error)
            return
        }
        router.replace('/')
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
            {error ? <LiveErrorNotice>{error}</LiveErrorNotice> : null}
            {session.error ? <LiveErrorNotice>{session.error}</LiveErrorNotice> : null}
            <form
                className={cn('flex flex-col gap-4', className)}
                onSubmit={(event) => {
                    event.preventDefault()
                    if (inPreExam) void enterExam()
                    else void continueToExams()
                }}
            >
                <div className="flex flex-col gap-2">
                    {inPreExam ? (
                        <>
                            <p className="text-sm" id="live-greeting">
                                Welcome, &nbsp;
                                <span className="font-bold">{session.name ?? email}</span>.
                                <span className="ml-2 inline-flex items-center gap-0.5 text-muted-foreground">
                                    <LiveAccountRoleIcons
                                        administrator={session.administrator}
                                        instructor={session.instructor}
                                    />
                                </span>
                            </p>
                            <p className="text-sm" id="live-select-arena-hint">
                                Select your {contest ? 'contest' : 'exam'}
                                {participantEntry ? ' and enter its password' : ''}.
                            </p>
                        </>
                    ) : (
                        <>
                            <Label htmlFor="live-email">Email</Label>
                            <Input
                                id="live-email"
                                type="email"
                                autoComplete="username"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                disabled={pending}
                            />
                        </>
                    )}
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
                        <div className="mt-2 flex flex-col gap-2">
                            <div className="relative pr-8">
                                <Label htmlFor="live-exam">
                                    {contest ? 'Contest' : 'Exam'}
                                </Label>
                                <div className="absolute top-1/2 right-0 -translate-y-1/2">
                                    <ReloadReadyExamsButton
                                        contest={contest}
                                        disabled={pending}
                                        onReload={() => void reloadExams()}
                                    />
                                </div>
                            </div>
                            <Select value={examKey} onValueChange={setExamKey} disabled={pending}>
                                <SelectTrigger
                                    className="h-auto w-full min-h-16 items-center py-3 pl-2.5 *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:w-full *:data-[slot=select-value]:whitespace-normal"
                                    id="live-exam"
                                >
                                    <SelectValue placeholder={`Choose a ${contest ? 'contest' : 'exam'}`} />
                                </SelectTrigger>
                                <SelectContent className="p-0">
                                    {readyExams.map((exam, index) => (
                                        <Fragment key={exam.exam_key}>
                                            {index > 0 ? (
                                                <SelectSeparator className="mx-0 my-0" />
                                            ) : null}
                                            <SelectItem
                                                className="items-start rounded-none py-3 pr-8 pl-2.5"
                                                textValue={
                                                    exam.course_name
                                                        ? `${exam.title} ${exam.course_name}`
                                                        : exam.title
                                                }
                                                value={exam.exam_key}
                                            >
                                                <ReadyExamSelectOption exam={exam} />
                                            </SelectItem>
                                        </Fragment>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label
                                className={cn(controllerEntry && 'text-muted-foreground')}
                                htmlFor="live-exam-password"
                            >
                                {contest ? 'Contest' : 'Exam'} password
                            </Label>
                            <Input
                                id="live-exam-password"
                                type="text"
                                autoComplete="off"
                                placeholder={
                                    controllerEntry
                                        ? 'Not required for controllers'
                                        : 'Exam password'
                                }
                                value={examPassword}
                                onChange={(event) => setExamPassword(event.target.value)}
                                disabled={pending || controllerEntry}
                            />
                        </div>
                    </>
                ) : null}
                <div
                    className={cn(
                        inPreExam ? 'flex w-full flex-col gap-2' : 'flex gap-2',
                        arenaStyle && 'mt-2',
                        !inPreExam && arenaStyle && 'w-full',
                        !inPreExam && !arenaStyle && 'justify-center',
                    )}
                >
                    {arenaStyle ? (
                        <SmoothButton
                            aria-label={inPreExam ? enterLabel : 'Sign in'}
                            className="w-full mt-2 mb-2"
                            color="blue"
                            loading={pending}
                            type="submit"
                            variant="candy"
                        >
                            {inPreExam ? (
                                <>
                                    <DoorOpenIcon aria-hidden className="size-5" />
                                    {enterLabel}
                                </>
                            ) : (
                                <>
                                    <LogInIcon aria-hidden className="size-4" />
                                    Sign in
                                </>
                            )}
                        </SmoothButton>
                    ) : (
                        <Button
                            aria-label={inPreExam ? enterLabel : undefined}
                            className={inPreExam ? 'w-full' : undefined}
                            type="submit"
                            disabled={pending}
                        >
                            {pending ? (
                                'Please wait…'
                            ) : inPreExam ? (
                                <DoorOpenIcon aria-hidden className="size-5" />
                            ) : (
                                <>
                                    <LogInIcon aria-hidden className="size-4" />
                                    Sign in
                                </>
                            )}
                        </Button>
                    )}
                    {inPreExam ? (
                        arenaStyle ? (
                            <SmoothButton
                                className="w-full mb-2"
                                color="destructive"
                                disabled={pending}
                                type="button"
                                variant="candy"
                                onClick={handleBack}
                            >
                                <LogOutIcon aria-hidden className="size-4" />
                                Sign out
                            </SmoothButton>
                        ) : (
                            <Button
                                className="w-full"
                                type="button"
                                variant="destructive"
                                disabled={pending}
                                onClick={handleBack}
                            >
                                <LogOutIcon aria-hidden className="size-4" />
                                Sign out
                            </Button>
                        )
                    ) : null}
                </div>
            </form>
        </>
    )
}

function ReadyExamSelectOption({ exam }: { exam: ReadyExam }) {
    const isController = exam.role === 'controller'

    return (
        <div className="flex min-w-0 flex-col gap-1 text-left">
            <span className="flex min-w-0 items-center gap-1.5 leading-snug">
                <span className="min-w-0 truncate font-medium">{exam.title}</span>
                {isController ? (
                    <span className="inline-flex shrink-0 text-foreground" role="img" aria-label="Instructor">
                        <GraduationCapIcon aria-hidden className="size-3.5" />
                    </span>
                ) : null}
            </span>
            <span className="min-w-0 truncate text-xs leading-snug text-muted-foreground">
                {formatLiveDateTime(exam.exp_time_start)}
                {exam.course_name ? (
                    <span className="text-muted-foreground ml-2">
                        {exam.course_name}
                    </span>
                ) : null}
            </span>
        </div>
    )
}

function LiveAccountRoleIcons({
    instructor,
    administrator,
}: {
    instructor: boolean
    administrator: boolean
}) {
    if (!instructor && !administrator) return null

    return (
        <TooltipProvider>
            <span className="ml-0.5 inline-flex items-center gap-0.5">
                {instructor ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                className="inline-flex text-foreground"
                                role="img"
                                aria-label="Instructor"
                                tabIndex={0}
                            >
                                <GraduationCapIcon aria-hidden className="size-3.5" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>Instructor</TooltipContent>
                    </Tooltip>
                ) : null}
                {administrator ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                className="inline-flex text-foreground"
                                role="img"
                                aria-label="Administrator"
                                tabIndex={0}
                            >
                                <CrownIcon aria-hidden className="size-3.5" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>Administrator</TooltipContent>
                    </Tooltip>
                ) : null}
            </span>
        </TooltipProvider>
    )
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
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground"
                        disabled={disabled}
                        aria-label={`Reload ${contest ? 'contests' : 'exams'}`}
                        onClick={onReload}
                    >
                        <RefreshCwIcon aria-hidden className="size-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Reload list</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}