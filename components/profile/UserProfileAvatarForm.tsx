'use client'

import { filesize } from 'filesize'
import { CloudUploadIcon, ImageIcon, TrashIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import Dropzone from 'shadcn-dropzone'
import { toast } from 'sonner'

import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { updateProfileAvatarAction } from '@/lib/data/profileActions'

type UserProfileAvatarFormProps = {
    avatarDataUrl: string | null
}

export function UserProfileAvatarForm({ avatarDataUrl }: UserProfileAvatarFormProps) {
    const router = useRouter()
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(avatarDataUrl)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    useEffect(() => {
        if (!avatarFile) {
            setAvatarPreviewUrl(avatarDataUrl)
            return
        }

        const objectUrl = URL.createObjectURL(avatarFile)
        setAvatarPreviewUrl(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
    }, [avatarFile, avatarDataUrl])

    function handleAvatarDrop(addedFiles: File[]) {
        if (addedFiles.length < 1) return

        const file = addedFiles[addedFiles.length - 1]
        if (file.type !== 'image/png') {
            setErrorMessage('Avatar must be a PNG image.')
            return
        }

        setAvatarFile(file)
        setErrorMessage(null)
    }

    function clearAvatarSelection() {
        setAvatarFile(null)
        setErrorMessage(null)
    }

    function handleSave() {
        setErrorMessage(null)

        if (!avatarFile) {
            setErrorMessage('Please select a PNG image to upload.')
            return
        }

        startTransition(async () => {
            const result = await updateProfileAvatarAction(avatarFile)
            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            toast.success('Avatar saved.')
            setAvatarFile(null)
            router.refresh()
        })
    }

    const canSave = Boolean(avatarFile) && !pending

    return (
        <div className="flex flex-1 flex-col">
            <section className="flex justify-center rounded-xl border border-border bg-card shadow-xs">
                <form
                    className="mb-3 w-full max-w-3xl"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (canSave) handleSave()
                    }}
                >
                    <div className="grid gap-3 px-6 pt-8 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <div className="hidden sm:block" />
                        <div className="min-w-0 space-y-3 text-sm text-muted-foreground">
                            <p>Upload a PNG image to use as your avatar on Jutge.org.</p>
                            <p>
                                <span className="font-bold text-foreground">Important:</span> The image must be a PNG
                                file.
                            </p>
                        </div>
                    </div>

                    <dl className="px-6 py-4">
                        <ProfileFormRow label="Current avatar" alignStart>
                            {avatarPreviewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={avatarPreviewUrl}
                                    alt="Avatar preview"
                                    className="size-32 rounded-xl object-cover"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">No avatar uploaded yet.</p>
                            )}
                        </ProfileFormRow>

                        <ProfileFormRow label="New avatar" alignStart>
                            <div className="flex flex-col gap-2">
                                <Dropzone accept={{ 'image/png': ['.png'] }} maxFiles={1} onDrop={handleAvatarDrop}>
                                    {() => (
                                        <div className="flex h-28 w-full flex-col items-center justify-center rounded-lg px-4 text-xs text-muted-foreground">
                                            <CloudUploadIcon className="size-8 stroke-[1.5]" aria-hidden />
                                            <div className="pt-2 text-center">
                                                Drag and drop a PNG image here <b>or</b> click to select.
                                            </div>
                                        </div>
                                    )}
                                </Dropzone>
                                {avatarFile ? (
                                    <div className="flex flex-row items-center gap-2 rounded border p-1 text-sm">
                                        <Badge variant="secondary" className="min-w-0 truncate">
                                            {avatarFile.name}
                                        </Badge>
                                        <Badge variant="secondary">
                                            {filesize(avatarFile.size, { standard: 'jedec' })}
                                        </Badge>
                                        <div className="grow" />
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={clearAvatarSelection}
                                                        aria-label="Remove avatar selection"
                                                    >
                                                        <TrashIcon />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Remove avatar selection</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                ) : null}
                            </div>
                        </ProfileFormRow>

                        <div className="grid gap-3 pt-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
                            <div className="hidden sm:block" />
                            <div className="mt-4 flex min-w-0 flex-col gap-3">
                                {errorMessage ? (
                                    <p role="alert" className="text-sm text-destructive">
                                        {errorMessage}
                                    </p>
                                ) : null}
                                <SmoothButton
                                    type="submit"
                                    color="accent"
                                    variant="candy"
                                    disabled={!canSave}
                                    loading={pending}
                                    className="w-full gap-2"
                                    prefix={<ImageIcon className="size-4" aria-hidden />}
                                >
                                    {pending ? 'Updating avatar…' : 'Update avatar'}
                                </SmoothButton>
                            </div>
                        </div>
                    </dl>
                </form>
            </section>
        </div>
    )
}
