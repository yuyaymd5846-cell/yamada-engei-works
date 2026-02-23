import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

    if (isAuthRoute) {
        if (user) {
            // If user is logged in and tries to access login page, redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        // Allow access to login page if not logged in
        return supabaseResponse
    }

    // Define public routes here if any
    const publicRoutes = ['/api/db-check'] // Optional public API routes
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    if (!user && !isPublicRoute) {
        // If user is not logged in and tries to access any other route, redirect to login page
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
}
