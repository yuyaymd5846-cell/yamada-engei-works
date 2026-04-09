import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '山田園芸 作業マニュアルDB',
        short_name: '山田園芸',
        description: '園芸作業マニュアルと日々の作業記録をまとめて管理するアプリです。',
        start_url: '/',
        display: 'standalone',
        background_color: '#fdfdfd',
        theme_color: '#2d5a27',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable',
            },
        ],
    }
}
