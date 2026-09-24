'use client'

import {
    fetchAdminDashboardZombies,
    adminFatalizeIEs,
    adminFatalizePendings,
    adminResubmitIEs,
    adminResubmitPendings,
} from '@/lib/administrator/client'
import SimpleSpinner from '@/components/administrator/SimpleSpinner'
import { AudioLinesIcon, ChevronDownIcon, GhostIcon, RotateCwIcon, SkullIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Zombies } from '@/lib/jutge_api_client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import Widget from '@/components/administrator/dashboard/Widget'

type ZombiesWidgetProps = {
    /** Home dashboard uses large figures. The administrator dashboard keeps the table. */
    variant?: 'table' | 'figures'
}

export default function ZombiesWidget({ variant = 'table' }: ZombiesWidgetProps) {
    //

    const router = useRouter()

    const [data, setData] = useState<Zombies | null>(null)
    const fastRefresh = useRef<ReturnType<typeof setInterval> | null>(null)

    function clearFastRefresh() {
        if (fastRefresh.current !== null) {
            clearInterval(fastRefresh.current)
            fastRefresh.current = null
        }
    }

    async function fetchData() {
        const zombies = await fetchAdminDashboardZombies()
        setData(zombies)
        if (zombies.ies + zombies.pendings === 0) clearFastRefresh()
    }

    /** Poll once a second while a resubmit or fatalize is draining the queue. */
    function watchAction() {
        clearFastRefresh()
        fastRefresh.current = setInterval(fetchData, 1000)
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10 * 1000)
        return () => {
            clearInterval(interval)
            clearFastRefresh()
        }
    }, [])

    function resubmitIEs() {
        void adminResubmitIEs()
        toast.success(`Resubmitting IEs...`)
        watchAction()
    }

    function resubmitPendings() {
        void adminResubmitPendings()
        toast.success(`Resubmitting Pendings...`)
        watchAction()
    }

    function fatalizeIEs() {
        void adminFatalizeIEs()
        toast.success(`Fatalizing IEs...`)
        watchAction()
    }

    function fatalizePendings() {
        void adminFatalizePendings()
        toast.success(`Fatalizing Pendings...`)
        watchAction()
    }

    const viewIEs = () => {
        router.push('/administrator/queue?view=internal-errors')
    }

    const viewPendings = () => {
        router.push('/administrator/queue?view=pendings')
    }

    const actions = (
        <>
            {data && data.ies + data.pendings > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="px-2" size="sm">
                            <ChevronDownIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                        {data.ies > 0 && (
                            <>
                                <DropdownMenuItem onClick={viewIEs}>
                                    <AudioLinesIcon />
                                    View IEs
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={resubmitIEs}>
                                    <RotateCwIcon />
                                    Resubmit IEs
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={fatalizeIEs}>
                                    <SkullIcon />
                                    Fatalize IEs
                                </DropdownMenuItem>
                            </>
                        )}

                        {data.pendings > 0 && (
                            <>
                                <DropdownMenuItem onClick={viewPendings}>
                                    <AudioLinesIcon />
                                    View Pendings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={resubmitPendings}>
                                    <RotateCwIcon />
                                    Resubmit Pendings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={fatalizePendings}>
                                    <SkullIcon />
                                    Fatalize Pendings
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </>
    )

    const content =
        variant === 'figures' ? (
            <div className="grid w-full grid-cols-1 gap-2">
                <ZombieFigure label="Internal errors" value={data?.ies} alert="rose" />
                <ZombieFigure label="Pending submissions" value={data?.pendings} alert="amber" />
            </div>
        ) : (
            <div className="flex h-full w-full flex-col items-end gap-0">
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>Internal errors</TableCell>
                            <TableCell className="text-end">{data ? data.ies : <SimpleSpinner />}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Pendings</TableCell>
                            <TableCell className="text-end">{data ? data.pendings : <SimpleSpinner />}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        )

    return <Widget icon=<GhostIcon size={18} /> title="Zombi submissions" content={content} actions={actions} />
}

/** Large count for the home Admin module. A non-zero value is tinted so it stands out. */
function ZombieFigure({
    label,
    value,
    alert,
}: {
    label: string
    value: number | undefined
    alert: 'rose' | 'amber'
}) {
    const active = value !== undefined && value > 0

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2',
                active
                    ? alert === 'rose'
                        ? 'bg-rose-500/10'
                        : 'bg-amber-500/15'
                    : 'bg-muted/40',
            )}
        >
            <p
                className={cn(
                    'text-3xl font-semibold leading-none tracking-tight tabular-nums',
                    active
                        ? alert === 'rose'
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'text-amber-700 dark:text-amber-300'
                        : 'text-foreground',
                )}
            >
                {value === undefined ? (
                    <Spinner className="size-6 text-muted-foreground" aria-label={`Loading ${label}`} />
                ) : (
                    value.toLocaleString()
                )}
            </p>
            <p className="text-center text-sm font-medium text-muted-foreground">{label}</p>
        </div>
    )
}
