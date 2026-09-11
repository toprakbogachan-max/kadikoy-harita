---
description: Mekan araştırma hattını baştan sona koştur — keşif, doğrulama, Excel, fotoğraf, yorum, pin
argument-hint: [kaç mekan] [semt/kategori notu]
allowed-tools: Skill, Read, Write, Bash, Task
---

`mekan-arastirma` skill'ini yükle ve hattı baştan sona koştur.

**Bu turun kapsamı:** $ARGUMENTS
(boşsa: 5 mekan, Moda + Kadıköy, kategori kısıtı yok)

Sırayla:

1. **Faz 0** — `references/gecmis.md`'nin yönlendirdiği ikinci beyin dosyasını oku.
   Orada geçen mekanları bu tura alma.
2. **Faz 1** — sosyal medya öncelikli keşif (TikTok → Instagram → Oggusto → Gurman Atlas).
3. **Faz 2** — her adayı Google Haritalar'da doğrula.
4. **KAPI A** — `scripts/havuz.py` ile Excel'i üret, `recalc` et, teslim et ve
   **hangi mekanlarla devam edileceğini sor. Cevap gelmeden ilerleme.**
5. **Faz 3–4** — seçilenler için fotoğraf (2 ambiyans + 2 yemek + 1 opsiyonel, yazısız) ve
   son 6 ayın yorum analizi.
6. **KAPI B** — teslim et ve **pin atılsın mı diye sor.**
7. **Faz 5** — onay gelirse pinleri oluştur. Önce PROFİL'den hangi hesapla girili olduğunu
   doğrula ve kullanıcıya söyle.
8. **Kapanış** — geçmiş dosyasını bu turun sonucuyla güncelle; hattın kendisinde bir şey
   kırıldıysa `references/` altındaki ilgili dosyayı düzelt.

Tarayıcı işine başlamadan `resize_window` ile pencereyi 1512 genişliğe sabitle —
harita piksel hesapları buna bağlı.
