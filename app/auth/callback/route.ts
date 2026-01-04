import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []; // Cookies handled by request
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
             // In this initial step we don't need to set cookies yet
          },
        },
      }
    );
    
    // Exchange the auth code for the user session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Create a response to set cookies and redirect
      const response = NextResponse.redirect(`${origin}${next}`);
      
      // We must recreate the client with full cookie access to persist the session
      const supabaseResponse = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return [] },
            setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      );
      
      // This call writes the session cookies to the response
      await supabaseResponse.auth.getSession();
      
      return response;
    }
  }

  // If error, return to error page or home
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
