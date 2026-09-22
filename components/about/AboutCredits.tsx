import { AboutInfoCard, AboutTimeline, AboutTimelineGroup, aboutCountLabel } from '@/components/about/AboutTimeline'
import { developerCredits, maintenanceCredits } from '@/lib/about'
import { UserIcon } from 'lucide-react'

export function AboutCredits() {
    return (
        <AboutTimeline labelWidth="11rem" className="my-6">
            <AboutTimelineGroup
                id="credits-core"
                label="Lead"
                caption={aboutCountLabel(maintenanceCredits.length, 'person', 'people')}
            >
                {maintenanceCredits.map((person) => (
                    <AboutInfoCard
                        key={person.name}
                        media={
                            person.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={person.image}
                                    alt=""
                                    className="size-20 shrink-0 rounded-xl object-cover hover:animate-pulse"
                                />
                            ) : undefined
                        }
                        title={person.name}
                        badge="Lead"
                        description={
                            person.affiliation ? (
                                <address className="not-italic whitespace-pre-line">{person.affiliation}</address>
                            ) : null
                        }
                    />
                ))}
            </AboutTimelineGroup>

            <AboutTimelineGroup
                id="credits-team"
                label="Developers"
                caption={aboutCountLabel(developerCredits.length, 'person', 'people')}
            >
                <ul className="grid gap-3 sm:grid-cols-2">
                    {developerCredits.map((person) => (
                        <li key={`${person.name}-${person.role ?? 'dev'}`}>
                            <AboutInfoCard
                                media={
                                    person.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={person.image}
                                            alt=""
                                            className="size-11 shrink-0 rounded-md object-cover hover:animate-pulse"
                                        />
                                    ) : (
                                        <span
                                            className="flex size-11 shrink-0 items-center justify-center rounded-md border text-muted-foreground"
                                            aria-hidden
                                        >
                                            <UserIcon className="size-5" />
                                        </span>
                                    )
                                }
                                title={person.name}
                                badge={person.role}
                            />
                        </li>
                    ))}
                </ul>
            </AboutTimelineGroup>
        </AboutTimeline>
    )
}
