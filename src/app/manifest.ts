import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '山田園芸 作業マニュアルDB',
        short_name: '山田園芸',
        description: '標準作業マニュアルと意思決定支援システム',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2e7d32',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
