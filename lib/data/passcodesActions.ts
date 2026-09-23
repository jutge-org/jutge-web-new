import { getCurrentClient } from '@/lib/data/auth'
import type { Passcode } from '@/lib/jutge_api_client'

type PasscodeActionResult = { ok: true } | { ok: false; error: string }

export async function addStudentPasscodeAction(data: Passcode): Promise<PasscodeActionResult> {
    const problem_nm = data.problem_nm.trim()
    const passcode = data.passcode.trim()
    if (!problem_nm) {
        return { ok: false, error: 'Problem is required.' }
    }
    if (!passcode) {
        return { ok: false, error: 'Passcode is required.' }
    }

    try {
        const client = await getCurrentClient()
        await client.student.passcodes.add({ problem_nm, passcode })
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to store passcode.'
        return { ok: false, error: message }
    }
}

export async function removeStudentPasscodeAction(problem_nm: string): Promise<PasscodeActionResult> {
    const trimmed = problem_nm.trim()
    if (!trimmed) {
        return { ok: false, error: 'Problem is required.' }
    }

    try {
        const client = await getCurrentClient()
        await client.student.passcodes.remove(trimmed)
        return { ok: true }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to remove passcode.'
        return { ok: false, error: message }
    }
}
