import { AboutIndex } from '@/components/about/AboutIndex'
import { AboutPageShell } from '@/components/about/AboutPageShell'

export default function AboutPage() {
    return (
        <AboutPageShell activeTab="index" breadcrumbs={[{ title: 'About', url: '/about' }]}>
            <AboutIndex />
        </AboutPageShell>
    )
}
