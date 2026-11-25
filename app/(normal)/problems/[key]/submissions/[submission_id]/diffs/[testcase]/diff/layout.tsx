import type { ReactNode } from 'react'

export default function SubmissionTestcaseDiffViewLayout({ children }: { children: ReactNode }) {
    return <div className="fixed inset-0 flex flex-col bg-background">{children}</div>
}
