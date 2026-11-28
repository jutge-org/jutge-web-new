'use client'

import { adminSetPassword } from '@/lib/administrator/client'
import HtmlEditor from '@/components/administrator/HtmlEditor'
import SmoothButton from '@/components/smoothui/smooth-button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { KeyRoundIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import zxcvbn, { type ZXCVBNResult } from 'zxcvbn'

export default function ChangePasswordView() {
    const router = useRouter()
    const initialPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2, 6)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState(initialPassword)
    const [message, setMessage] = useState('')
    const [strength, setStrength] = useState<ZXCVBNResult>(zxcvbn(initialPassword))

    const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
    const strengthColor = ['text-red-700', 'text-red-500', 'text-yellow-500', 'text-orange-400', 'text-green-700']

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email.includes('@')) {
            toast.error('Invalid email')
            return
        }
        const score = zxcvbn(password)
        if (score.score !== 4) {
            toast.error('Password must be very strong')
            return
        }
        const body = message === '<p></p>' ? '' : message
        try {
            await adminSetPassword({ email, password, message: body })
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Some error occurred')
            return
        }
        toast.success(`Password for ${email} has been changed`)
        router.push('/administrator/users')
    }

    return (
        <div className="flex min-h-[calc(100vh-20rem)] flex-col items-center justify-center">
            <div className="w-full p-4 sm:w-[500px]">
                <h1 className="text-xl font-semibold">Change password</h1>
                <p className="pb-4 text-sm text-muted-foreground">
                    This will set a given password for a given user. If the message is not empty, the user will receive
                    an email with that message (but not necessarily with the new password).
                </p>
                <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
                    <FieldGroup>
                        <Field>
                            <FieldLabel>Email</FieldLabel>
                            <Input
                                value={email}
                                placeholder="user@domain.com"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Password</FieldLabel>
                            <Input
                                value={password}
                                className="font-mono"
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setStrength(zxcvbn(e.target.value))
                                }}
                            />
                            <div className={`w-full text-end text-xs ${strengthColor[strength.score]}`}>
                                {strengthLabel[strength.score]}
                            </div>
                        </Field>
                        <Field>
                            <FieldLabel>Message</FieldLabel>
                            <HtmlEditor value={message} onChange={setMessage} />
                        </Field>
                    </FieldGroup>
                    <div className="flex justify-end pt-4">
                        <SmoothButton type="submit" color="blue" variant="candy" size="xs" className="w-44">
                            <KeyRoundIcon />
                            Change password
                        </SmoothButton>
                    </div>
                </form>
            </div>
        </div>
    )
}
