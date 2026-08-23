import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Sunucu tarafı Supabase istemcisi (server component / route handler).
 * Oturum çerezleri Next'in cookie store'u üzerinden taşınır.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server component'ten çağrıldığında cookie yazılamaz.
            // Oturum yenileme middleware'de yapıldığı için bu güvenle yutulabilir.
          }
        },
      },
    },
  );
}
