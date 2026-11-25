import type { ReactNode } from 'react'

export default function SubmissionDebugViewLayout({ children }: { children: ReactNode }) {
    return <div className="fixed inset-0 flex flex-col bg-background">{children}</div>
}
