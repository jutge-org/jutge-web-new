'use client'

import { useState } from 'react'
import { XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { pictureItems, type PictureItem } from '@/lib/about'
import { cn } from '@/lib/utils'

function PictureThumbnail({ picture }: { picture: PictureItem }) {
    const isSvg = picture.src.endsWith('.svg')

    return (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={picture.src}
                alt=""
                loading="lazy"
                className={cn('absolute inset-0 size-full object-contain', isSvg && 'p-6')}
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
                        { }
                        <a href={picture.src} target="_blank" rel="noopener noreferrer" className="block w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={picture.src}
                                alt={picture.alt}
                                className={cn(
                                    'mx-auto h-auto max-h-[70vh] w-auto max-w-full rounded-2xl object-contain',
                                    isSvg && 'bg-muted/40 p-8',
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

export function AboutGallery() {
    const [selected, setSelected] = useState<PictureItem | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    function openPicture(picture: PictureItem) {
        setSelected(picture)
        setDialogOpen(true)
    }

    return (
        <>
            <ul className="mt-6 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 md:grid-cols-4">
                {pictureItems.map((picture) => (
                    <li key={picture.src} className="h-full">
                        <button
                            type="button"
                            onClick={() => openPicture(picture)}
                            className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-label={`View ${picture.title}`}
                        >
                            <PictureThumbnail picture={picture} />
                            <span className="flex flex-1 flex-col gap-0.5 px-3 py-2.5">
                                <span className="line-clamp-2 min-h-[2lh] text-sm font-semibold tracking-tight text-foreground">
                                    {picture.title}
                                </span>
                                <span className="line-clamp-2 min-h-[2lh] text-xs leading-snug text-muted-foreground">
                                    {picture.description}
                                </span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>

            <PictureDialog picture={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
        </>
    )
}
