import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Gates /eboard/* behind Supabase auth. Next.js 16 renamed middleware.ts to
// proxy.ts (the exported function is now `proxy`, not `middleware`):
// https://nextjs.org/docs/messages/middleware-to-proxy
export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // Not configured yet (pre-Phase 2) — don't block. /eboard's layout
    // shows a "not wired up" message instead of a real gate.
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && path.startsWith("/eboard") && path !== "/eboard/login") {
    return NextResponse.redirect(new URL("/eboard/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/eboard/:path*"],
};
