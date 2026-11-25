import { AboutPageShell } from '@/components/about/AboutPageShell'
import { AboutPublications } from '@/components/about/AboutPublications'

export default function AboutPublicationsPage() {
    return (
        <AboutPageShell
            className="mx-auto w-full max-w-4xl"
            activeTab="publications"
            breadcrumbs={[
                { title: 'About', url: '/about' },
                { title: 'Publications', url: '/about/publications' },
            ]}
        >
            <AboutPublications />
        </AboutPageShell>
    )
}
