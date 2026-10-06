import { cn } from '@/lib/utils'

/** Outline SmoothButtons in the sticky app header — transparent fill so bar gradients show through. */
export const headerToolbarOutlineButtonClassName =
    'bg-transparent hover:bg-muted/40 hover:text-foreground'

export const headerToolbarIconButtonClassName = cn(
    'size-8 [&_svg]:size-4.5',
    headerToolbarOutlineButtonClassName,
)

export const headerToolbarMenuIconButtonClassName = cn(
    'size-8 [&_svg]:size-4',
    headerToolbarOutlineButtonClassName,
)
