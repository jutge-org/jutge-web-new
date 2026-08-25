import Image from 'next/image'

import { cn } from '@/lib/utils'

const sizeConfig = {
    '2xs': { width: 14, height: 14 },
    xs: { width: 16, height: 16 },
    sm: { width: 20, height: 20 },
    md: { width: 48, height: 48 },
    lg: { width: 112, height: 112 },
} as const

type ProblemIconImageProps = {
    iconUrl: string
    size?: keyof typeof sizeConfig
    className?: string
}

export function ProblemIconImage({ iconUrl, size = 'sm', className }: ProblemIconImageProps) {
    const { width, height } = sizeConfig[size]
    iconUrl = iconUrl.replace('problem-icons/', `problem-icons/sm/`)

    return (
        <Image
            src={iconUrl}
            alt=""
            className={cn('block max-w-none shrink-0 rounded-sm object-contain', className)}
            width={width}
            height={height}
            style={{ width, height }}
            loading={size === 'lg' ? 'eager' : undefined}
        />
    )
}
