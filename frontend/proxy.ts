'use server'

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/new'];

const authRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
	console.log("[proxy.ts:proxy]", { pathname: request.nextUrl.pathname });
	const token = request.cookies.get('token')?.value;
	const { pathname } = request.nextUrl;

	if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(loginUrl);
	}

	if (authRoutes.includes(pathname) && token) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
};