# MedipolDate'i Vercel'e kurma rehberi

Site iki ücretsiz servisle çalışır:

| Servis | Ne yapar |
| --- | --- |
| **Vercel** | Sayfaları ve API'yi (sunucusuz fonksiyon) yayınlar. GitHub deposundan otomatik kurulur. |
| **Turso** | Veritabanı. Kullanıcılar, eşleşmeler ve mesajlar burada saklanır. |

**Neden ayrı bir veritabanı?** Vercel'de dosya sistemi kalıcı değildir. Sunucuya yazılan bir veritabanı dosyası her yeni çalışmada silinir. Turso, uygulamanın kullandığı SQLite ile aynı dili konuşan bir bulut veritabanıdır.

Toplam süre: yaklaşık 10-15 dakika.

---

## 1. Turso'da veritabanı oluştur

1. [turso.tech](https://turso.tech) adresine git ve **GitHub ile giriş yap**.
2. Panelde **Create Database** (Veritabanı oluştur) butonuna bas.
   - Ad: `medipoldate`
   - Bölge (location): **Frankfurt** ya da Avrupa'daki en yakın bölge. Vercel fonksiyonu da Frankfurt'ta çalışacak şekilde ayarlı; ikisi yakın olursa site hızlı olur.
3. Veritabanının sayfasında iki bilgiyi kopyala:
   - **URL**: `libsql://medipoldate-KULLANICIADI.turso.io` biçimindedir.
   - **Token**: **Create Token** / **Generate Token** butonuna bas, yetki olarak **Read & Write** seç, çıkan uzun metni kopyala. Bu token bir daha gösterilmez; güvenli bir yere not et.

Tabloları elle oluşturmana gerek yok. Site ilk açıldığında tabloları kendisi kurar.

---

## 2. Admin şifresi üret

Kendi bilgisayarında PowerShell'de çalıştır ve çıkan metni not et:

```powershell
node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
```

---

## 3. Vercel'de ortam değişkenlerini gir

Vercel'de projeni aç: **Settings → Environment Variables**. Aşağıdaki dört değişkeni ekle. Ortam olarak **Production**, **Preview** ve **Development** üçü de seçili kalsın.

| Ad (Key) | Değer (Value) |
| --- | --- |
| `TURSO_DATABASE_URL` | Turso'dan kopyaladığın URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Turso'dan kopyaladığın token |
| `ADMIN_USERNAME` | `admin` (istersen başka bir ad) |
| `ADMIN_PASSWORD` | 2. adımda ürettiğin şifre |

> Değişken adları birebir aynı olmalı (büyük harf, alt çizgi). Başında ya da sonunda boşluk kalmasın.

---

## 4. Proje ayarlarını kontrol et

**Settings → Build and Deployment** (ya da **General**) bölümünde:

| Ayar | Değer |
| --- | --- |
| Framework Preset | **Other** |
| Root Directory | boş (deponun kökü) |
| Build Command | boş bırak / override kapalı |
| Output Directory | boş bırak (depodaki `vercel.json` `public` olarak ayarlar) |

Gerekli diğer her şey depodaki `vercel.json` dosyasında hazır: API yönlendirmesi, `/admin` gibi uzantısız adresler, Frankfurt bölgesi ve güvenlik başlıkları.

---

## 5. Yeniden yayınla (Redeploy)

Ortam değişkenleri sadece **yeni** bir yayında devreye girer.

**Deployments** sekmesi → en üstteki yayının sağındaki **⋯** → **Redeploy**.

(GitHub'a yeni bir commit gönderdiğinde Vercel zaten otomatik olarak yeniden yayınlar.)

---

## 6. Test et

1. `https://PROJEN.vercel.app/api/health` adresini aç. Şunu görmelisin:
   ```json
   {"ok":true,"db":"bağlı"}
   ```
2. Ana sayfayı aç, hesap oluştur, profilini kaydet.
3. Başka bir tarayıcıdan (ya da gizli pencereden) ikinci bir hesap aç. İki hesap birbirini beğensin, eşleşsin ve mesajlaşsın. Mesajlar birkaç saniye içinde karşıya düşer.
4. `https://PROJEN.vercel.app/admin` adresine git ve 3. adımdaki admin bilgileriyle giriş yap.

---

## 7. Kendi alan adını bağlamak (isteğe bağlı)

Vercel'de **Settings → Domains → Add** ile alan adını ekle. Vercel sana DNS'e eklemen gereken kaydı (genelde bir `A` ya da `CNAME` kaydı) gösterir. Alan adı firmanın panelinde bu kaydı ekle. HTTPS sertifikası otomatik gelir.

---

## Sorun giderme

| Ekranda gördüğün | Sebep ve çözüm |
| --- | --- |
| **"Veritabanı ayarlanmamış: … TURSO_DATABASE_URL …"** | 3. adımdaki değişkenler eksik ya da eklendikten sonra yeniden yayınlanmamış. Değişkenleri kontrol et, 5. adımı yap. |
| **"Sunucu hatası. Veritabanı bağlantısını kontrol et"** | URL ya da token yanlış, token süresi dolmuş veya yetkisi sadece okuma. Turso'da yeni bir **Read & Write** token oluştur, Vercel'de güncelle, yeniden yayınla. |
| **"Sunucuya ulaşılamıyor"** ve altında "Bulunamadı" | API yayınlanmamış. Depoda `api/index.js` ve `vercel.json` dosyalarının olduğundan ve **Root Directory** ayarının boş olduğundan emin ol. |
| **Sayfa açılıyor ama `/admin` 404 veriyor** | `vercel.json` içindeki `cleanUrls` ayarı devrede değil. Depodaki `vercel.json` güncel mi kontrol et. |
| **"Admin paneli kapalı"** | `ADMIN_PASSWORD` değişkeni eksik. Ekle ve yeniden yayınla. |
| Hata ayrıntısı lazım | Vercel'de **Logs** sekmesi (ya da Deployments → yayın → **Functions**) gerçek hata mesajını gösterir. |

---

## Bilmen gerekenler

- **Canlı sohbet nasıl çalışıyor?** Vercel kalıcı bağlantıları (WebSocket) desteklemez. Bu yüzden tarayıcı, sohbet açıkken 2,5 saniyede bir, diğer ekranlarda 7 saniyede bir "yeni mesaj var mı?" diye sorar. Sekme arka plandayken bu süre 30 saniyeye çıkar.
- **Ücretsiz plan sınırları.** Vercel'in ücretsiz (Hobby) planı ticari olmayan kullanım içindir ve aylık fonksiyon çağrısı sınırı vardır. Turso'nun ücretsiz planının da aylık okuma/yazma ve depolama sınırları var. Kullanıcı sayısı çok artarsa iki paneldeki kullanım ekranlarını takip et.
- **Yedekleme.** Turso panelinde veritabanının belirli bir ana geri dönme (point-in-time restore) özelliği bulunur. Ek olarak ara sıra Turso panelinden ya da Turso CLI ile (`turso db shell medipoldate .dump > yedek.sql`) yedek almanı öneririm.
- **Test hesapları.** Canlı veritabanına `npm run seed` ile test hesabı ekleme; komut buna zaten izin vermez.
- **Yerel geliştirme.** Bilgisayarında `npm install` ve `npm start` ile çalıştırınca Turso gerekmez; veriler `data/medipoldate.sqlite` dosyasına yazılır. Yerelde de Turso'yu kullanmak istersen aynı iki değişkeni `.env` dosyasına ekle.
- **KVKK ve isim kullanımı.** Site kişisel veri işliyor. Yayına almadan önce aydınlatma metni, gizlilik politikası ve kullanım koşulları ekle. "Medipol" adını kullanmak için üniversiteden izin almak ileride sorun yaşamamanı sağlar.

Kendi Linux sunucuna kurmak istersen: [DEPLOY-VPS.md](DEPLOY-VPS.md).
