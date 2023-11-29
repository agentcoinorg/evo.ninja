import { NextApiRequest, NextApiResponse } from "next";
import { createSupabaseServerClient } from "../../../src/supabase/createServerClient";

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
        const supabase = createSupabaseServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return res.redirect(`${origin}${next}`);
        }
      }

      // return the user to an error page with instructions
      return res.redirect(`${origin}/auth/auth-code-error`);
  }
}
