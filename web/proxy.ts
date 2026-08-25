import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase oturum tazeleme.
 *
 * DİKKAT — Next 16'da bu dosyanın adı `middleware.ts` DEĞİL `proxy.ts`, dışa
 * aktarılan fonksiyon da `proxy` olmak zorunda. Middleware adı bu sürümde
 * kullanımdan kalktı. (Supabase dokümanları hâlâ middleware anlatıyor.)
 * Proxy Node.js çalışma zamanında koşar; `runtime` ayarı verilirse hata atar.
 *
 * Ne işe yarıyor: erişim jetonu kısa ömürlü. Tazelenmezse kullanıcı sekmeyi
 * açık bıraktığında oturumu sessizce düşer. getUser() çağrısı jetonu
 * yeniliyor, setAll da yeni çerezleri HEM isteğe HEM yanıta yazıyor —
 * ikisine birden yazılmazsa sunucu bileşenleri eski jetonu görür.
 */
export async function proxy(request: NextRequest) {
  let yanit = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(gelenler) {
          gelenler.forEach(({ name, value }) => request.cookies.set(name, value));
          yanit = NextResponse.next({ request });
          gelenler.forEach(({ name, value, options }) =>
            yanit.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  /* getUser() ŞART: getSession() çerezi doğrulamadan okuyor, jetonu
     tazelemiyor. Bu çağrı olmadan proxy hiçbir işe yaramaz. */
  await supabase.auth.getUser();

  return yanit;
}

export const config = {
  matcher: [
    /* Statik dosyalar ve görseller hariç her istek — oturum her gezinmede
       tazelensin. MapLibre worker'ı da dışarıda, o public/ altından geliyor. */
    "/((?!_next/static|_next/image|favicon.ico|maplibre/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
