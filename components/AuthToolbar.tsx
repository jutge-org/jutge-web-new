'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { SignInDialog } from '@/components/SignInDialog'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'
import { CrownIcon, GraduationCapIcon, LogIn as SignIn, LogOut as SignOut, Settings2Icon, User } from 'lucide-react'
import { dispatchOpenAppearanceSettings } from '@/lib/appearanceSettings'
import { toast } from 'sonner'

export function AuthToolbar() {
    const { user, logout } = useAuth()
    const authenticated = user !== null
    const instructor = user?.instructor ?? false
    const administrator = user?.administrator ?? false
    const userName = user?.name
    const userNickname = user?.nickname
    const router = useRouter()
    const pathname = usePathname()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [signOutPending, startSignOut] = useTransition()

    function handleSignOut() {
        startSignOut(async () => {
            await logout()
            toast.success(userName ? `Bye ${userName}, you signed out` : 'Signed out')
            if (pathname === '/') {
                router.refresh()
            } else {
                router.push('/')
            }
        })
    }

    if (authenticated) {
        return (
            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline" size="icon" aria-label="User menu">
                                    {administrator ? (
                                        <CrownIcon className="size-4.5" aria-hidden />
                                    ) : instructor ? (
                                        <GraduationCapIcon className="size-4.5" aria-hidden />
                                    ) : (
                                        <User className="size-4.5" aria-hidden />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{userName ?? 'User menu'}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent
                    align="end"
                    className="min-w-48 **:data-[slot=dropdown-menu-item]:py-1.5 **:data-[slot=dropdown-menu-item]:text-base mr-4"
                >
                    {userName ? (
                        <>
                            <DropdownMenuLabel className="text-base font-bold text-foreground">
                                {userName}
                                {userNickname ? (
                                    <span className="font-normal text-muted-foreground"> ({userNickname})</span>
                                ) : null}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                        </>
                    ) : null}
                    <DropdownMenuItem asChild>
                        <Link href="/profile">
                            <User aria-hidden />
                            Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={dispatchOpenAppearanceSettings}>
                        <Settings2Icon aria-hidden />
                        Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={signOutPending} onClick={handleSignOut}>
                        <SignOut aria-hidden />
                        Sign out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <>
            <Button
                variant="outline"
                size="icon"
                type="button"
                aria-label="Sign in"
                onClick={() => setDialogOpen(true)}
            >
                <SignIn aria-hidden />
            </Button>

            <SignInDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSignedIn={() => {
                    window.location.assign(pathname)
                }}
            />
        </>
    )
}
