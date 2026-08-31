import { AboutInfoCard, AboutTimeline, AboutTimelineGroup, aboutCountLabel } from '@/components/about/AboutTimeline'
import { developerCredits, maintenanceCredits, problemSetters, problemTranslators } from '@/lib/about'
import { LanguagesIcon, ListChecksIcon } from 'lucide-react'

export function AboutCredits() {
    return (
        <AboutTimeline labelWidth="11rem">
            <AboutTimelineGroup
                id="credits-core"
                label="Lead"
                caption={aboutCountLabel(maintenanceCredits.length, 'person', 'people')}
            >
                {maintenanceCredits.map((person) => (
                    <AboutInfoCard
                        key={person.name}
                        media={
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={person.image} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
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
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={person.image}
                                        alt=""
                                        className="size-11 shrink-0 rounded-full object-cover"
                                    />
                                }
                                title={person.name}
                                badge={person.role}
                            />
                        </li>
                    ))}
                </ul>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="credits-setters" label="Setters" caption="Problem authors">
                <AboutInfoCard icon={ListChecksIcon} title="Problem setters" badge="Content">
                    <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-muted-foreground">
                        {problemSetters.map((name) => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                </AboutInfoCard>
            </AboutTimelineGroup>

            <AboutTimelineGroup id="credits-translators" label="Translators" caption="Problem translators">
                <AboutInfoCard icon={LanguagesIcon} title="Problem translators" badge="Language">
                    <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-muted-foreground">
                        {problemTranslators.map((name) => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                </AboutInfoCard>
            </AboutTimelineGroup>
        </AboutTimeline>
    )
}
