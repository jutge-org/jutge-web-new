import { AboutCredits } from '@/components/about/AboutCredits'
import { AboutPageShell } from '@/components/about/AboutPageShell'

export default function AboutCreditsPage() {
    return (
        <AboutPageShell
            className="mx-auto w-full max-w-4xl"
            activeTab="credits"
            breadcrumbs={[
                { title: 'About', url: '/about' },
                { title: 'Credits', url: '/about/credits' },
            ]}
        >
            <AboutCredits />
        </AboutPageShell>
    )
}
