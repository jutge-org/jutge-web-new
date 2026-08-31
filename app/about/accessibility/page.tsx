import { AboutAccessibility } from '@/components/about/AboutAccessibility'
import { AboutPageShell } from '@/components/about/AboutPageShell'

export default function AboutAccessibilityPage() {
    return (
        <AboutPageShell
            activeTab="accessibility"
            breadcrumbs={[
                { title: 'About', url: '/about' },
                { title: 'Accessibility', url: '/about/accessibility' },
            ]}
        >
            <AboutAccessibility />
        </AboutPageShell>
    )
}
