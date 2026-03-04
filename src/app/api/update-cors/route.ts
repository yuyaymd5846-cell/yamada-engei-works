import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Missing Supabase environment variables for admin operations' }, { status: 500 })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Supabase v2 Javascript client bucket update
        // We set public to true and allowedMimeTypes to images
        const { data, error } = await supabaseAdmin
            .storage
            .updateBucket('work-photos', {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
                fileSizeLimit: 10485760 // 10MB
            })

        // Note: The supabase-js client doesn't directly expose a `updateBucketCors` method in the standard API.
        // If the above doesn't work to set CORS implicitly (which often happens when making a bucket public),
        // we might need to fallback to guiding the user through the UI again or using the REST API directly.

        if (error) {
            return NextResponse.json({ error: error.message, details: error }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Bucket work-photos updated successfully.', data })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
