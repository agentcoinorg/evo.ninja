import { CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { cookies } from "next/headers";

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      const { searchParams, origin } = new URL(req.url!);
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/";

      if (code) {
        const cookieStore = cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return cookieStore.get(name)?.value;
              },
              set(name: string, value: string, options: CookieOptions) {
                cookieStore.set({ name, value, ...options });
              },
              remove(name: string, options: CookieOptions) {
                cookieStore.delete({ name, ...options });
              },
            },
          }
        );
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return res.redirect(`${origin}${next}`);
        }
      }

      // return the user to an error page with instructions
      return res.redirect(`${origin}/auth/auth-code-error`);
  }
}
