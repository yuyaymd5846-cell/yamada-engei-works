import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const isLoginPage = request.nextUrl.pathname === '/login'
    const isPublicApi = request.nextUrl.pathname.startsWith('/api/auth-debug') ||
        request.nextUrl.pathname.startsWith('/api/db-check')

    // Allow public routes
    if (isLoginPage || isPublicApi) {
        return NextResponse.next()
    }

    // Check for auth cookie
    const authCookie = request.cookies.get('yamada-auth')
    if (!authCookie || authCookie.value !== 'authenticated') {
        // Redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
