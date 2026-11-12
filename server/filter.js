// Kötü söz filtresi (Tinder "Emin misin?" / Bumble tarzı).
// Engellemez; gönderen kişiye "Emin misin?" diye sorulur. Onaylanırsa mesaj gider ve işaretlenir.

// Kelime başı eşleşmesi (sonu ne olursa olsun): "siktir", "siktirgit" ...
const STEMS = [
  // "sikis" bilerek yok: Türkçe karaktersiz yazılan "sıkıştım" ile karışıyor.
  'amina', 'aminak', 'amcik', 'amcig', 'orospu', 'orosbu', 'sikerim', 'sikeyim', 'siktir', 'sikik',
  'yarrak', 'yarak', 'pezevenk', 'kahpe', 'serefsiz', 'gerizekali', 'pust', 'ibne', 'kaltak', 'fahise',
  'gavat', 'dallama', 'yavsak', 'kevase',
  'fuck', 'bitch', 'slut', 'whore', 'nude', 'pussy',
];
// Tam kelime eşleşmesi (kısa olduğu için)
const WORDS = new Set(['amk', 'aq', 'amq', 'sik', 'oc', 'pic', 'mk', 'sg', 'siktirgit', 'salak', 'aptal', 'nudes', 'cunt']);
// Çok kelimeli ifadeler
const PHRASES = ['ciplak foto', 'ciplak resim', 'ciplak fotograf', 'foto atsana', 'meme foto'];

const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };
const TR = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'ç': 'c', 'ğ': 'g', 'ö': 'o', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };

export function normalize(text) {
  return String(text || '')
    .toLocaleLowerCase('tr')
    .replace(/[ıİşçğöüâîû]/g, (c) => TR[c] || c)
    .replace(/[013457@$!]/g, (c) => LEET[c])
    .replace(/[^a-z\s]/g, ' ')
    .replace(/(.)\1{2,}/g, '$1')     // "siiiik" -> "sik"
    .replace(/\s+/g, ' ')
    .trim();
}

const STEMS_N = STEMS.map(normalize);

/** Metin kırıcı olabilecek bir ifade içeriyor mu? */
export function isOffensive(text) {
  const n = normalize(text);
  if (!n) return false;
  if (PHRASES.some((p) => n.includes(p))) return true;
  for (const w of n.split(' ')) {
    if (WORDS.has(w)) return true;
    if (STEMS_N.some((s) => s && w.startsWith(s))) return true;
  }
  return false;
}
