// Yerel geliştirme (ve istenirse VPS) için normal sunucu.
// Vercel bu dosyayı kullanmaz; orada api/index.js çalışır.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root); // yerel veritabanı yolu (data/) proje köküne göre çözülsün

const { default: api } = await import('./app.js');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const server = express();
server.use(api);
server.use(express.static(path.join(root, 'public'), { extensions: ['html'] }));

server.listen(PORT, HOST, () => {
  console.log(`MedipolDate çalışıyor: http://localhost:${PORT}`);
  console.log(`Veritabanı: ${process.env.TURSO_DATABASE_URL ? 'Turso (uzak)' : 'yerel dosya data/medipoldate.sqlite'}`);
  console.log(process.env.ADMIN_PASSWORD
    ? `Admin paneli: http://localhost:${PORT}/admin (kullanıcı: ${process.env.ADMIN_USERNAME || 'admin'})`
    : 'Admin paneli KAPALI: .env içine ADMIN_PASSWORD ekle.');
});
