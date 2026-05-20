import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { serverEnv } from './lib/env';

const PUBLIC_PATHS = ['/sign-in', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => {
          for (const c of cookies) {
            request.cookies.set(c.name, c.value);
            if (c.options) {
              response.cookies.set(c.name, c.value, c.options);
            } else {
              response.cookies.set(c.name, c.value);
            }
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname.startsWith('/sign-in')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.searchParams.delete('next');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
