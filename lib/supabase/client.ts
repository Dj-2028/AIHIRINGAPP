import { createBrowserClient as createBrowserClientSsr } from "@supabase/ssr";

export function createBrowserClient() {
  return createBrowserClientSsr(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
