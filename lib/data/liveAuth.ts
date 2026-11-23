import jutge from '@/lib/jutge'
import type { CredentialsOut, ExamCredentialsIn, ReadyExam } from '@/lib/jutge_api_client'
import { UnauthorizedError } from '@/lib/jutge_api_client'

/** Exam/contest auth phases (normal Jutge uses AuthProvider only). */
export type LiveAuthPhase = 'signed-out' | 'pre-exam' | 'signed-in-exam'

export const LIVE_SESSION_STORAGE = {
    token: 'token',
    expiration: 'expiration',
    userUid: 'user_uid',
    email: 'live_email',
} as const

export type AuthReadyExamsOut = {
    exams: ReadyExam[]
    name: string
    administrator: boolean
    instructor: boolean
    username: string | null
}

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