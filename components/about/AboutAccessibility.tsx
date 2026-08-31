import { AboutBulletList, AboutInfoCard, AboutTimeline, AboutTimelineGroup } from '@/components/about/AboutTimeline'
import { ExternalLink } from '@/components/ExternalLink'
import { KeyboardIcon, MailIcon, TargetIcon, TriangleAlertIcon, WrenchIcon } from 'lucide-react'

const linkClassName =
    'font-medium text-foreground underline underline-offset-4 transition-colors hover:text-violet-600 dark:hover:text-violet-400'

export function AboutAccessibility() {
    return (
        <AboutTimeline labelWidth="9.5rem">
            <AboutTimelineGroup id="a11y-aim" label="Aim" caption="Where we want to be">
                <AboutInfoCard icon={TargetIcon} title="WCAG 2.1 Level AA" badge="Goal">
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        We strive to make Jutge.org usable by as many people as possible. Accessibility is part of how
                        we design and build the site. We want to be fully compliant with WCAG 2.1 Level AA.
                    </p>
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="a11y-status" label="Status" caption="Where we are">
                <AboutInfoCard icon={WrenchIcon} title="The site is under active development" badge="In progress">
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        We aim for good keyboard support, readable contrast, and compatibility with common assistive
                        technologies, guided by widely used web accessibility practices (including WCAG 2.1 Level AA).
                        Some areas are still being improved, so you may run into rough edges.
                    </p>
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="a11y-gaps" label="Gaps" caption="Known limitations">
                <AboutInfoCard icon={TriangleAlertIcon} title="Issues we are working through" badge="Known">
                    <AboutBulletList
                        items={[
                            'Images that may lack descriptive text alternatives',
                            'Tables and problem statements that may not expose clear structure to screen readers',
                            'Status indicators that sometimes rely on colour or icons alone',
                            'Text contrast that may fall short in some theme combinations',
                            'Icon-only controls that may not always have a clear accessible name',
                            'Mixed-language content without explicit language tags',
                            'Form validation messages that may not always be linked to their fields',
                            'Decorative motion that is not yet reduced when you prefer less animation',
                            'Linked PDFs and other downloads that may not be fully accessible',
                        ]}
                    />
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="a11y-support" label="Support" caption="Browsers and assistive technology">
                <AboutInfoCard icon={KeyboardIcon} title="Recent browsers, keyboard, and screen readers" badge="Tech">
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        The site is intended to work with recent versions of major browsers and with screen readers and
                        keyboard-only navigation. During active development, we cannot guarantee compatibility in every
                        combination.
                    </p>
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="a11y-contact" label="Contact" caption="Updated 26 June 2026">
                <AboutInfoCard icon={MailIcon} title="Tell us about a problem" badge="Help">
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        If something is hard to use, or you need information in a different format, please get in touch
                        with the UPC ICT area. It helps if you include:
                    </p>
                    <AboutBulletList
                        items={[
                            'The page URL',
                            'What went wrong',
                            'Your browser and assistive technology, if relevant',
                        ]}
                    />
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        For broader accessibility information at UPC, see the{' '}
                        <ExternalLink href="https://www.upc.edu/en/disclaimer/accessibility" className={linkClassName}>
                            UPC accessibility page
                        </ExternalLink>
                        .
                    </p>
                </AboutInfoCard>
            </AboutTimelineGroup>
        </AboutTimeline>
    )
}
