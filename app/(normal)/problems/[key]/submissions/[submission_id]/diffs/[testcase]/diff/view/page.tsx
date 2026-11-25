import { redirect } from 'next/navigation'

type PageProps = {
    params: Promise<{ key: string; submission_id: string; testcase: string }>
}

export default async function ProblemSubmissionTestcaseDiffViewRedirectPage({ params }: PageProps) {
    const { key, submission_id, testcase } = await params
    redirect(`/problems/${key}/submissions/${submission_id}/diffs/${testcase}/diff`)
}
