'use client'

import { filesize } from 'filesize'
import { CloudUploadIcon, ImageIcon, TrashIcon } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import Dropzone from 'shadcn-dropzone'
import { toast } from 'sonner'

import { ProfileFormRow } from '@/components/profile/ProfileFormRow'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { deleteProfileAvatarAction, updateProfileAvatarAction } from '@/lib/data/profileActions'

type UserProfileAvatarFormProps = {
    avatarDataUrl: string | null
}

export function UserProfileAvatarForm({ avatarDataUrl }: UserProfileAvatarFormProps) {
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pendingAction, setPendingAction] = useState<'update' | 'remove' | null>(null)
    const [pending, startTransition] = useTransition()

    useEffect(() => {
        if (!avatarFile) {
            setPreviewUrl(null)
            return
        }

        const url = URL.createObjectURL(avatarFile)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [avatarFile])

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

        setPendingAction('update')
        startTransition(async () => {
            const result = await updateProfileAvatarAction(avatarFile)
            if (!result.ok) {
                setErrorMessage(result.error)
                setPendingAction(null)
                return
            }

            toast.success('Avatar saved.')
            window.location.reload()
        })
    }

    function handleRemove() {
        setErrorMessage(null)
        setPendingAction('remove')
        startTransition(async () => {
            const result = await deleteProfileAvatarAction()
            if (!result.ok) {
                setErrorMessage(result.error)
                setPendingAction(null)
                return
            }

            toast.success('Avatar removed.')
            window.location.reload()
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
                    <dl className="px-6 py-4">
                        <ProfileFormRow label="Current avatar" alignStart>
                            {avatarDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <div className="w-full border flex flex-col items-center justify-center p-2">
                                    <img
                                        src={avatarDataUrl}
                                        alt="Current avatar"
                                        className="size-32 rounded-xl object-cover"
                                    />
                                </div>
                            ) : (
                                <p className="text-sm mt-0.5 text-muted-foreground">No avatar defined.</p>
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
                                {previewUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <div className="w-full border flex flex-col items-center justify-center p-2">
                                        <img
                                            src={previewUrl}
                                            alt="New avatar preview"
                                            className="size-32 rounded-xl object-cover"
                                        />
                                    </div>
                                ) : null}
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
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <SmoothButton
                                        type="submit"
                                        color="accent"
                                        variant="candy"
                                        disabled={!canSave}
                                        loading={pendingAction === 'update'}
                                        className="w-full gap-2"
                                        prefix={<ImageIcon className="size-4" aria-hidden />}
                                    >
                                        {pendingAction === 'update' ? 'Updating avatar…' : 'Update avatar'}
                                    </SmoothButton>
                                    {avatarDataUrl ? (
                                        <SmoothButton
                                            type="button"
                                            color="destructive"
                                            variant="candy"
                                            disabled={pending}
                                            loading={pendingAction === 'remove'}
                                            className="w-full gap-2"
                                            prefix={<TrashIcon className="size-4" aria-hidden />}
                                            onClick={handleRemove}
                                        >
                                            {pendingAction === 'remove' ? 'Removing avatar…' : 'Remove avatar'}
                                        </SmoothButton>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </dl>
                </form>
            </section>
        </div >
    )
}
