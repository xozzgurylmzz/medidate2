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
- **Güvenlik:** Eşleşmeyi kaldırma, engelleme, şikayet etme, hesabı silme.
- **Admin paneli:** `/admin` adresinde istatistikler, kullanıcı arama, banlama, hesap silme ve şikayet yönetimi.
- **Tasarım:** Koyu öncelikli premium tema, açık tema desteği (sistem tercihine göre), Inter yazı tipi, SVG ikonlar.

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
| `PORT` | Yerel sunucu portu (varsayılan 3000). |
| `HOST` | Dinlenecek adres. VPS'te `127.0.0.1`. |
| `COOKIE_SECURE` | HTTPS arkasında `true` (Vercel'de otomatik). |
| `TRUST_PROXY` | Nginx arkasında `true` (Vercel'de otomatik). |

## Görseller ve lisanslar

- Avatarlar: [DiceBear](https://www.dicebear.com) "Lorelei" stili (Lisa Wischofsky), **CC0 1.0**. `public/avatars/` altında 48 SVG.
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
server/meta.js    Bölümler, ilgi alanları, sorular, avatar ve renk listeleri
server/seed.js    Test verisi (canlı veritabanına yazmaz)
public/           Ön uç (index.html, app.js, admin.html, admin.js, style.css, avatars/, icons/)
```

## Yayına alma

- **Vercel + Turso (önerilen):** [DEPLOY.md](DEPLOY.md)
- **Kendi Linux sunucun (VPS):** [DEPLOY-VPS.md](DEPLOY-VPS.md)
