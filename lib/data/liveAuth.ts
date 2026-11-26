import jutge from '@/lib/jutge'
import type { CredentialsOut, ExamCredentialsIn, GetReadyExamsOut } from '@/lib/jutge_api_client'
import { UnauthorizedError } from '@/lib/jutge_api_client'

/** Exam/contest auth phases (normal Jutge uses AuthProvider only). */
export type LiveAuthPhase = 'signed-out' | 'pre-exam' | 'signed-in-exam'

export const LIVE_SESSION_STORAGE = {
    token: 'token',
    expiration: 'expiration',
    userUid: 'user_uid',
    email: 'live_email',
    examKey: 'live_exam_key',
    /** Set when the user entered as a course owner or tutor (`ReadyExam.role === 'controller'`). */
    controllerEntry: 'live_controller_entry',
} as const

export function readLiveControllerEntry(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(LIVE_SESSION_STORAGE.controllerEntry) === '1'
}

export function writeLiveControllerEntry(controller: boolean): void {
    if (typeof window === 'undefined') return
    if (controller) {
        localStorage.setItem(LIVE_SESSION_STORAGE.controllerEntry, '1')
    } else {
        localStorage.removeItem(LIVE_SESSION_STORAGE.controllerEntry)
    }
}

export type AuthReadyExamsOut = GetReadyExamsOut

/** Step B — credentials only, no session token (`auth.getReadyExams`). */
export async function fetchReadyExamsUnauthenticated(
    email: string,
    password: string,
): Promise<AuthReadyExamsOut> {
    jutge.meta = null
    return jutge.auth.getReadyExams({ email, password })
}

/** Step D — exam password; sets client meta on success (`auth.loginExam`). */
export async function loginLiveExam(input: ExamCredentialsIn): Promise<CredentialsOut> {
    jutge.meta = null
    const credentials = await jutge.loginExam(input)
    if (!credentials.token) {
        jutge.meta = null
        throw new UnauthorizedError(credentials.error || 'Sign in failed.')
    }
    return credentials
}

/** Validate a persisted exam/contest token before loading exam state. */
export async function validateLiveSessionToken(): Promise<void> {
    await jutge.student.profile.get()
}