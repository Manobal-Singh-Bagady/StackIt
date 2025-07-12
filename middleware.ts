import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

// Routes that require authentication
const protectedRoutes = ['/settings']

// Routes that should redirect to home if already authenticated
const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const token = request.cookies.get('auth-token')?.value

	// Check if user is authenticated
	const isAuthenticated = token && verifyToken(token)

	// Redirect authenticated users away from auth pages
	if (isAuthenticated && authRoutes.includes(pathname)) {
		return NextResponse.redirect(new URL('/', request.url))
	}

	// Redirect unauthenticated users away from protected pages
	if (!isAuthenticated && protectedRoutes.includes(pathname)) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
}
