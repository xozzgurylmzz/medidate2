// Sabit listeler: ön uç bunları /api/meta üzerinden alır.

export const DEPARTMENTS = [
  'Tıp', 'Diş Hekimliği', 'Eczacılık', 'Hukuk',
  'Hemşirelik', 'Fizyoterapi ve Rehabilitasyon', 'Beslenme ve Diyetetik', 'Odyoloji',
  'Dil ve Konuşma Terapisi', 'Ergoterapi', 'Sosyal Hizmet', 'Sağlık Yönetimi', 'Çocuk Gelişimi',
  'Psikoloji', 'Rehberlik ve Psikolojik Danışmanlık', 'Okul Öncesi Öğretmenliği', 'Özel Eğitim Öğretmenliği',
  'İngilizce Öğretmenliği', 'Sınıf Öğretmenliği',
  'İşletme', 'Ekonomi ve Finans', 'Uluslararası Ticaret ve Finans', 'Yönetim Bilişim Sistemleri',
  'Siyaset Bilimi ve Uluslararası İlişkiler', 'Halkla İlişkiler ve Reklamcılık', 'Yeni Medya ve İletişim',
  'Radyo, Televizyon ve Sinema', 'Bilgisayar Mühendisliği', 'Yazılım Mühendisliği', 'Elektrik-Elektronik Mühendisliği',
  'Endüstri Mühendisliği', 'Biyomedikal Mühendisliği', 'Mimarlık', 'İç Mimarlık ve Çevre Tasarımı',
  'Grafik Tasarım', 'Endüstriyel Tasarım', 'Anestezi', 'Ağız ve Diş Sağlığı', 'Tıbbi Görüntüleme Teknikleri',
  'İlk ve Acil Yardım', 'Tıbbi Laboratuvar Teknikleri', 'Fizyoterapi (Önlisans)', 'Diyaliz', 'Optisyenlik',
  'Hazırlık', 'Diğer',
];

export const INTERESTS = [
  'Kahve', 'Çay', 'Sinema', 'Dizi', 'Anime', 'Kitap', 'Şiir', 'Müzik', 'Konser', 'Gitar', 'Piyano',
  'Spor salonu', 'Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Yüzme', 'Koşu', 'Yoga', 'Pilates', 'Doğa yürüyüşü',
  'Kamp', 'Seyahat', 'Fotoğraf', 'Resim', 'Dans', 'Tiyatro', 'PC / Konsol oyunları', 'Mobil oyun', 'Satranç',
  'Yemek yapmak', 'Tatlı', 'Kedi', 'Köpek', 'Teknoloji', 'Yazılım', 'Girişimcilik', 'Gönüllülük', 'Astroloji',
  'Felsefe', 'Tarih', 'Bilim', 'Psikoloji', 'Moda', 'Makyaj', 'Araba', 'Motosiklet', 'Netflix', 'K-pop', 'Rap',
  'Rock', 'Türkçe pop', 'Arabesk', 'Caz', 'Gece hayatı', 'Ev insanı', 'Kütüphane', 'Kampüs etkinlikleri',
  'Podcast', 'Bisiklet', 'Kayak', 'Board game', 'Kahve dükkanı keşfi',
];

export const PROMPTS = [
  'Kampüste beni en çok … yaparken bulursun',
  'Hayatımın en iyi kararı…',
  'Tipik bir hafta sonum…',
  'Ders dışında en iyi olduğum şey…',
  'Şu özelliğe sahipsen kesin yaz…',
  'Benimle ideal ilk randevu…',
  'Gizli yeteneğim…',
  'Tartışmaya her zaman hazır olduğum fikir…',
  'En sevdiğim Ankara mekanı…',
  'Sosyal medyamı vermem için…',
  'Bölümümü seçmemin asıl sebebi…',
  'Beni güldürmenin en kolay yolu…',
];

export const INTENTS = [
  { id: 'ciddi', label: 'Ciddi ilişki' },
  { id: 'flort', label: 'Flört' },
  { id: 'arkadas', label: 'Arkadaşlık' },
  { id: 'bilmiyorum', label: 'Henüz bilmiyorum' },
];

export const GENDERS = [
  { id: 'kadin', label: 'Kadın' },
  { id: 'erkek', label: 'Erkek' },
];

export const LOOKING_FOR = [
  { id: 'kadin', label: 'Kadın' },
  { id: 'erkek', label: 'Erkek' },
  { id: 'herkes', label: 'Herkes' },
];

// Simple Icons (CC0) – public/icons/<id>.svg
export const SOCIALS = [
  { id: 'instagram', label: 'Instagram', placeholder: 'kullaniciadi' },
  { id: 'x', label: 'X / Twitter', placeholder: 'kullaniciadi' },
  { id: 'snapchat', label: 'Snapchat', placeholder: 'kullaniciadi' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'kullaniciadi' },
  { id: 'telegram', label: 'Telegram', placeholder: 'kullaniciadi' },
  { id: 'discord', label: 'Discord', placeholder: 'kullaniciadi' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '05xx xxx xx xx' },
];

// DiceBear "Lorelei" (Lisa Wischofsky, CC0) – public/avatars/<id>.svg
export const AVATARS = Array.from({ length: 48 }, (_, i) => `a${String(i + 1).padStart(2, '0')}`);

export const AVATAR_COLORS = [
  '#f43f5e', '#fb7185', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#64748b', '#1e293b',
];

const ADJ = ['Gizemli', 'Neşeli', 'Sessiz', 'Meraklı', 'Uykulu', 'Cesur', 'Hayalperest', 'Gece kuşu', 'Sabahçı',
  'Kahve bağımlısı', 'Kitap kurdu', 'Tatlı', 'Ciddi', 'Çılgın', 'Sakin', 'Romantik', 'Esprili', 'Utangaç'];
const NOUN = ['Panda', 'Penguen', 'Tilki', 'Kedi', 'Baykuş', 'Yunus', 'Koala', 'Kaplan', 'Kirpi', 'Ahtapot',
  'Kelebek', 'Kaplumbağa', 'Flamingo', 'Sincap', 'Rakun', 'Karınca', 'Yıldız', 'Bulut'];

export function randomNickname() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return `${a} ${n}`;
}
export const randomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];
export const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

// ---------------------------------------------------------------- yeni özellikler

export const LIMITS = {
  likesPerDay: 25,      // günlük beğeni hakkı (Hinge)
  superPerDay: 1,       // günlük süper beğeni (Tinder)
  matchHours: 48,       // ilk mesaj yazılmazsa eşleşme düşer (Bumble)
  commentMax: 140,
  openerMax: 120,
  dailyAnswerMax: 140,
};

// Günün sorusu: her gün sıradaki soru (Türkiye saatine göre)
export const DAILY_QUESTIONS = [
  'Bu hafta seni en çok ne güldürdü?',
  'Şu an kulaklığında hangi şarkı var?',
  'Hayalindeki hafta sonu planı ne?',
  'Kampüste en sevdiğin köşe neresi?',
  'Asla vazgeçemeyeceğin bir alışkanlık?',
  'Bir süper gücün olsa ne olurdu?',
  'En son izlediğin ve önerdiğin dizi/film?',
  'Sabah insanı mısın, gece kuşu mu? Neden?',
  'Çocukken ne olmak istiyordun?',
  'Ankara\'da herkese önerdiğin bir mekan?',
  'En sevdiğin kahvaltılık?',
  'Seni tanımlayan üç emoji olsa?',
  'Bu dönem en çok hangi derse yetişmeye çalışıyorsun?',
  'Bir günlüğüne başka bir şehirde olsan neresi?',
  'En utanç verici ama tatlı anın?',
  'Telefonundaki en saçma uygulama hangisi?',
  'Bir konseri seçebilsen kimi izlerdin?',
  'İlk buluşmada asla yapılmaması gereken şey?',
  'En iyi gece atıştırmalığı?',
  'Son zamanlarda öğrendiğin en ilginç bilgi?',
  'Kedi mi köpek mi? Savun.',
  'Hayatında küçük ama mutlu eden bir şey?',
  'Bir kitabın ya da filmin karakteri olsan kim olurdun?',
  'Pazar günü ideal saat kaçta uyanmak?',
  'Bu yıl kendine koyduğun bir hedef?',
  'En çok güldüğün iç şaka ne hakkında?',
  'Yaz mı kış mı? Tek kelimeyle.',
  'Ders çalışırken mutlaka yanında olan şey?',
  'Seni en hızlı ne sinirlendirir?',
  'Bugün kendine bir iltifat et.',
];

// Açılış sorusu önerileri (Bumble Opening Moves)
export const OPENER_SUGGESTIONS = [
  'İdeal pazar günün nasıl geçer?',
  'Kampüste en sevdiğin yer neresi?',
  'Son zamanlarda seni en çok ne heyecanlandırdı?',
  'Sence ilk buluşma için en iyi yer neresi?',
  'Hangi konuda saatlerce konuşabilirsin?',
  'Bana bir şarkı öner, seni tanıyayım.',
  'Bu dönemki en büyük derdin ne?',
];

// Sohbet oyunu: "Bu mu o mu" hazır ikilileri
export const THIS_OR_THAT = [
  ['Kahve', 'Çay'], ['Dağ', 'Deniz'], ['Kitap', 'Film'], ['Sabah', 'Gece'], ['Kedi', 'Köpek'],
  ['Ev partisi', 'Konser'], ['Tatlı', 'Tuzlu'], ['Yaz', 'Kış'], ['Netflix', 'Dışarı çıkmak'], ['Pizza', 'Hamburger'],
  ['Mesaj', 'Sesli arama'], ['Plan yapmak', 'Spontane olmak'], ['Kütüphane', 'Kafe'], ['Rap', 'Rock'], ['Erken gelmek', 'Tam zamanında gelmek'],
];

// Sohbet oyunu: "Rastgele soru"
export const CHAT_QUESTIONS = [
  'Hiç kimseye söylemediğin küçük bir hayalin var mı?',
  'Seni en iyi anlatan film sahnesi hangisi?',
  'Bir gün boyunca görünmez olsan ilk ne yapardın?',
  'Hayatındaki en iyi tavsiyeyi kimden aldın?',
  'En son ne zaman kahkahalarla güldün?',
  'Bir şeyi değiştirebilseydin okulda neyi değiştirirdin?',
  'Seni tanımayan biri hakkında en çok neyi yanlış düşünür?',
  'Çocukluğundan kalan en tatlı anı?',
  'Bir hafta tatilin olsa nereye giderdin?',
  'Üç kelimeyle ideal ilişki?',
  'En çok neyi erteliyorsun?',
  'Hangi konuda fikrini değiştirdin?',
  'Seni en çok motive eden şey ne?',
  'Arkadaşların seni nasıl tarif eder?',
  'Bir ünlüyle yemek yiyebilsen kim olurdu?',
];

export function meta() {
  return {
    departments: DEPARTMENTS, interests: INTERESTS, prompts: PROMPTS, intents: INTENTS,
    genders: GENDERS, lookingFor: LOOKING_FOR, socials: SOCIALS, avatars: AVATARS, avatarColors: AVATAR_COLORS,
    limits: LIMITS, openerSuggestions: OPENER_SUGGESTIONS, thisOrThat: THIS_OR_THAT,
  };
}
