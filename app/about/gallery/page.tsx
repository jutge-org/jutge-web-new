import { AboutPageShell } from '@/components/about/AboutPageShell'
import { AboutGallery } from '@/components/about/AboutGallery'

export default function AboutGalleryPage() {
    return (
        <AboutPageShell
            activeTab="gallery"
            breadcrumbs={[
                { title: 'About', url: '/about' },
                { title: 'Gallery', url: '/about/gallery' },
            ]}
        >
            <AboutGallery />
        </AboutPageShell>
    )
}
