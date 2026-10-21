'use client'

import { instructorProblemCreate } from '@/lib/instructor/client'
import { JForm, type JFormFields } from '@/components/instructor/JForm'
import { showError } from '@/lib/instructor/utils'
import { PlusCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

export function ProblemsNewView() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [passcode, setPasscode] = useState<string>(Math.random().toString(36).substring(2, 12))

    const fields: JFormFields = {
        title: {
            type: 'free',
            label: '',
            content: (
                <div className="mb-8 space-y-2 rounded-lg border p-4 text-sm">
                    <p>
                        Create a new problem by uploading a ZIP archive with its content. Please read the documentation
                        in the{' '}
                        <Link
                            href="https://github.com/jutge-org/jutge-toolkit"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            Jutge Toolkit
                        </Link>{' '}
                        for
                        more information about the format of the ZIP archive.
                    </p>
                    <p>Passcode is mandatory to create a new problem, you can remove it latter.</p>
                </div>
            ),
        },
        file: {
            type: 'file',
            label: 'ZIP archive',
            value: file,
            setValue: setFile,
            accept: ['application/zip'],
        },
        passcode: {
            type: 'password',
            label: 'Passcode',
            value: passcode,
            setValue: setPasscode,
            validator: z
                .string()
                .min(8)
                .max(100)
                .refine((value) => /^[a-zA-Z0-9]+$/.test(value), 'String should contain only alphanumeric characters'),
        },
        sep: { type: 'separator' },
        add: {
            type: 'button',
            text: 'Add problem',
            icon: <PlusCircleIcon />,
            action: addAction,
        },
    }

    async function addAction() {
        if (!file) {
            toast.error('Please select a ZIP archive.')
            return
        }

        try {
            const { id } = await instructorProblemCreate(passcode, file)
            router.push(`/instructor/problems/new/${id}`)
        } catch (error) {
            showError(error)
        }
    }

    return <JForm fields={fields} />
}
