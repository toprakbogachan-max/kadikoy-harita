import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * E-posta onay bağlantısının döndüğü yer.
 *
 * Önceden böyle bir rota YOKTU ve signUp'a emailRedirectTo verilmiyordu:
 * Supabase projenin "Site URL" ayarına düşüyordu, o da localhost'tu. Telefondan
 * onaylayan kullanıcı localhost hatası görüyordu. Hesap yine de açılıyordu,
 * çünkü Supabase jetonu KENDİ sunucusunda doğrulayıp ondan sonra yönlendiriyor
 * — hata yalnızca son adımda, tarayıcı localhost'a gidemediği için çıkıyordu.
 *
 * İki bağlantı biçimi de karşılanıyor:
 *   token_hash + type — Supabase'in yeni önerdiği biçim, BAŞKA cihazda da
 *                       çalışıyor (e-postayı telefondan açmak gibi).
 *   code            — PKCE. Doğrulayıcı, kaydı başlatan tarayıcının
 *                     çerezinde durduğu için yalnızca aynı tarayıcıda çalışır.
 *
 * Başarılıysa oturum çerezi burada kuruluyor; kullanıcı uygulamaya giriş
 * yapmış olarak dönüyor, bir daha şifre sormuyoruz.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const jeton = searchParams.get("token_hash");
  const tur = searchParams.get("type") as EmailOtpType | null;
  const kod = searchParams.get("code");

  const db = await createClient();
  let hata: string | null;

  if (jeton && tur) {
    const { error } = await db.auth.verifyOtp({ token_hash: jeton, type: tur });
    hata = error?.message ?? null;
  } else if (kod) {
    const { error } = await db.auth.exchangeCodeForSession(kod);
    hata = error?.message ?? null;
  } else {
    hata = "Bağlantıda doğrulama bilgisi yok.";
  }

  const hedef = request.nextUrl.clone();
  hedef.pathname = "/";
  hedef.search = "";
  hedef.searchParams.set("onay", hata ? "hata" : "tamam");
  return NextResponse.redirect(hedef);
}
