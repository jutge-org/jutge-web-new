'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import Dropzone from 'shadcn-dropzone'
import { filesize } from 'filesize'
import { CloudUploadIcon, SendIcon, TrashIcon } from 'lucide-react'
import { toast } from 'sonner'

import { submitSolutionAction } from '@/lib/data/submissionsActions'
import { ProblemIdLabel } from '@/components/problems/ProblemIdLabel'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCompilerStatus } from '@/lib/documentation'
import { pickPreferredId } from '@/lib/problems'
import { buildSubmissionHref } from '@/lib/submissions'
import type { Compiler } from '@/lib/jutge_api_client'

type SubmissionDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    problemId: string
    compilers: Compiler[]
    defaultCompilerId?: string | null
}

export function SubmissionDialog({
    open,
    onOpenChange,
    problemId,
    compilers,
    defaultCompilerId,
}: SubmissionDialogProps) {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [annotation, setAnnotation] = useState('')
    const [compilerId, setCompilerId] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const activeCompilers = useMemo(
        () => compilers.filter((compiler) => !getCompilerStatus(compiler).defunct),
        [compilers],
    )
    const compilerIds = useMemo(() => activeCompilers.map((compiler) => compiler.compiler_id), [activeCompilers])

    useEffect(() => {
        if (open && activeCompilers.length > 0) {
            setCompilerId(pickPreferredId(compilerIds, defaultCompilerId))
        }
    }, [open, activeCompilers.length, compilerIds, defaultCompilerId])

    function resetForm() {
        setFile(null)
        setAnnotation('')
        setCompilerId(pickPreferredId(compilerIds, defaultCompilerId))
        setErrorMessage(null)
    }

    function handleOpenChange(next: boolean) {
        onOpenChange(next)
        if (!next) {
            resetForm()
        }
    }

    function handleSubmit() {
        setErrorMessage(null)

        if (!file) {
            setErrorMessage('Please select a source file.')
            return
        }

        if (!compilerId) {
            setErrorMessage('Please select a compiler.')
            return
        }

        startTransition(async () => {
            const result = await submitSolutionAction({
                problem_id: problemId,
                compiler_id: compilerId,
                annotation,
                file,
            })

            if (!result.ok) {
                setErrorMessage(result.error)
                return
            }

            toast.success(`Submission ${result.submission_id} queued.`)
            handleOpenChange(false)
            router.push(buildSubmissionHref(problemId, result.submission_id))
        })
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="w-full min-w-0 overflow-hidden p-6 sm:max-w-md">
                <DialogHeader className="min-w-0">
                    <DialogTitle>New submission</DialogTitle>
                    <DialogDescription>
                        Submit a solution for <ProblemIdLabel problemId={problemId} />.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-w-0 flex-col gap-4">
                    <div className="grid min-w-0 gap-1.5">
                        <Label>Source file</Label>
                        <Dropzone
                            onDrop={(addedFiles: File[]) => {
                                if (addedFiles.length >= 1) {
                                    setFile(addedFiles[addedFiles.length - 1])
                                    setErrorMessage(null)
                                }
                            }}
                        >
                            {() => (
                                <div className="flex h-28 w-full flex-col items-center justify-center rounded-lg px-4 text-xs text-muted-foreground">
                                    <CloudUploadIcon className="size-8 stroke-[1.5]" aria-hidden />
                                    <div className="pt-2 text-center">
                                        Drag and drop your source file here <b>or</b> click to select.
                                    </div>
                                </div>
                            )}
                        </Dropzone>
                        {file ? (
                            <div className="mt-1 flex min-w-0 flex-row items-center gap-2 overflow-hidden rounded border p-1 text-sm">
                                <Badge variant="secondary" className="min-w-0 truncate">
                                    {file.name}
                                </Badge>
                                <Badge variant="secondary">{file.type || 'unknown'}</Badge>
                                <Badge variant="secondary">{filesize(file.size, { standard: 'jedec' })}</Badge>
                                <div className="flex-grow" />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setFile(null)}
                                    aria-label="Remove file"
                                >
                                    <TrashIcon />
                                </Button>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid min-w-0 gap-1.5">
                        <Label htmlFor="submission-compiler">Compiler</Label>
                        <Select value={compilerId} onValueChange={setCompilerId}>
                            <SelectTrigger id="submission-compiler" className="w-full min-w-0">
                                <SelectValue placeholder="Select a compiler" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeCompilers.map((compiler) => (
                                    <SelectItem key={compiler.compiler_id} value={compiler.compiler_id}>
                                        {compiler.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid min-w-0 gap-1.5">
                        <Label htmlFor="submission-annotation">Annotation</Label>
                        <Input
                            id="submission-annotation"
                            value={annotation}
                            onChange={(e) => setAnnotation(e.target.value)}
                            placeholder="Optional note for this submission"
                        />
                    </div>

                    {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
                </div>

                <SmoothButton
                    type="button"
                    variant="candy"
                    color="blue"
                    onClick={handleSubmit}
                    disabled={pending || !file}
                    className="mt-4 w-full min-w-0"
                >
                    <SendIcon className="size-4" aria-hidden />
                    {pending ? 'Submitting…' : 'Submit'}
                </SmoothButton>
            </DialogContent>
        </Dialog>
    )
}
