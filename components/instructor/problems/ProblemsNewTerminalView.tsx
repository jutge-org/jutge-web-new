'use client'

import { fetchInstructorApiUrl } from '@/lib/instructor/client'
import { useXTerm } from '@/components/instructor/XTerm'
import SmoothButton from '@/components/smoothui/smooth-button'
import { FitAddon } from '@xterm/addon-fit'
import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function ProblemsNewTerminalView() {
    const { webstream_id } = useParams<{ webstream_id: string }>()
    const { instance, ref } = useXTerm()
    const [loading, setLoading] = useState(true)
    const [problem_nm, setProblem_nm] = useState<string | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)

    useEffect(() => {
        if (!instance) return

        const fitAddon = new FitAddon()
        fitAddonRef.current = fitAddon
        instance.loadAddon(fitAddon)

        setTimeout(() => {
            fitAddon.fit()
        }, 0)

        const handleResize = () => {
            fitAddon.fit()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [instance])

    useEffect(() => {
        const fetchData = async () => {
            if (!instance || !ref || !ref.current) return
            const apiUrl = await fetchInstructorApiUrl()
            const response = await fetch(`${apiUrl}/webstreams/${webstream_id}`)
            if (response.body === null) return
            const reader = response.body.getReader()
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const text = new TextDecoder().decode(value)
                instance.write(text.replaceAll(/\n/g, '\r\n'))

                const match = text.match(/Problem ([A-Z]\d{5}) created./)
                if (match) setProblem_nm(match[1])
            }
            setLoading(false)
        }

        fetchData()
    }, [instance, ref, webstream_id, problem_nm])

    useEffect(() => {
        if (!instance || !ref || !ref.current) return
        instance.write('Connecting...\n\r')
    }, [instance, ref])

    return (
        <div className="mb-8">
            {loading && (
                <div className="mb-8 rounded-lg border p-4 text-center text-sm">
                    <div className="animate-pulse">Please wait while the problem is being created.</div>
                </div>
            )}
            {!loading && problem_nm && (
                <div className="mb-8 rounded-lg border border-green-800 p-4 text-center text-sm text-green-800">
                    Problem {problem_nm} created successfully.
                </div>
            )}
            {!loading && !problem_nm && (
                <div className="mb-8 rounded-lg border border-red-800 p-4 text-center text-sm text-red-800">
                    Problem could not be created. Please check the terminal for more information.
                </div>
            )}
            <div className="mb-8 h-120 w-full rounded-lg border-8 border-black">
                <div ref={ref} style={{ width: '100%', height: '100%' }} />
            </div>
            {!loading && problem_nm && (
                <SmoothButton asChild color="blue" variant="candy" size="xs" className="w-full text-center">
                    <Link href={`/instructor/problems/${problem_nm}/properties`}>
                        <ArrowRightIcon />
                        Go to problem {problem_nm}
                    </Link>
                </SmoothButton>
            )}
        </div>
    )
}
