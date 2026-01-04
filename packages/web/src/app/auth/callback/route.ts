import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/reader';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful authentication - redirect to intended destination
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Auth failed - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
