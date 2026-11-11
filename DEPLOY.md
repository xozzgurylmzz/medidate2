# MedipolDate'i internete kurma rehberi

Bu rehber, siteyi kendi alan adınla (ör. `alanadin.com`) HTTPS üzerinden yayına almayı adım adım anlatır. Komutların tamamı kopyala-yapıştır içindir. `alanadin.com` ve `SUNUCU_IP` geçen yerleri kendi bilgilerinle değiştir.

Toplam süre: ilk seferde yaklaşık 45-60 dakika.

---

## 0. Neye ihtiyacın var?

| Ne | Neden | Not |
| --- | --- | --- |
| **Alan adı** | Sitenin adresi | Herhangi bir alan adı firmasından alınabilir. |
| **VPS (sanal sunucu)** | Uygulamanın 7/24 çalışacağı bilgisayar | Ubuntu 24.04, 1 CPU, 1-2 GB RAM, 20 GB disk başlangıç için yeterli. Aylık maliyeti genelde düşüktür. |
| **Windows bilgisayarın** | Dosyaları yüklemek için | Windows 10/11'de `ssh`, `scp` ve `tar` hazır gelir. |

**Neden paylaşımlı hosting (cPanel) değil?** Bu uygulama sürekli çalışan bir Node.js süreci, canlı sohbet için WebSocket ve verilerin kalıcı olarak yazıldığı bir disk ister. Paylaşımlı hostinglerin çoğu bunları desteklemez.

**Neden ücretsiz platformlar (Render, Vercel vb.) değil?** Çoğunun ücretsiz planında disk her yeniden başlatmada sıfırlanır. Bu, tüm kullanıcıların ve mesajların silinmesi demektir.

---

## 1. Sunucuyu kirala ve bağlan

1. Bir VPS sağlayıcısından **Ubuntu 24.04** sunucu oluştur.
2. Sana bir **IP adresi** ve **root şifresi** (ya da SSH anahtarı) verilecek.
3. Windows'ta **PowerShell**'i aç ve bağlan:

```powershell
ssh root@SUNUCU_IP
```

İlk bağlantıda "Are you sure you want to continue connecting?" sorusuna `yes` yaz.

---

## 2. Alan adını sunucuya yönlendir (DNS)

Alan adını aldığın firmanın panelinde **DNS yönetimi** bölümüne gir ve iki kayıt ekle:

| Tür | Ad / Host | Değer | TTL |
| --- | --- | --- | --- |
| A | `@` | `SUNUCU_IP` | varsayılan |
| A | `www` | `SUNUCU_IP` | varsayılan |

Yayılması birkaç dakika ile birkaç saat sürebilir. Kontrol etmek için PowerShell'de:

```powershell
nslookup alanadin.com
```

Çıktıda sunucunun IP'sini görüyorsan hazırsın. Beklerken sonraki adımlara devam edebilirsin.

---

## 3. Sunucuyu hazırla

Aşağıdakileri sunucuya **root** olarak bağlıyken çalıştır.

```bash
# Sistemi güncelle
apt update && apt upgrade -y

# Gerekli programlar
apt install -y nginx sqlite3 curl ufw

# Node.js 24 (uygulama 22.13 veya üstünü ister)
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
node -v      # v24.x.x görmelisin

# Uygulamayı 7/24 açık tutacak süreç yöneticisi
npm install -g pm2

# Güvenlik duvarı: sadece SSH ve web trafiğine izin ver
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Uygulamayı çalıştıracak ayrı bir kullanıcı (root ile çalıştırmamak daha güvenli)
adduser --disabled-password --gecos "" medipol
usermod -aG sudo medipol
passwd medipol     # bu kullanıcıya bir şifre belirle (sudo için lazım)
```

---

## 4. Dosyaları sunucuya yükle

**Kendi bilgisayarında**, PowerShell'de proje klasörünün bir üstüne git ve paketle. `node_modules`, `data` ve `.env` bilerek dışarıda bırakılır: veritabanı ve şifreler sunucuda ayrıca oluşturulacak.

```powershell
cd "D:\Yeni klasör (2)\1"
tar --exclude=node_modules --exclude=data --exclude=.env -czf medipoldate.tgz medipoldate
scp medipoldate.tgz root@SUNUCU_IP:/tmp/
```

**Sunucuda** paketi aç:

```bash
mkdir -p /var/www
tar -xzf /tmp/medipoldate.tgz -C /var/www
chown -R medipol:medipol /var/www/medipoldate
```

> Komut satırı yerine sürükle-bırak istersen **WinSCP** programıyla da `medipoldate` klasörünü `/var/www/` altına yükleyebilirsin (yine `node_modules`, `data` ve `.env` hariç).

---

## 5. Uygulamayı kur ve ayarla

```bash
su - medipol
cd /var/www/medipoldate

# Bağımlılıkları kur
npm ci --omit=dev

# Ayar dosyasını oluştur
cp .env.example .env

# Admin için güçlü bir şifre üret ve bir yere not et
openssl rand -base64 24

# Ayar dosyasını düzenle
nano .env
```

`.env` dosyasını **tam olarak** şöyle doldur (şifre kısmına az önce ürettiğin şifreyi yapıştır):

```ini
PORT=3000
HOST=127.0.0.1
COOKIE_SECURE=true
TRUST_PROXY=true

ADMIN_USERNAME=admin
ADMIN_PASSWORD=BURAYA_URETTIGIN_SIFRE
```

Kaydetmek için `Ctrl+O`, `Enter`, çıkmak için `Ctrl+X`.

| Ayar | Ne işe yarar |
| --- | --- |
| `HOST=127.0.0.1` | Uygulamaya dışarıdan doğrudan değil, sadece Nginx üzerinden erişilir. |
| `COOKIE_SECURE=true` | Oturum çerezleri sadece HTTPS ile gönderilir. **Not:** Adım 8'de HTTPS kurulana kadar siteye giriş yapılamaz, bu normal. |
| `TRUST_PROXY=true` | Uygulama ziyaretçinin gerçek IP'sini görür. Kaba kuvvet korumaları buna bağlıdır. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin paneli girişi. Şifre boşsa panel tamamen kapalı olur. |

> **Uyarı:** Sunucuda asla `npm run seed` çalıştırma. Bu komut, şifresi herkesçe bilinen 24 test hesabı oluşturur.

---

## 6. Uygulamayı başlat (PM2)

Hâlâ `medipol` kullanıcısıyla, `/var/www/medipoldate` içindeyken:

```bash
pm2 start ecosystem.config.cjs
pm2 logs medipoldate --lines 20
```

Logda şu satırları görmelisin:

```
MedipolDate çalışıyor: http://localhost:3000
Admin paneli: http://localhost:3000/admin (kullanıcı: admin)
```

`Ctrl+C` ile log ekranından çık. Sonra sunucu yeniden başladığında uygulamanın otomatik açılması için:

```bash
pm2 save
pm2 startup
```

`pm2 startup` sana `sudo env PATH=...` ile başlayan bir komut yazdıracak. **O satırı kopyalayıp çalıştır.**

---

## 7. Nginx'i ayarla (alan adını uygulamaya bağla)

```bash
sudo cp /var/www/medipoldate/deploy/nginx.conf /etc/nginx/sites-available/medipoldate
sudo nano /etc/nginx/sites-available/medipoldate
```

Dosyada `alanadin.com` ve `www.alanadin.com` yazan yeri kendi alan adınla değiştir, kaydet. Sonra:

```bash
sudo ln -s /etc/nginx/sites-available/medipoldate /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` komutu `syntax is ok` ve `test is successful` demeli.

---

## 8. HTTPS (ücretsiz SSL sertifikası)

DNS'in yayıldığından emin ol (adım 2), sonra:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d alanadin.com -d www.alanadin.com
```

Sorulara şöyle cevap ver: e-posta adresini yaz, şartları kabul et (`Y`). Certbot Nginx ayarını otomatik günceller ve HTTP'yi HTTPS'e yönlendirir.

Sertifika 90 günde bir otomatik yenilenir. Yenilemenin çalıştığını test etmek için:

```bash
sudo certbot renew --dry-run
```

---

## 9. Test et

1. `https://alanadin.com` adresini aç, bir hesap oluştur ve profilini kaydet.
2. Başka bir tarayıcıdan (ya da gizli pencereden) ikinci bir hesap aç.
3. İki hesap birbirini beğensin, eşleşin ve mesajlaşın. Mesaj anında karşıya düşüyorsa canlı sohbet (WebSocket) çalışıyor demektir.
4. `https://alanadin.com/admin` adresine git ve `.env` dosyasındaki admin bilgileriyle giriş yap.

---

## 10. Otomatik yedekleme

Tüm veriler tek bir dosyada: `/var/www/medipoldate/data/medipoldate.sqlite`. Her gece yedek almak için:

```bash
sudo cp /var/www/medipoldate/deploy/backup.sh /usr/local/bin/medipoldate-backup
sudo chmod +x /usr/local/bin/medipoldate-backup
sudo medipoldate-backup          # bir kez elle dene
sudo crontab -e
```

Açılan dosyanın en altına şu satırı ekle (her gece 04:00'te yedek alır, 14 günlük yedek tutar):

```
0 4 * * * /usr/local/bin/medipoldate-backup >> /var/log/medipoldate-backup.log 2>&1
```

Yedekler `/var/backups/medipoldate/` altında birikir. Ara sıra kendi bilgisayarına da indir (PowerShell'de):

```powershell
scp root@SUNUCU_IP:/var/backups/medipoldate/*.gz .
```

**Yedekten geri dönmek için:**

```bash
pm2 stop medipoldate
cd /var/www/medipoldate/data
rm -f medipoldate.sqlite-wal medipoldate.sqlite-shm
gunzip -c /var/backups/medipoldate/medipoldate-TARIH.sqlite.gz > medipoldate.sqlite
pm2 start medipoldate
```

---

## 11. Güncelleme yayınlama

Kodda değişiklik yaptığında, adım 4'teki gibi paketleyip yükle. Sonra sunucuda:

```bash
sudo tar -xzf /tmp/medipoldate.tgz -C /var/www
sudo chown -R medipol:medipol /var/www/medipoldate
su - medipol
cd /var/www/medipoldate
npm ci --omit=dev
pm2 restart medipoldate
```

Paket `data` klasörünü ve `.env` dosyasını içermediği için kullanıcılar, mesajlar ve şifreler korunur.

---

## 12. Admin paneli

Adres: `https://alanadin.com/admin`. Kullanıcı adı ve şifre, sunucudaki `.env` dosyasındaki `ADMIN_USERNAME` ve `ADMIN_PASSWORD` değerleridir.

Panelde yapabileceklerin:

- **İstatistikler:** toplam kullanıcı, son 7 günün kayıtları, çevrimiçi sayısı, kadın/erkek dağılımı, aktif eşleşmeler, son 24 saatin mesaj sayısı, açık şikayetler, banlı kullanıcılar.
- **Kullanıcılar:** kullanıcı adı, takma ad, isim veya bölüme göre arama; şikayetli ve banlı filtreleri; profil detayı ve hakkındaki şikayetler.
- **Banlama:** banlanan kullanıcı anında oturumdan atılır, tüm eşleşmeleri kapanır ve bir daha giriş yapamaz. Ban istenirse geri alınabilir.
- **Hesap silme:** hesap, eşleşmeler ve mesajlar kalıcı olarak silinir.
- **Şikayetler:** açık, çözülen ve tüm şikayetleri listeleme; "Çözüldü" işaretleme; şikayet edilen kişiyi tek tıkla banlama.

Gizlilik gereği admin paneli kullanıcıların **özel mesajlarını ve sosyal medya hesaplarını göstermez**. Şikayetler, şikayet edenin yazdığı açıklamayla değerlendirilir.

**Admin şifresini değiştirmek için:** `.env` içindeki `ADMIN_PASSWORD` değerini değiştir, sonra `pm2 restart medipoldate`.

---

## 13. Sorun giderme

| Belirti | Sebep ve çözüm |
| --- | --- |
| **502 Bad Gateway** | Uygulama çalışmıyor. `pm2 status` ve `pm2 logs medipoldate` ile hatayı gör. |
| **Giriş yapınca hemen çıkış oluyor** | `COOKIE_SECURE=true` ama site henüz HTTP. Adım 8'i tamamla. |
| **Mesajlar sayfayı yenileyince geliyor, anında gelmiyor** | Nginx ayarında `Upgrade` ve `Connection` satırları eksik. `deploy/nginx.conf` dosyasını birebir kullan. |
| **"Admin paneli kapalı" yazıyor** | `.env` içinde `ADMIN_PASSWORD` boş. Doldur ve `pm2 restart medipoldate`. |
| **"Çok fazla deneme yaptın" herkese çıkıyor** | `TRUST_PROXY=true` değil; herkes aynı IP'den geliyor gibi görünüyor. Düzelt ve yeniden başlat. |
| **`EADDRINUSE: address already in use :::3000`** | Uygulama zaten çalışıyor ya da başka bir program 3000'i kullanıyor. `pm2 delete all` sonra tekrar `pm2 start ecosystem.config.cjs`. |
| **Sertifika alınamıyor** | DNS henüz yayılmamış ya da 80/443 portları kapalı. `nslookup` ve `sudo ufw status` ile kontrol et. |

Faydalı komutlar:

```bash
pm2 status                       # çalışıyor mu?
pm2 logs medipoldate             # canlı loglar
pm2 restart medipoldate          # yeniden başlat
sudo systemctl status nginx      # Nginx durumu
sudo tail -f /var/log/nginx/error.log
```

---

## 14. Yayına almadan önce bilmen gerekenler

- **Tek kopya çalışmalı.** PM2 ayarındaki `instances: 1` değerini artırma; canlı sohbet tek süreç üzerinde çalışıyor.
- **Herkes kayıt olabilir.** E-posta doğrulaması kaldırıldığı için "sadece Medipol öğrencileri" kısıtı teknik olarak uygulanmıyor. Gerekirse davet kodu gibi bir kontrol eklenebilir.
- **KVKK.** Site kişisel veri işliyor (cinsiyet, yaş, bölüm, mesajlar). Yayına almadan önce bir **aydınlatma metni**, **gizlilik politikası** ve **kullanım koşulları** sayfası eklemen ve 18 yaş sınırını belirtmen gerekir. Bu konuda bir hukukçudan destek almanı öneririm.
- **İsim kullanımı.** "Medipol" bir üniversitenin adı ve markası. Uygulama adında kullanmadan önce üniversiteden izin almak, ileride sorun yaşamamak için iyi olur.
