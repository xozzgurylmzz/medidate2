# MedipolDate

Ankara Medipol Üniversitesi öğrencilerine özel, **fotoğrafsız ve anonim** Tinder tarzı eşleşme ve sohbet uygulaması. Web üzerinden çalışır, telefonda uygulama gibi görünür.

## Özellikler

- **Kullanıcı adı ile kayıt:** E-posta gerekmez. Kullanıcı adı yalnızca giriş içindir, kimseye gösterilmez.
- **Anonim kimlik:** Fotoğraf yüklenmez. Herkes 48 çizim avatardan birini ve bir renk seçer, takma adla görünür.
- **Zorunlu olan tek alan cinsiyet.** Ad, soyad, yaş, bölüm isteğe bağlıdır.
- **Eşleştirme sinyalleri:** "Ne arıyorsun?" (ciddi / flört / arkadaşlık), serbest "Hakkında" metni, 60+ ilgi alanı etiketi ve Tinder tarzı soru-cevaplar. Keşfet akışı ortak ilgi alanı, aynı niyet ve aynı bölüme göre sıralanır.
- **Kaydır-beğen:** Kartı sağa/sola sürükle ya da ✕ / ♥ butonlarını kullan. Karşılıklı beğenide eşleşme ekranı çıkar.
- **Gerçek zamanlı sohbet:** Socket.io ile anında mesaj, "yazıyor…" göstergesi, çevrimiçi durumu, okunmamış sayacı.
- **Sosyal medya kontrol sende:** Instagram, X, Snapchat, TikTok, Telegram, Discord, WhatsApp hesapları profilde **gizli** tutulur. Sohbetteki bağlantı butonuyla istediğin hesabı, istediğin anda, sadece o kişiyle paylaşırsın.
- **Güvenlik:** Eşleşmeyi kaldırma, engelleme, şikayet etme, hesabı silme.
- **Admin paneli:** `/admin` adresinde istatistikler, kullanıcı arama, banlama, hesap silme ve şikayet yönetimi.
- **Tasarım:** Koyu öncelikli premium tema, açık tema desteği (sistem tercihine göre), Inter yazı tipi, SVG ikonlar.

## Kurulum

Node.js 22.13+ gerekir (yerleşik SQLite kullanılır, ek veritabanı kurulumu yoktur).

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
| `PORT` | Sunucu portu (varsayılan 3000). |
| `HOST` | Dinlenecek adres. Sunucuda `127.0.0.1`. |
| `COOKIE_SECURE` | HTTPS arkasında `true` yapın. |
| `TRUST_PROXY` | Nginx arkasında `true` yapın. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin paneli girişi. Şifre boşsa panel kapalıdır. |

## Görseller ve lisanslar

- Avatarlar: [DiceBear](https://www.dicebear.com) "Lorelei" stili (Lisa Wischofsky), **CC0 1.0**. `public/avatars/` altında 48 SVG.
- Sosyal medya ikonları: [Simple Icons](https://simpleicons.org), **CC0 1.0**. `public/icons/` altında.
- Arayüz ikonları: Lucide tarzı çizgi ikonlar, ISC, `public/app.js` içinde inline.
- Yazı tipi: Inter (Google Fonts, OFL).

## Yapı

```
server/index.js   Express API + Socket.io (kimlik, profil, keşfet, eşleşme, sohbet)
server/db.js      SQLite şeması (data/medipoldate.sqlite)
server/meta.js    Bölümler, ilgi alanları, sorular, avatar ve renk listeleri
server/seed.js    Test verisi
public/           Tek sayfalık ön uç (index.html, app.js, style.css, avatars/, icons/)
```

## Yayına alma

Sunucuya kurulum (VPS, Nginx, HTTPS, PM2, yedekleme, admin paneli) adım adım [DEPLOY.md](DEPLOY.md) dosyasında anlatılıyor.
