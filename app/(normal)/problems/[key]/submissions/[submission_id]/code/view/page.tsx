import { redirect } from 'next/navigation'

type PageProps = {
    params: Promise<{ key: string; submission_id: string }>
}

export default async function ProblemSubmissionCodeViewRedirectPage({ params }: PageProps) {
    const { key, submission_id } = await params
    redirect(`/problems/${key}/submissions/${submission_id}/code`)
}
