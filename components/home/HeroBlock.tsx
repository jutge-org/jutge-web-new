import Image from 'next/image'

export function HeroBlock() {
    return (
        <section id="home-hero" className="relative scroll-mt-14" aria-label="Jutge.org">
            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                <div>
                    <div className="flex justify-center">
                        <Image src="/jutge/modern.png" alt="Jutge.org" width={192} height={192} loading="eager" />
                    </div>

                    <h1 className="mb-6 inline-block pb-1 font-normal text-4xl leading-[1.2] tracking-wide text-balance text-8xl text-[var(--color-brand-title)] dark:bg-linear-to-r dark:from-cyan-300 dark:via-sky-400 dark:to-blue-500 dark:bg-clip-text font-thin dark:text-transparent">
                        Jutge.org
                    </h1>
                    <p className="mx-auto max-w-3xl text-muted-foreground lg:text-2xl dark:font-thin">
                        The Virtual Learning Environment for Computer Programming
                    </p>
                </div>
            </div>
        </section>
    )
}
