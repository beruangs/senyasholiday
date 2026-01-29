import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/', '/settings/', '/superadmin/', '/logout'],
        },
        sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://senyasdaddy.app'}/sitemap.xml`,
    }
}
