const ARABIZI_MAP: Record<string, string> = {
  "ayfon": "ايفون",
  "iphone": "ايفون",
  "samsung": "سامسونج",
  "samsng": "سامسونج",
  "samsong": "سامسونج",
  "labtop": "لابتوب",
  "laptop": "لابتوب",
  "mobile": "موبايل",
  "mobayel": "موبايل",
  "tablet": "تابلت",
  "tabelt": "تابلت",
  "headphone": "سماعة",
  "headphones": "سماعات",
  "tv": "تلفزيون",
  "television": "تلفزيون",
  "washer": "غسالة",
  "fridge": "ثلاجة",
  "microwave": "ميكروويف",
  "blender": "خلاط",
  "camera": "كاميرا",
  "printer": "طابعة",
  "router": "راوتر",
  "mouse": "ماوس",
  "keyboard": "كيبورد",
  "monitor": "شاشة",
  "speaker": "سبيكر",
  "charger": "شاحن",
  "cable": "كابل",
  "case": "جراب",
  "cover": "جراب",
  "screen protector": "واقي شاشة",
  "power bank": "باور بانك",
  "smart watch": "ساعة ذكية",
  "smartwatch": "ساعة ذكية",
  "earbuds": "سماعة",
  "airpods": "ايربودز",
  "playstation": "بلايستيشن",
  "ps5": "بلايستيشن 5",
  "xbox": "اكس بوكس",
  "nintendo": "نينتندو",
  "gaming": "جيمنج",
};

const SYNONYM_MAP: Record<string, string[]> = {
  "phone": ["mobile", "smartphone", "موبايل", "هاتف", "جوال"],
  "laptop": ["notebook", "لابتوب", "لاب توب", "حاسب محمول"],
  "headphones": ["earphones", "earbuds", "سماعة", "سماعات"],
  "tv": ["television", "تلفزيون", "شاشة تلفزيون"],
  "fridge": ["refrigerator", "ثلاجة"],
  "washer": ["washing machine", "غسالة"],
};

export function normalizeQuery(query: string): string {
  let q = query.trim().toLowerCase();
  // Remove extra spaces
  q = q.replace(/\s+/g, " ");
  // Remove common noise words
  q = q.replace(/\b(the|a|an|for|in|on|at|to|of)\b/gi, "").trim();
  return q;
}

export function detectLanguage(query: string): string {
  if (/[\u0600-\u06FF]/.test(query)) return "ar";
  const arabicRegex = /[؀-ۿ]/;
  if (arabicRegex.test(query)) return "ar";

  const hasLatinWithArabicNumbers = /[a-zA-Z]/.test(query) && /(^|[a-zA-Z])[2379][a-zA-Z]/i.test(query);
  if (hasLatinWithArabicNumbers) return "arabizi";

  return "en";
}

export function transliterate(query: string): string {
  const lower = query.toLowerCase().trim();

  // Direct lookup
  if (ARABIZI_MAP[lower]) return ARABIZI_MAP[lower];

  // Token-level transliteration
  const tokens = lower.split(/\s+/);
  const transliterated = tokens.map((t) => ARABIZI_MAP[t] || t);
  const result = transliterated.join(" ");

  return result !== lower ? result : "";
}

export function expandSynonyms(query: string): string[] {
  const lower = query.toLowerCase();
  const expansions: string[] = [];

  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (lower.includes(key) || synonyms.some((s) => lower.includes(s))) {
      expansions.push(...synonyms, key);
    }
  }

  return [...new Set(expansions)];
}
