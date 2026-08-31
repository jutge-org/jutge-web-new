'use client'

import { useState } from 'react'
import { XIcon } from 'lucide-react'

import { AboutTimeline, AboutTimelineGroup } from '@/components/about/AboutTimeline'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { pictureItems, type PictureItem } from '@/lib/about'
import { cn } from '@/lib/utils'

const pictureGroups = [
    {
        id: 'pictures-servers',
        label: 'Servers',
        caption: 'Where Jutge.org runs',
        items: pictureItems.filter((picture) => /server/i.test(picture.alt) || /server/i.test(picture.title)),
    },
] as const

function PictureThumbnail({ picture }: { picture: PictureItem }) {
    const isSvg = picture.src.endsWith('.svg')

    return (
        <div className={cn('relative aspect-[4/3] w-full overflow-hidden', isSvg && 'bg-muted/40')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={picture.src}
                alt=""
                loading="lazy"
                className={cn('absolute inset-0 size-full', isSvg ? 'object-contain p-6' : 'object-cover')}
            />
        </div>
    )
}

function PictureDialog({
    picture,
    open,
    onOpenChange,
}: {
    picture: PictureItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const isSvg = picture?.src.endsWith('.svg') ?? false

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col items-center gap-4 p-6">
                <DialogHeader className="w-full">
                    <DialogTitle>{picture?.title ?? 'Picture'}</DialogTitle>
                </DialogHeader>
                {picture ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <a href={picture.src} target="_blank" rel="noopener noreferrer" className="block w-full">
                            <img
                                src={picture.src}
                                alt={picture.alt}
                                className={cn(
                                    'mx-auto max-h-[70vh] w-full rounded-2xl',
                                    isSvg ? 'bg-muted/40 object-contain p-8' : 'object-contain',
                                )}
                            />
                        </a>
                        <p className="w-full text-sm leading-relaxed text-muted-foreground">{picture.description}</p>
                        <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                            <XIcon className="mr-2 h-4 w-4" aria-hidden />
                            Close
                        </Button>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}

export function AboutPictures() {
    const [selected, setSelected] = useState<PictureItem | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    function openPicture(picture: PictureItem) {
        setSelected(picture)
        setDialogOpen(true)
    }

    return (
        <>
            <AboutTimeline labelWidth="8rem">
                {pictureGroups.map((group) => (
                    <AboutTimelineGroup key={group.id} id={group.id} label={group.label} caption={group.caption}>
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {group.items.map((picture) => (
                                <li key={picture.src}>
                                    <button
                                        type="button"
                                        onClick={() => openPicture(picture)}
                                        className="group w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        aria-label={`View ${picture.title}`}
                                    >
                                        <PictureThumbnail picture={picture} />
                                        <span className="block space-y-0.5 px-3 py-2.5">
                                            <span className="block text-sm font-semibold tracking-tight text-foreground">
                                                {picture.title}
                                            </span>
                                            <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                                {picture.description}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </AboutTimelineGroup>
                ))}
            </AboutTimeline>

            <PictureDialog picture={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
    )
}
