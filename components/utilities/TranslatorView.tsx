'use client'

import { useAuth } from '@/components/AuthProvider'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import jutge from '@/lib/jutge'
import { resolveTranslateLanguageId, translateLanguageName, translateLanguages } from '@/lib/translateLanguages'
import { ArrowLeftRightIcon, CircleStopIcon, ClipboardCopyIcon, LanguagesIcon, Volume2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const DETECT_LANGUAGE = 'auto'

/** Google Translate codes that differ from the BCP 47 tags speech engines expect. */
const speechLanguageTags: Record<string, string> = {
    iw: 'he',
    jw: 'jv',
}

function speechLanguageTag(languageId: string): string {
    return speechLanguageTags[languageId] ?? languageId
}

function pickSpeechVoice(languageTag: string): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices()
    const tag = languageTag.toLowerCase()
    const exact = voices.find((voice) => voice.lang.toLowerCase() === tag)
    if (exact) return exact
    const prefix = tag.split('-')[0]
    return voices.find((voice) => voice.lang.toLowerCase().split('-')[0] === prefix) ?? null
}

export function TranslatorView() {
    const { profile } = useAuth()
    const [from, setFrom] = useState(DETECT_LANGUAGE)
    const [to, setTo] = useState(() => resolveTranslateLanguageId(profile?.language_id) ?? 'en')
    const [source, setSource] = useState('')
    const [translation, setTranslation] = useState('')
    const [detectedFrom, setDetectedFrom] = useState<string | null>(null)
    const [pending, setPending] = useState(false)
    const [reading, setReading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

    useEffect(() => {
        if (!('speechSynthesis' in window)) return
        window.speechSynthesis.getVoices()
        const onVoices = () => {
            window.speechSynthesis.getVoices()
        }
        window.speechSynthesis.addEventListener('voiceschanged', onVoices)
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
            utteranceRef.current = null
            window.speechSynthesis.cancel()
        }
    }, [])

    function stopReading() {
        utteranceRef.current = null
        if ('speechSynthesis' in window) window.speechSynthesis.cancel()
        setReading(false)
    }

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

        stopReading()
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
        stopReading()
        setFrom(to)
        setTo(resolvedFrom)
        setSource(translation)
        setTranslation(source)
        setDetectedFrom(null)
    }

    function readTranslation() {
        if (!translation) return
        if (!('speechSynthesis' in window)) {
            setError('Speech is not available in this browser.')
            return
        }
        if (reading) {
            stopReading()
            return
        }

        const utterance = new SpeechSynthesisUtterance(translation)
        utterance.lang = speechLanguageTag(to)
        utterance.rate = 1.1 // default is 1; valid range 0.1-10
        const voice = pickSpeechVoice(utterance.lang)
        if (voice) utterance.voice = voice
        utterance.onend = () => {
            if (utteranceRef.current !== utterance) return
            utteranceRef.current = null
            setReading(false)
        }
        utterance.onerror = (event) => {
            if (utteranceRef.current !== utterance) return
            utteranceRef.current = null
            setReading(false)
            if (event.error === 'canceled' || event.error === 'interrupted') return
            setError('Could not read the translation.')
        }

        utteranceRef.current = utterance
        setReading(true)
        setError(null)
        window.speechSynthesis.speak(utterance)
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
                    <Select
                        value={to}
                        onValueChange={(value) => {
                            stopReading()
                            setTo(value)
                        }}
                        disabled={pending}
                    >
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
                    <div className="flex flex-wrap justify-end gap-3">
                        <SmoothButton
                            type="button"
                            variant="outline"
                            color="neutral"
                            disabled={!translation || pending}
                            aria-pressed={reading}
                            onClick={readTranslation}
                            prefix={
                                reading ? (
                                    <CircleStopIcon className="size-4" aria-hidden />
                                ) : (
                                    <Volume2Icon className="size-4" aria-hidden />
                                )
                            }
                            className="w-36"
                        >
                            {reading ? 'Stop' : 'Speak'}
                        </SmoothButton>
                        <SmoothButton
                            type="button"
                            variant="outline"
                            color="neutral"
                            disabled={!translation || pending}
                            onClick={() => void copyTranslation()}
                            prefix={<ClipboardCopyIcon className="size-4" aria-hidden />}
                            className="w-36"
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
