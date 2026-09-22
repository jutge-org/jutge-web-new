export type AboutTab =
    | 'index'
    | 'telegram'
    | 'terms-of-service'
    | 'honor-code'
    | 'accessibility'
    | 'gallery'
    | 'publications'
    | 'merchandising'
    | 'credits'

export type AboutNavItem = {
    tab: AboutTab
    label: string
    href: string
    external?: boolean
}

export const aboutNavItems: AboutNavItem[] = [
    { tab: 'index', label: 'Index', href: '/about' },
    { tab: 'telegram', label: 'Telegram channel', href: 'https://t.me/jutge', external: true },
    { tab: 'terms-of-service', label: 'Terms of Service', href: '/about/terms-of-service' },
    { tab: 'honor-code', label: 'Honor Code', href: '/about/honor-code' },
    { tab: 'accessibility', label: 'Accessibility', href: '/about/accessibility' },
    { tab: 'gallery', label: 'Gallery', href: '/about/gallery' },
    { tab: 'publications', label: 'Publications', href: '/about/publications' },
    { tab: 'merchandising', label: 'Merchandising', href: '/about/merchandising' },
    { tab: 'credits', label: 'Credits', href: '/about/credits' },
]

export const aboutIndexItems = [
    {
        href: 'https://t.me/+TPaxNOQFmhx1oDIz',
        label: 'Telegram channel',
        description: 'Join the Jutge.org Telegram community',
        external: true,
    },
    {
        href: '/about/terms-of-service',
        label: 'Terms of Service',
        description: 'Terms governing use of Jutge.org',
    },
    {
        href: '/about/honor-code',
        label: 'Honor Code',
        description: 'Academic integrity expectations for users',
    },
    {
        href: '/about/accessibility',
        label: 'Accessibility',
        description: 'Accessibility statement and how to report barriers',
    },
    {
        href: '/about/gallery',
        label: 'Gallery',
        description: 'Servers, icons, and other Jutge.org imagery',
    },
    {
        href: '/about/publications',
        label: 'Publications',
        description: 'Research and publications about Jutge.org',
    },
    {
        href: '/about/merchandising',
        label: 'Merchandising',
        description: 'Stickers, t-shirts, and other Jutge.org merch',
    },
    {
        href: '/about/credits',
        label: 'Credits',
        description: 'People behind Jutge.org',
    },
] as const

export function jutgeAsset(path: string): string {
    return `https://jutge.org${path.startsWith('/') ? path : `/${path}`}`
}

export type CreditPerson = {
    name: string
    image?: string
    role?: string
    affiliation?: string
}

export const maintenanceCredits: CreditPerson[] = [
    {
        name: 'Jordi Petit',
        image: '/credits/jpetit.webp',
        affiliation: 'Departament de Ciències de la Computació\nUniversitat Politècnica de Catalunya',
    },
    {
        name: 'Salvador Roura',
        image: '/credits/roura.webp',
        affiliation: 'Departament de Ciències de la Computació\nUniversitat Politècnica de Catalunya',
    },
    {
        name: 'Pau Fernández',
        image: '/credits/pauek.webp',
        affiliation: 'Departament de Ciències de la Computació\nUniversitat Politècnica de Catalunya',
    },
]

export const developerCredits: CreditPerson[] = [
    { name: 'Jordi Petit', image: '/credits/jpetit.webp' },
    { name: 'Salvador Roura', image: '/credits/roura.webp' },
    { name: 'Omer Giménez', image: '/credits/omer.webp' },
    { name: 'Alex Catarineu' },
    { name: 'Victor Guerrero' },
    { name: 'Albert Vaca', image: '/credits/vaka.webp' },
    { name: 'Javier de San Pedro', image: '/credits/jspedro.webp' },
    { name: 'Enric Cusell', image: '/credits/ecusell.webp' },
    { name: 'Jan Mas Rovira', image: '/credits/janmas.webp' },
    { name: 'Albert Lobo', image: '/credits/lobo.webp' },
    { name: 'Anaga Mani' },
    { name: 'Dyvia Venkataramani' },
    { name: 'Cristina Raluca Vijulie', image: '/credits/cristina.webp' },
    { name: 'Jordi Reig Callis', image: '/credits/jreig.webp' },
    { name: 'Alejandro Adán Navarro', image: '/credits/adan.webp' },
    { name: 'Pau Fernández', image: '/credits/pauek.webp' },
    { name: 'Carlos Martín Tresànchez' },
    { name: 'Miquel Torner Viñals', image: '/credits/mtorner.webp' },
    { name: 'Yeray Zalaya Domingo', image: '/credits/yeray.webp' },
]

export type PictureItem = {
    src: string
    title: string
    description: string
    alt: string
}

export const pictureItems: PictureItem[] = [
    {
        src: '/gallery/servers-fib.webp',
        title: 'The current Jutge servers',
        description: 'These are the current servers for Jutge.org at FIB.',
        alt: 'Server',
    },
    {
        src: '/gallery/servers-cs.webp',
        title: 'The old Jutge servers',
        description: 'These old CS servers for Jutge.org were located in their rack in the CPD of the Omega building.',
        alt: 'Server',
    },
    {
        src: '/verdicts/svg/AC.svg',
        title: 'The Green Light icon',
        description: 'Iconic green light of Jutge.org.',
        alt: 'Green light',
    },
    {
        src: '/verdicts/svg/WA.svg',
        title: 'The Wrong Answer icon',
        description: 'Iconic red light of Jutge.org.',
        alt: 'Red light',
    },
    {
        src: '/svg/jutge.svg',
        title: 'Classic Jutge.org icon',
        description: 'The classic Jutge.org icon.',
        alt: 'Classic',
    },
    {
        src: '/jutge/modern.webp',
        title: 'Modern Jutge.org icon',
        description: 'The modern Jutge.org icon.',
        alt: 'Modern',
    },
]

export type PublicationItem = {
    html: string
}

export const publications: PublicationItem[] = [
    {
        html: `Francesc Madrid, Xavier Casas, Miquel Torner, Jordi Petit, and Jordi Cortadella. An Online Learning Platform for Digital Circuits. In <cite>41st Conference on Design of Circuits and Integrated Systems (DCIS 2026)</cite>, 2026.`,
    },
    {
        html: `J. Petit, S. Roura, J. Carmona, J. Cortadella, A. Duch, O. Gimenez, A. Mani, J. Mas, E. Rodriguez-Carbonella, A. Rubio, J. de San Pedro, and D. Venkataramani. <a href="http://ieeexplore.ieee.org/document/7968379">Jutge.org: Characteristics and experiences</a>. IEEE Transactions on Learning Technologies, PP(99), 2017.`,
    },
    {
        html: `M.&nbsp;J. Blesa, A.&nbsp;Duch, J.&nbsp;Gabarró, J.&nbsp;Petit, and M.&nbsp;Serna. <a href="http://hdl.handle.net/10045/125676">Análisis de la evolución de un curso: productividad y desigualdad</a>. In <cite>Actas de las XXII Jornadas sobre Enseñanza Universitaria de la Informática</cite>, volume 1, pages 161–168, 2016.`,
    },
    {
        html: `Marta Ruiz Costa-jussà, Lluis Formiga, Oriol Torrillas, Jordi Petit, and José Adrián Rodríguez Fonollosa. <a href="http://dx.doi.org/10.19173/irrodl.v16i6.2145">A MOOC on approaches to machine translation</a>. <cite>International Review of Research in Open and Distributed Learning</cite>, 16(6), December 2015.`,
    },
    {
        html: `M.&nbsp;J. Blesa, A.&nbsp;Duch, J.&nbsp;Gabarró, J.&nbsp;Petit, and M.&nbsp;J. Serna. <a href="http://dx.doi.org/10.1007/978-3-319-29585-5_18">Continuous assessment in the evolution of a CS1 course: The pass rate/workload ratio</a>. In <cite>Computer Supported Education - 7th International Conference, CSEDU 2015, Lisbon, Portugal, May 23-25, 2015, Revised Selected Papers</cite>, volume 583 of <em>Communications in Computer and Information Science</em>, pages 313–332. Springer, 2015.`,
    },
    {
        html: `A.&nbsp;Duch, J.&nbsp;Gabarró, J.&nbsp;Petit, M.&nbsp;J. Blesa, and M.&nbsp;J. Serna. <a href="http://dx.doi.org/10.5220/0005432300570066">A cost-benefit analysis of continuous assessment</a>. In <cite>Proceedings of the 7th International Conference on Computer Supported Education</cite>, pages 57–66. SCITEPRESS, 2015.`,
    },
    {
        html: `Marta&nbsp;R. Costa-Jussà, Lluís Formiga, Jordi Petit, and José&nbsp;A.R. Fonollosa. <a href="http://dx.doi.org/10.1007/978-3-319-13647-9_10">Detailed description of the development of a MOOC in the topic of statistical machine translation</a>. In Alexander Gelbukh, Félix&nbsp;Castro Espinoza, and Sofía&nbsp;N. Galicia-Haro, editors, <em>Human-Inspired Computing and Its Applications</em>, volume 8856 of <em>Lecture Notes in Computer Science</em>, pages 92-98. Springer International Publishing, 2014.`,
    },
    {
        html: `A. Mani, D. Venkataramani, J. Petit and S. Roura. Better Feedback for Educational Online Judges. CSEDU 2014.`,
    },
    {
        html: `D. Larraz, E. Rodríguez-Carbonell and A. Rubio. <a href="https://www.lsi.upc.edu/~erodri/webpage/papers/vmcai13.pdf">SMT-Based Array Invariant Generation</a>. In 14th International Conference on Verification, Model Checking, and Abstract Interpretation (VMCAI'13), January 2013, Rome (Italy).`,
    },
    {
        html: `A.&nbsp;Duch, J.&nbsp;Petit, E.&nbsp;Rodríguez-Carbonell, and S.&nbsp;Roura. <a href="http://dx.doi.org/10.5220/0004389604370442">Fun in CS2</a>. In <cite>Proceedings of the 5th International Conference on Computer Supported Education (CSEDU'13)</cite>, pages 437-442. SCIETEPRESS, 2013.`,
    },
    {
        html: `J.&nbsp;Carmona, J.&nbsp;Cortadella, J.&nbsp;de&nbsp;San&nbsp;Pedro, and J.&nbsp;Petit. <a href="http://dx.doi.org/10.1145/2157136.2157268">Integrating formal verification in an on-line judge for e-learning digital circuit design</a>. In <cite>Proc. of the 43rd ACM Technical Symposium on Computer Science Education (SIGCSE-2012)</cite>, pages 451-456. Association for Computing Machinery, 2012.`,
    },
    {
        html: `O.&nbsp;Giménez, J.&nbsp;Petit, and S.&nbsp;Roura. <a href="http://dx.doi.org/10.1145/2157136.2157267">Jutge.org: An educational programming judge</a>. In <cite>Proc. of the 43rd ACM Technical Symposium on Computer Science Education (SIGCSE-2012)</cite>, pages 445-450. Association for Computing Machinery, 2012.`,
    },
    {
        html: `O.&nbsp;Giménez, J.&nbsp;Petit, and S.&nbsp;Roura. Programació 1: A pure problem-oriented approach for a CS1 course. In C.&nbsp;Hermann, T.&nbsp;Lauer, T.&nbsp;Ottmann, and M.&nbsp;Welte, editors, <cite>Proc. of the Informatics Education Europe IV (IEE-2009)</cite>, pages 185-192, Freiburg, 2009. ISBN: 978-84-692-2758-9.`,
    },
    {
        html: `J.&nbsp;Petit and S.&nbsp;Roura. <a href="http://hdl.handle.net/2099/7870">Programación-1: Una asignatura orientada a la resolución de problemas</a>. In I.&nbsp;Jacob and D.&nbsp;López, editors, <cite>XV Jornadas de Enseñanza Universitaria de la Informática</cite>, pages 185-192. ISBN: 978-84-692-2758-9, 2009.`,
    },
    {
        html: `A. Catarineu, J. Petit. <a href="${jutgeAsset('/documentation/guide.pdf')}">Jutge.org: Instructor's Guide</a>.`,
    },
]
