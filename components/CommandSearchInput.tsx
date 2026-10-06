'use client'

import { Command as CommandPrimitive } from 'cmdk'
import { MicIcon, MicOffIcon } from 'lucide-react'
import { useCallback, useRef, type ComponentProps } from 'react'

import SmoothButton from '@/components/smoothui/smooth-button'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type CommandSearchInputProps = ComponentProps<typeof CommandPrimitive.Input>

function setNativeInputValue(input: HTMLInputElement, value: string) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
    descriptor?.set?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
}

export function CommandSearchInput({ className, onValueChange, value, ...props }: CommandSearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    const setSearchValue = useCallback(
        (text: string) => {
            if (onValueChange) {
                onValueChange(text)
                return
            }
            const input = inputRef.current
            if (!input) return
            setNativeInputValue(input, text)
        },
        [onValueChange],
    )

    const { isListening, startListening, stopListening, supported } = useSpeechRecognition(setSearchValue)

    const toggleListening = () => {
        if (isListening) {
            stopListening()
            return
        }
        if (!supported) {
            toast.error('Speech recognition is not supported in your browser')
            return
        }
        startListening()
    }

    return (
        <div data-slot="command-input-wrapper" className="p-1 pb-0">
            <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
                <div className="mr-2" />

                <CommandPrimitive.Input
                    ref={inputRef}
                    data-slot="command-input"
                    className={cn(
                        'w-full pr-1 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
                        className,
                    )}
                    value={value}
                    onValueChange={onValueChange}
                    {...props}
                />
                <InputGroupAddon align="inline-end" className="gap-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SmoothButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className={cn(
                                        'text-muted-foreground opacity-50 hover:text-muted-foreground',
                                        isListening && 'text-destructive opacity-100 hover:text-destructive',
                                    )}
                                    onClick={toggleListening}
                                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                                >
                                    {isListening ? <MicOffIcon className="size-4" /> : <MicIcon className="size-4" />}
                                </SmoothButton>
                            </TooltipTrigger>
                            <TooltipContent side="top">{isListening ? 'Stop listening' : 'Voice input'}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </InputGroupAddon>
            </InputGroup>
        </div>
    )
}
