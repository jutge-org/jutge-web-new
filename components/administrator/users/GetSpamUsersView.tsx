'use client'

import { adminRemoveSpamUsers, fetchAdminSpamUsers } from '@/lib/administrator/client'
import { AgTableFull } from '@/components/administrator/AgTable'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Skeleton } from '@/components/ui/skeleton'
import { CircleCheckIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function GetSpamUsersView() {
    const router = useRouter()
    const [spammers, setSpammers] = useState<string[] | null>(null)
    const [confirmed, setConfirmed] = useState(false)
    const [pending, setPending] = useState(false)

    const colDefs = [
        {
            field: 'pos',
            headerName: '#',
            width: 80,
            cellRenderer: (params: { node: { rowIndex: number } }) => params.node.rowIndex + 1,
            type: 'rightAligned',
        },
        { field: 'email', flex: 1 },
    ]

    useEffect(() => {
        void fetchAdminSpamUsers().then(setSpammers)
    }, [])

    useEffect(() => {
        if (!confirmed || pending) return
        const timer = window.setTimeout(() => setConfirmed(false), 10_000)
        return () => window.clearTimeout(timer)
    }, [confirmed, pending])

    async function remove() {
        if (spammers === null || pending) return
        if (!confirmed) {
            setConfirmed(true)
            return
        }
        setPending(true)
        try {
            await adminRemoveSpamUsers(spammers)
            toast.success('Spam users are being removed')
        } catch {
            toast.error('Error removing spam users')
            setConfirmed(false)
            setPending(false)
            return
        }
        router.push('/administrator/users')
    }

    if (spammers === null) {
        return (
            <div className="p-4">
                <Skeleton className="h-64 w-full p-12 text-center">Finding spam users...</Skeleton>
            </div>
        )
    }

    if (spammers.length === 0) {
        return <div className="w-full p-12 text-center">No spam users found</div>
    }

    const rows = spammers.map((email) => ({ email }))
    return (
        <>
            <div className="mb-4 flex flex-row-reverse gap-2">
                <SmoothButton
                    type="button"
                    color={confirmed ? 'green' : 'blue'}
                    variant="candy"
                    size="xs"
                    className="w-36"
                    disabled={pending}
                    aria-live="polite"
                    onClick={() => void remove()}
                >
                    {confirmed ? <CircleCheckIcon /> : <Trash2Icon />}
                    {pending ? 'Removing…' : confirmed ? 'Yes, remove' : 'Remove'}
                </SmoothButton>
            </div>
            <AgTableFull rowData={rows} columnDefs={colDefs} />
        </>
    )
}
