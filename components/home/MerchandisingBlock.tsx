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
    price: number
    badge?: string
}

const PRODUCTS: MerchProduct[] = [
    {
        id: '3d-model',
        image: '/shop/model.png',
        title: 'Jutge toy (5cm tall)',
        price: 35,
        badge: 'New',
    },
    {
        id: 'mug',
        image: '/shop/mug.png',
        title: 'Coffee mug',
        price: 16,
        badge: 'Sale',
    },
    {
        id: 'ac-stickers',
        image: '/svg/AC.svg',
        title: 'AC Stickers (5 units, round 50mm)',
        price: 2,
    },
    {
        id: 'wa-stickers',
        image: '/svg/WA.svg',
        title: 'WA Stickers (5 units, round 50mm)',
        price: 2,
    },
    {
        id: 'jutge-stickers',
        image: '/svg/jutge.svg',
        title: 'Jutge Stickers (5 units, die cut 50mm)',
        price: 2,
    },
]

export function MerchandisingBlock() {
    const shouldReduceMotion = useReducedMotion()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedTitle, setSelectedTitle] = useState<string | null>(null)

    function handleAddToCart(title: string) {
        setSelectedTitle(title)
        setDialogOpen(true)
    }

    return (
        <section id="home-merchandising" aria-labelledby="home-merchandising-heading" className="scroll-mt-14">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    className="mx-auto mb-12 max-w-2xl text-center"
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                >
                    <h2
                        className="text-balance font-bold text-3xl tracking-tight text-[var(--color-brand-title)] md:text-4xl dark:text-foreground"
                        id="home-merchandising-heading"
                    >
                        Merchandising
                    </h2>
                    <p className="mt-4 text-foreground text-lg dark:text-foreground/70">
                        Stickers, mugs, and a tiny judge for your desk — limited runs from the Jutge.org workshop.
                    </p>
                </motion.div>

                <ul className="mx-auto grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:max-w-4xl lg:grid-cols-5">
                    {PRODUCTS.map((product) => (
                        <li key={product.id}>
                            <ProductCard
                                badge={product.badge}
                                currency="€"
                                image={product.image}
                                onAddToCart={() => handleAddToCart(product.title)}
                                price={product.price}
                                title={product.title}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Shopping is not available yet</DialogTitle>
                        <DialogDescription className="text-pretty leading-relaxed">
                            Online ordering is not ready yet
                            {selectedTitle ? ` — including for "${selectedTitle}"` : ''}. In the meantime, feel free to
                            reach out to the Jutge.org administrators: they sometimes have spare units on hand and are
                            happy to help when they can.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter showCloseButton />
                </DialogContent>
            </Dialog>
        </section>
    )
}
