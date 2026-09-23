import { getCurrentClient, getPreferredLanguageId } from '@/lib/data/auth'
import { abstractProblemToRow } from '@/lib/data/problems'
import type { Passcode } from '@/lib/jutge_api_client'

export type StudentPasscode = Passcode & {
    title: string
    author: string | null
    iconUrl: string | null
}

export async function fetchStudentPasscodes(): Promise<StudentPasscode[]> {
    const client = await getCurrentClient()
    const [passcodes, preferredLanguageId] = await Promise.all([
        client.student.passcodes.getAll(),
        getPreferredLanguageId(),
    ])

    const details = await Promise.all(
        passcodes.map(async (passcode) => {
            try {
                const abstractProblem = await client.problems.getAbstractProblem(passcode.problem_nm)
                const row = abstractProblemToRow(abstractProblem, preferredLanguageId)
                return { title: row.title, author: row.author, iconUrl: row.iconUrl }
            } catch {
                return { title: '—', author: null, iconUrl: null }
            }
        }),
    )

    return passcodes.map((passcode, index) => ({
        problem_nm: passcode.problem_nm,
        passcode: passcode.passcode,
        title: details[index].title,
        author: details[index].author,
        iconUrl: details[index].iconUrl,
    }))
}
