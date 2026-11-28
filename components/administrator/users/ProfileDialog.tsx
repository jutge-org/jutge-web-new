'use client'

import { Prose } from '@/components/documentation/Prose'
import type { ProfileForAdmin } from '@/lib/jutge_api_client'
import dayjs from 'dayjs'
import { XIcon } from 'lucide-react'
import { JSX, useState } from 'react'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type ProfileDialogConfig = { ignoredTitle?: string }
export type ProfileDialogResult = boolean

export const useProfileDialog = (): [(profile: ProfileForAdmin) => Promise<ProfileDialogResult>, () => JSX.Element] => {
    const [promise, setPromise] = useState<{ resolve: (result: ProfileDialogResult) => void } | null>(null)
    const [open, setOpen] = useState(false)
    const [profile, setProfile] = useState<ProfileForAdmin | null>(null)

    function runProfileDialog(profile: ProfileForAdmin): Promise<ProfileDialogResult> {
        setProfile(profile)
        setOpen(true)
        return new Promise((resolve) => {
            setPromise({ resolve })
        })
    }

    function ProfileDialogComponent() {
        function close() {
            promise?.resolve(false)
            setOpen(false)
        }

        function acceptAction() {
            promise?.resolve(true)
            close()
        }

        function cancelAction() {
            promise?.resolve(false)
            close()
        }

        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent onCloseAutoFocus={cancelAction}>
                    <DialogHeader>
                        <DialogTitle>{profile?.name}</DialogTitle>
                        <DialogDescription className="hidden">{profile?.name}</DialogDescription>
                    </DialogHeader>
                    {profile ? (
                        <ScrollArea className="h-96 rounded-lg border p-2 text-sm">
                            <div className="flex flex-col gap-1">
                                <Item label="Id:" value={profile.user_id} />
                                <Item label="Uid:" value={profile.user_uid} />
                                <Item label="Email:" value={profile.email} />
                                <Item label="Parent email:" value={profile.parent_email} />
                                <Item label="Username:" value={profile.username} />
                                <Item label="Nickname:" value={profile.nickname} />
                                <MdItem label="Description:" value={profile.description} />
                                <Item label="Affiliation:" value={profile.affiliation} />
                                <Item label="Birth year:" value={profile.birth_year} />
                                <Item label="Web page:" value={profile.webpage} />
                                <Item
                                    label="Creation date:"
                                    value={dayjs(profile.creation_date).format('YYYY-MM-DD HH:mm:ss')}
                                />
                                <Item
                                    label="Max subs:"
                                    value={`${profile.max_subsxday}/day, ${profile.max_subsxhour}/hour`}
                                />
                                <Item label="Country:" value={profile.country_id} />
                                <Item label="Compiler:" value={profile.compiler_id} />
                                <Item label="Language:" value={profile.language_id} />
                                <Item label="Timezone:" value={profile.timezone_id} />
                            </div>
                        </ScrollArea>
                    ) : null}
                    <div className="flex w-full flex-row gap-2 pt-4">
                        <SmoothButton
                            type="button"
                            color="blue"
                            variant="candy"
                            size="xs"
                            className="w-full"
                            onClick={acceptAction}
                        >
                            <XIcon />
                            Close
                        </SmoothButton>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return [runProfileDialog, ProfileDialogComponent]
}

function Item({ label, value }: { label: string; value: unknown }) {
    return (
        <div className="flex flex-row gap-4">
            <div className="w-36 text-right font-bold">{label}</div>
            <div className="line-clamp-1">{value ? String(value) : '—'}</div>
        </div>
    )
}

function MdItem({ label, value }: { label: string; value: unknown }) {
    if (!value) return <Item label={label} value={null} />
    return (
        <>
            <div className="flex flex-row gap-4">
                <div className="w-36 text-right font-bold">{label}</div>
            </div>
            <div className="flex flex-row gap-4">
                <div className="max-h-32 w-full overflow-auto rounded-lg border p-2">
                    <Prose>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(value)}</ReactMarkdown>
                    </Prose>
                </div>
            </div>
        </>
    )
}
