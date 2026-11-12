# MedipolDate

Ankara Medipol Üniversitesi öğrencilerine özel, **fotoğrafsız ve anonim** Tinder tarzı eşleşme ve sohbet uygulaması. Web üzerinden çalışır, telefonda uygulama gibi görünür.

## Özellikler

- **Kullanıcı adı ile kayıt:** E-posta gerekmez. Kullanıcı adı yalnızca giriş içindir, kimseye gösterilmez.
- **Anonim kimlik:** Fotoğraf yüklenmez. Herkes 48 çizim avatardan birini ve bir renk seçer, takma adla görünür.
- **Zorunlu olan tek alan cinsiyet.** Ad, soyad, yaş, bölüm isteğe bağlıdır.
- **Eşleştirme sinyalleri:** "Ne arıyorsun?" (ciddi / flört / arkadaşlık), serbest "Hakkında" metni, 60+ ilgi alanı etiketi ve Tinder tarzı soru-cevaplar. Keşfet akışı ortak ilgi alanı, aynı niyet ve aynı bölüme göre sıralanır.
- **Kaydır-beğen:** Kartı sağa/sola sürükle ya da ✕ / ♥ butonlarını kullan. Karşılıklı beğenide eşleşme ekranı çıkar.
- **Canlı sohbet:** Birkaç saniyelik yoklama (polling) ile yeni mesajlar, "yazıyor…" göstergesi, çevrimiçi durumu, okunmamış sayacı. Vercel gibi sunucusuz ortamlarda da çalışır.
- **Sosyal medya kontrol sende:** Instagram, X, Snapchat, TikTok, Telegram, Discord, WhatsApp hesapları profilde **gizli** tutulur. Sohbetteki bağlantı butonuyla istediğin hesabı, istediğin anda, sadece o kişiyle paylaşırsın.
- **Karşılıklı kimlik açma:** İki taraf da "hazırım" derse seçtikleri isim ve sosyal medya hesapları aynı anda açılır; tek taraflı ifşa yok.
- **Cevaba beğeni ve yorum (Hinge):** Profilin tamamı yerine tek bir cevabı, biyografiyi ya da günün sorusunu beğenip yorum yazma. Eşleşirseniz yorum sohbetin ilk mesajı olur.
- **Günün sorusu:** Her gün yeni soru. Başkalarının cevabını görmek için senin de cevaplaman gerekir.
- **Günün en uyumlusu, süper beğeni, geri al, günlük beğeni sınırı:** Günde 25 beğeni ve 1 süper beğeni; son kaydırma geri alınabilir.
- **Arkadaş modu (Bumble BFF):** Flörtten ayrı bir deste; cinsiyet tercihi uygulanmaz.
- **Süreli eşleşme (Bumble):** 48 saat içinde kimse yazmazsa eşleşme düşer.
- **Açılış sorusu (Bumble Opening Moves):** Eşleştiğin herkese ilk mesaj olarak giden soru.
- **Sohbet oyunları:** 2 doğru 1 yalan, Bu mu o mu, Rastgele soru.
- **Sıra sende (Hinge):** Cevap bekleyen sohbetler ayrı bölümde öne çıkar.
- **Kötü söz filtresi:** Kırıcı mesajlar göndermeden önce "Emin misin?" diye sorulur; gönderilenler admin panelinde sayılır.
- **Bildirimler ve uygulama olarak kurulum (PWA):** Yeni eşleşme ve mesajda telefona bildirim; ana ekrana uygulama gibi eklenebilir.
- **Güvenlik:** Eşleşmeyi kaldırma, engelleme, şikayet etme, hesabı silme.
- **Admin paneli:** `/admin` adresinde istatistikler, kullanıcı arama, banlama, hesap silme ve şikayet yönetimi.
- **Tasarım:** Editoryal / brutalist koyu tema: siyah-beyaz kontrast, analog film greni, Manrope + Inter tipografi, kontrollü neon kırmızı. Masaüstünde solda editoryal afiş paneli.
- **Profil doluluk oranı:** Girişte profil sayfası açılır; doluluk halkası ve puanlı eksikler listesi. Dolu profiller keşfette daha önde çıkar.
- **Fiziksel özellikler:** Boy (cm), vücut yapısı (Zayıf, Orta yapılı, Balıketli…), göz ve saç rengi; hepsi isteğe bağlı.
- **Gerçek isim gizli:** Ad/soyad keşfette, eşleşmede ve sohbette görünmez; sadece karşılıklı kimlik açılınca paylaşılır.

## Kurulum

Node.js 20+ gerekir. Yerelde veritabanı kurmana gerek yok; veriler `data/medipoldate.sqlite` dosyasına yazılır.

```bash
npm install
cp .env.example .env
npm run seed      # isteğe bağlı: 24 test kullanıcısı (test1 … test24, şifre: test1234)
npm start
```

Tarayıcıda `http://localhost:3000` adresini aç.

## Ayarlar (`.env`)

| Değişken | Açıklama |
| --- | --- |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Turso veritabanı. Vercel'de zorunlu, yerelde isteğe bağlı. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin paneli girişi. Şifre boşsa panel kapalıdır. |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web bildirimleri. Boşsa bildirimler kapalıdır. |
| `PORT` | Yerel sunucu portu (varsayılan 3000). |
| `HOST` | Dinlenecek adres. VPS'te `127.0.0.1`. |
| `COOKIE_SECURE` | HTTPS arkasında `true` (Vercel'de otomatik). |
| `TRUST_PROXY` | Nginx arkasında `true` (Vercel'de otomatik). |

## Görseller ve lisanslar

- Avatarlar: [DiceBear](https://www.dicebear.com) "Lorelei" stili (Lisa Wischofsky), **CC0 1.0**. `public/avatars/` altında 24 kadın (f01-f24), 24 erkek (m01-m24) ve eski karışık set (a01-a48).
- Sosyal medya ikonları: [Simple Icons](https://simpleicons.org), **CC0 1.0**. `public/icons/` altında.
- Arayüz ikonları: Lucide tarzı çizgi ikonlar, ISC, `public/app.js` içinde inline.
- Yazı tipi: Inter (Google Fonts, OFL).

## Yapı

```
api/index.js      Vercel sunucusuz fonksiyonu (server/app.js'i çalıştırır)
vercel.json       Vercel ayarları (API yönlendirmesi, temiz adresler, bölge)
server/app.js     Express API (kimlik, profil, keşfet, eşleşme, sohbet, admin)
server/db.js      Veritabanı: Turso / libSQL, yerelde SQLite dosyası
server/local.js   Yerel geliştirme ve VPS için normal sunucu
server/meta.js    Bölümler, ilgi alanları, sorular, günlük sınırlar, oyun soruları
server/filter.js  Kötü söz filtresi
server/push.js    Web bildirimleri (VAPID)
server/seed.js    Test verisi (canlı veritabanına yazmaz)
public/           Ön uç (index.html, app.js, admin.html, admin.js, style.css, avatars/, icons/)
```

## Yayına alma

- **Vercel + Turso (önerilen):** [DEPLOY.md](DEPLOY.md)
- **Kendi Linux sunucun (VPS):** [DEPLOY-VPS.md](DEPLOY-VPS.md)
