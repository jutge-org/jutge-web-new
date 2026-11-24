'use client'

import { useEffect, useState } from 'react'

import { EXAM_FLOATING_WIDGET_CLOSE_CHANNEL } from '@/lib/examFloatingWidget'
import {
    examHasStarted,
    fetchLiveExamSubmissions,
    isLiveAuthFailure,
    probeLiveRole,
    resolveLiveExamCourseTitle,
    runningExamCourseTitle,
    type LiveTutorStatus,
} from '@/lib/data/liveExam'
import { LIVE_SESSION_STORAGE, validateLiveSessionToken } from '@/lib/data/liveAuth'
import { fetchStudentProblemStatuses } from '@/lib/data/problems'
import { getExamStatus } from '@/lib/exams'
import jutge from '@/lib/jutge'
import type { SubmissionRow } from '@/lib/submissions'
import type { AbstractStatus, Exam, PublicProfile, RunningExam } from '@/lib/jutge_api_client'
import { applyLiveApiClient, resolveSiteMode } from '@/lib/siteMode'

export type ExamFloatingWidgetSession = {
    loading: boolean
    role: 'student' | 'tutor' | null
    exam: RunningExam | null
    examMeta: Exam | null
    tutorStatus: LiveTutorStatus | null
    courseTitle: string | null
    instructorName: string | null
    examFinished: boolean
    problemStatuses: Record<string, AbstractStatus>
    submissions: SubmissionRow[]
}

function ownerDisplayName(owner: PublicProfile): string {
    return owner.name?.trim() || owner.username?.trim() || owner.email
}

function readStoredToken(): string | null {
    return localStorage.getItem(LIVE_SESSION_STORAGE.token)
}

function closeWidgetWindow(): void {
    try {
        window.close()
    } catch {
        // ignore
    }
}

export function useExamFloatingWidgetSession(): ExamFloatingWidgetSession {
    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState<'student' | 'tutor' | null>(null)
    const [exam, setExam] = useState<RunningExam | null>(null)
    const [examMeta, setExamMeta] = useState<Exam | null>(null)
    const [tutorStatus, setTutorStatus] = useState<LiveTutorStatus | null>(null)
    const [courseTitle, setCourseTitle] = useState<string | null>(null)
    const [instructorName, setInstructorName] = useState<string | null>(null)
    const [examFinished, setExamFinished] = useState(false)
    const [problemStatuses, setProblemStatuses] = useState<Record<string, AbstractStatus>>({})
    const [submissions, setSubmissions] = useState<SubmissionRow[]>([])

    useEffect(() => {
        applyLiveApiClient(jutge, resolveSiteMode(window.location.hostname))
    }, [])

    useEffect(() => {
        function onStorage(event: StorageEvent) {
            if (event.key === LIVE_SESSION_STORAGE.token && !event.newValue) {
                closeWidgetWindow()
            }
        }

        let channel: BroadcastChannel | null = null
        if (typeof BroadcastChannel !== 'undefined') {
            channel = new BroadcastChannel(EXAM_FLOATING_WIDGET_CLOSE_CHANNEL)
            channel.onmessage = () => closeWidgetWindow()
        }

        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('storage', onStorage)
            channel?.close()
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        async function loadMeta(studentExam: RunningExam, examKey: string | null) {
            const inlineCourse = runningExamCourseTitle(studentExam)
            if (inlineCourse) {
                setCourseTitle(inlineCourse)
            } else {
                const resolved = await resolveLiveExamCourseTitle(studentExam, examKey)
                if (!cancelled) setCourseTitle(resolved)
            }

            const key = examKey?.trim()
            if (!key) return

            try {
                const detail = await jutge.student.exams.get(key)
                if (cancelled) return
                setExamMeta(detail)
                setInstructorName(ownerDisplayName(detail.owner))
                if (!inlineCourse) {
                    const title = detail.course?.title?.trim()
                    if (title) setCourseTitle(title)
                }
                setExamFinished(getExamStatus(detail).tone === 'finished')
            } catch {
                if (!cancelled) setExamMeta(null)
            }
        }

        async function refresh() {
            const token = readStoredToken()
            if (!token) {
                closeWidgetWindow()
                return
            }

            const userUid = localStorage.getItem(LIVE_SESSION_STORAGE.userUid) ?? ''
            jutge.meta = { token, user_uid: userUid }

            try {
                await validateLiveSessionToken()
                const probed = await probeLiveRole()
                if (cancelled) return

                if (probed.role === 'tutor') {
                    setRole('tutor')
                    setTutorStatus(probed.status)
                    setExam(null)
                    setExamMeta(null)
                    setCourseTitle(null)
                    setInstructorName(null)
                    setExamFinished(false)
                    setProblemStatuses({})
                    setSubmissions([])
                    return
                }

                setRole('student')
                setTutorStatus(null)
                setExam(probed.exam)
                const examKey = localStorage.getItem(LIVE_SESSION_STORAGE.examKey)
                const [statuses, submissionRows] = await Promise.all([
                    fetchStudentProblemStatuses(jutge),
                    fetchLiveExamSubmissions(jutge, probed.exam),
                    loadMeta(probed.exam, examKey),
                ])
                if (!cancelled) {
                    setProblemStatuses(statuses)
                    setSubmissions(submissionRows)
                }
            } catch (error) {
                if (cancelled) return
                if (isLiveAuthFailure(error)) {
                    closeWidgetWindow()
                    return
                }
            }
        }

        void (async () => {
            await refresh()
            if (!cancelled) setLoading(false)
        })()

        const intervalId = window.setInterval(() => {
            void refresh()
        }, 10_000)

        return () => {
            cancelled = true
            window.clearInterval(intervalId)
        }
    }, [])

    return {
        loading,
        role,
        exam,
        examMeta,
        tutorStatus,
        courseTitle,
        instructorName,
        examFinished,
        problemStatuses,
        submissions,
    }
}

export function finishTimeMs(exam: RunningExam, meta: Exam | null): number {
    if (meta?.time_end) {
        return new Date(meta.time_end).getTime()
    }
    const startMs = exam.time_start ? new Date(exam.time_start).getTime() : new Date(exam.exp_time_start).getTime()
    return startMs + (exam.running_time + exam.extra_minutes) * 60_000
}

export function examTimerFinished(exam: RunningExam, meta: Exam | null, now: number): boolean {
    if (meta) {
        return getExamStatus(meta).tone === 'finished'
    }
    if (!examHasStarted(exam)) return false
    return finishTimeMs(exam, meta) <= now
}
