import { AboutBulletList, AboutInfoCard, AboutTimeline, AboutTimelineGroup } from '@/components/about/AboutTimeline'
import { HeartHandshakeIcon, KeyRoundIcon, MessagesSquareIcon, PencilLineIcon } from 'lucide-react'

export function AboutHonorCode() {
    return (
        <AboutTimeline labelWidth="9.5rem">
            <AboutTimelineGroup id="honor-work" label="Your work" caption="Assessments and assignments">
                <AboutInfoCard icon={PencilLineIcon} title="Submit work that is your own" badge="Integrity">
                    <AboutBulletList
                        items={[
                            'Rely solely on your own work for assessments, problems, homework, and assignments, unless collaboration is expressly permitted.',
                            'Acknowledge any and all external sources used in your work.',
                            'Refrain from any activity that would dishonestly or fraudulently improve your results or disadvantage others in the course.',
                            'Refrain from disclosing answers to assessments, problems, assignments, and homework to others.',
                        ]}
                    />
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="honor-account" label="Your account" caption="Identity and access">
                <AboutInfoCard icon={KeyRoundIcon} title="Keep a single, honest account" badge="Access">
                    <AboutBulletList
                        items={[
                            'Maintain only one user account, and do not let anyone else use your username or password.',
                            'Do not access or attempt to access any other user’s account.',
                            'Do not misrepresent or attempt to misrepresent your identity while using the site.',
                        ]}
                    />
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="honor-community" label="Community" caption="How you treat others">
                <AboutInfoCard icon={HeartHandshakeIcon} title="Be responsible and polite" badge="Conduct">
                    <AboutBulletList
                        items={[
                            'You are held responsible for your postings, submissions, and publications on this site.',
                            'Be polite with others who can read the information you submit.',
                        ]}
                    />
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="honor-discussion" label="Discussion" caption="What this code does not forbid">
                <AboutInfoCard icon={MessagesSquareIcon} title="Talking about the course is welcome" badge="Note">
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        This Honor Code is not intended to prohibit discussion of course material. While you must submit
                        work that is your own, you should feel free to discuss lectures or other course material with
                        others, either in person or online.
                    </p>
                </AboutInfoCard>
            </AboutTimelineGroup>
        </AboutTimeline>
    )
}
