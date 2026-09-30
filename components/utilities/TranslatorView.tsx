'use client'

import { useAuth } from '@/components/AuthProvider'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import jutge from '@/lib/jutge'
import { resolveTranslateLanguageId, translateLanguageName, translateLanguages } from '@/lib/translateLanguages'
import { ArrowLeftRightIcon, ClipboardCopyIcon, LanguagesIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const DETECT_LANGUAGE = 'auto'

export function TranslatorView() {
    const { profile } = useAuth()
    const [from, setFrom] = useState(DETECT_LANGUAGE)
    const [to, setTo] = useState(() => resolveTranslateLanguageId(profile?.language_id) ?? 'en')
    const [source, setSource] = useState('')
    const [translation, setTranslation] = useState('')
    const [detectedFrom, setDetectedFrom] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const resolvedFrom =
        from === DETECT_LANGUAGE ? (detectedFrom ? resolveTranslateLanguageId(detectedFrom) : null) : from
    const canSwap = resolvedFrom != null && resolvedFrom !== to

    async function handleTranslate() {
        if (!source.trim()) {
            setError('Enter some text to translate.')
            return
        }
        if (!resolveTranslateLanguageId(to)) {
            setError('Choose a target language.')
            return
        }

        setError(null)
        setPending(true)
        try {
            const result = await jutge.misc.translate({ text: source, from, to })
            setTranslation(result.text)
            setDetectedFrom(result.from ? (resolveTranslateLanguageId(result.from) ?? result.from) : null)
        } catch (caught: unknown) {
            setError(caught instanceof Error ? caught.message : 'Translation failed.')
        } finally {
            setPending(false)
        }
    }

    function swapLanguages() {
        if (!resolvedFrom || resolvedFrom === to) return
        setFrom(to)
        setTo(resolvedFrom)
        setSource(translation)
        setTranslation(source)
        setDetectedFrom(null)
    }

    async function copyTranslation() {
        if (!translation) return
        try {
            await navigator.clipboard.writeText(translation)
            toast.success('Translation copied.')
        } catch {
            setError('Could not copy the translation.')
        }
    }

    const detectedLabel = from === DETECT_LANGUAGE && detectedFrom ? translateLanguageName(detectedFrom) : null

    return (
        <form
            className="mt-4 flex flex-col gap-4"
            aria-busy={pending}
            onSubmit={(event) => {
                event.preventDefault()
                if (!pending) void handleTranslate()
            }}
        >
            <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <div className="flex min-w-0 flex-col gap-4">
                    <Label htmlFor="translator-from">From</Label>
                    <Select value={from} onValueChange={setFrom} disabled={pending}>
                        <SelectTrigger id="translator-from" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={DETECT_LANGUAGE}>Detect language</SelectItem>
                            {translateLanguages.map((language) => (
                                <SelectItem key={language.id} value={language.id}>
                                    {language.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Textarea
                        id="translator-source"
                        value={source}
                        onChange={(event) => setSource(event.target.value)}
                        placeholder="Text to translate"
                        aria-label="Text to translate"
                        disabled={pending}
                        className="min-h-64"
                    />
                    <div className="flex items-center justify-end gap-3">
                        {detectedLabel ? (
                            <p className="mr-auto text-sm text-muted-foreground">Detected language: {detectedLabel}</p>
                        ) : null}
                        <SmoothButton
                            type="submit"
                            color="accent"
                            variant="candy"
                            loading={pending}
                            prefix={<LanguagesIcon className="size-4" aria-hidden />}
                            className="w-48"
                        >
                            {pending ? 'Translating…' : 'Translate'}
                        </SmoothButton>
                    </div>
                </div>

                <div className="flex justify-center">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SmoothButton
                                    type="button"
                                    variant="outline"
                                    color="neutral"
                                    size="icon"
                                    aria-label="Swap languages"
                                    disabled={!canSwap || pending}
                                    onClick={swapLanguages}
                                >
                                    <ArrowLeftRightIcon aria-hidden />
                                </SmoothButton>
                            </TooltipTrigger>
                            <TooltipContent>Swap languages</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="flex min-w-0 flex-col gap-4">
                    <Label htmlFor="translator-to">To</Label>
                    <Select value={to} onValueChange={setTo} disabled={pending}>
                        <SelectTrigger id="translator-to" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {translateLanguages.map((language) => (
                                <SelectItem key={language.id} value={language.id}>
                                    {language.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Textarea
                        id="translator-result"
                        value={translation}
                        readOnly
                        placeholder="Translation"
                        aria-label="Translation"
                        className="min-h-64"
                    />
                    <div className="flex justify-end">
                        <SmoothButton
                            type="button"
                            variant="outline"
                            color="neutral"
                            disabled={!translation || pending}
                            onClick={() => void copyTranslation()}
                            prefix={<ClipboardCopyIcon className="size-4" aria-hidden />}
                            className="w-48"
                        >
                            Copy
                        </SmoothButton>
                    </div>
                    <p className="sr-only" aria-live="polite">
                        {translation ? 'Translation updated.' : ''}
                    </p>
                </div>
            </div>

            {error ? (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            ) : null}
        </form>
    )
}
