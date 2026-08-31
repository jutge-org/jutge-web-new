'use client'

import ProductCard from '@/components/smoothui/product-card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'

type MerchProduct = {
    id: string
    image: string
    title: string
    subtitle: string
    price: number
    badge?: string
    linkUrl?: string
    linkText?: string
}

const PRODUCTS: MerchProduct[] = [
    {
        id: 'stickers',
        image: '/svg/AC.svg',
        title: 'AC/WA Stickers',
        subtitle: '5 units, ⌀50mm',
        price: 9,
        linkUrl: 'https://www.stickermule.com/es/jutgeorg?filter=pegatinas',
        linkText: 'Sticker Mule',
        badge: 'Classic',
    },
    {
        id: 'tshirts',
        image: '/shop/t-shirt.png',
        title: 'AC/WA T-shirts',
        subtitle: '(choose color & size)',
        price: 17,
        linkUrl: 'https://www.stickermule.com/es/jutgeorg?filter=camisetas',
        linkText: 'Sticker Mule',
        badge: 'New',
    },
    {
        id: 'coasters',
        image: '/shop/coaster.png',
        title: 'AC/WA Coasters',
        subtitle: '(10 units, ⌀94mm)',
        price: 17,
        linkUrl: 'https://www.stickermule.com/es/jutgeorg?filter=posavasos',
        linkText: 'Sticker Mule',
        badge: 'New',
    },
    {
        id: 'mug',
        image: '/shop/mug.png',
        title: 'Coffee mug',
        subtitle: '1 unit',
        price: 15,
        badge: 'Sale',
    },
    {
        id: '3d-model',
        image: '/shop/model.png',
        title: 'Jutge toy',
        subtitle: '1 unit, 5cm tall',
        price: 40,
        badge: 'New',
    },
]

type MerchandisingBlockProps = {
    embedded?: boolean
    title?: boolean
}

export function MerchandisingBlock({ embedded = false, title = true }: MerchandisingBlockProps) {
    const shouldReduceMotion = useReducedMotion()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
    const headingId = embedded ? 'about-merchandising-heading' : 'home-merchandising-heading'

    function handleAddToCart(product: MerchProduct) {
        if (product.linkUrl) {
            window.open(product.linkUrl, '_blank')
            return
        }
        setSelectedTitle(product.title)
        setDialogOpen(true)
    }

    return (
        <section
            id={embedded ? 'about-merchandising' : 'home-merchandising'}
            aria-labelledby={headingId}
            className="scroll-mt-14"
        >
            <div className={embedded ? undefined : 'mx-auto max-w-6xl px-6'}>
            {title && (
                <motion.div
                    className="mx-auto mb-12 max-w-2xl text-center"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id={headingId}
                    >
                        Merchandising
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Stickers for your laptop, a t-shirt for your body, a mug for your coffee, and a figure for your desk. 
                    </p>
                </motion.div>
                )}

                <ul className="mx-auto grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:max-w-4xl lg:grid-cols-5">
                    {PRODUCTS.map((product) => (
                        <li key={product.id}>
                            <ProductCard
                                badge={product.badge}
                                currency="€"
                                image={product.image}
                                onAddToCart={() => handleAddToCart(product)}                                
                                price={product.price}
                                title={product.title}
                                subtitle={product.subtitle}
                                linkUrl={product.linkUrl}
                                linkText={product.linkText}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Order {selectedTitle}</DialogTitle>
                        <DialogDescription className="text-pretty leading-relaxed py-4">
                            This product is only available for order.
                            Reach out to the Jutge.org administrators to order your product when available.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter showCloseButton />
                </DialogContent>
            </Dialog>
        </section>
    )
}
