export default function ExamFloatingWidgetLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-background">{children}</div>
    )
}