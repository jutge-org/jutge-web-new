import { AboutBulletList, AboutInfoCard, AboutTimeline, AboutTimelineGroup } from '@/components/about/AboutTimeline'
import { CookieIcon, FlaskConicalIcon, LockIcon, Share2Icon } from 'lucide-react'

export function AboutTermsOfService() {
    return (
        <AboutTimeline labelWidth="9.5rem">
            <AboutTimelineGroup id="terms-purpose" label="Purpose" caption="Why Jutge.org exists">
                <AboutInfoCard icon={FlaskConicalIcon} title="A research and education project" badge="Mission">
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        Jutge.org pursues the science of learning. Online learners are important participants in that
                        pursuit. The information we gather from your engagement with our instructional offerings makes
                        it possible for all stakeholders in Jutge.org to continuously improve their work and, in that
                        process, build learning science.
                    </p>
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="terms-research" label="Research" caption="How we use activity data">
                <AboutInfoCard icon={Share2Icon} title="Anonymized data may be shared" badge="Studies">
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        For purposes of research, we may share information we collect from online learning activities
                        with researchers beyond the Jutge.org project, after anonymization. Any research findings might
                        be reported at the aggregate level and will not expose your personal identity.
                    </p>
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="terms-privacy" label="Privacy" caption="Who can see your identity">
                <AboutInfoCard icon={LockIcon} title="Personal information stays with your courses" badge="Identity">
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        Your personally identifiable information will only be shared with the instructors and tutors of
                        the courses you decide to enroll in.
                    </p>
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="terms-cookies" label="Cookies" caption="What registering means">
                <AboutInfoCard icon={CookieIcon} title="Cookies improve the experience" badge="Consent">
                    <AboutBulletList
                        items={[
                            'We use cookies to improve your experience on Jutge.org.',
                            'By registering, you accept this use of cookies and the terms on this page.',
                        ]}
                    />
                </AboutInfoCard>
            </AboutTimelineGroup>
        </AboutTimeline>
    )
}
