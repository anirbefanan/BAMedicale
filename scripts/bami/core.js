/* Shared deterministic BAMI rules. Bundled into the separate public Apps Script service. */
const BAMI_CORE = (() => {
  const professions = Object.freeze({
    Doctors: ["General Practitioner", "Specialist", "Resident", "Medical Student", "Other"],
    "Healthcare Professionals": ["Nurse", "Midwife", "Pharmacist", "Nutritionist / Dietitian", "Medical Laboratory Professional", "Radiographer", "Physiotherapist", "Other"],
    Public: ["Private Employee", "Government Employee", "Student", "Entrepreneur", "Homemaker", "Retired", "Other"]
  });
  const consentVersion = "bami-v1-2026-10";
  const email = value => String(value || "").trim().toLowerCase();
  const phone = value => {
    const raw = String(value || "").replace(/[\s().-]/g, "");
    const normalized = raw.startsWith("+62") ? raw : raw.startsWith("62") ? `+${raw}` : raw.startsWith("08") ? `+62${raw.slice(1)}` : "";
    return /^\+628[1-9]\d{7,11}$/.test(normalized) ? normalized : "";
  };
  const validProfile = input => {
    const address = email(input.email), mobile = phone(input.phone), audience = String(input.audience || ""), profession = String(input.profession || "");
    if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(address) || address.length > 254) return { error: "Enter a valid email address." };
    if (!mobile) return { error: "Enter a valid Indonesian mobile number." };
    if (!professions[audience] || !professions[audience].includes(profession)) return { error: "Choose your audience and profession." };
    if (input.consent !== true || input.consentVersion !== consentVersion) return { error: "Consent is required to start BAMI." };
    const detail = String(input.professionDetail || "").trim().slice(0, 80);
    if (detail && !(profession === "Other" || profession === "Specialist")) return { error: "Profession detail is not applicable." };
    return { profile: { email: address, phone: mobile, audience, profession, professionDetail: detail, consent: true, consentVersion } };
  };
  const normalize = value => String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const injection = question => /ignore (previous|all|your) instructions|system prompt|api key|show me (the )?(database|sheet|secret)|database|script properties|private (data|records)|unpublished content|credential|password|jumi/i.test(question);
  const language = (question, previous = "en") => {
    const text = normalize(question);
    if (/\b(jawab|pakai|gunakan|balas|respond|answer|reply|speak|use)\b.{0,30}\b(bahasa indonesia|indonesian)\b/.test(text)) return "id";
    if (/\b(jawab|pakai|gunakan|balas|respond|answer|reply|speak|use)\b.{0,30}\b(english|inggris)\b/.test(text)) return "en";
    if (/^(thanks|thank you|ok|okay|yes|no|bye|goodbye|why|what about it|video|ebook|seminar)$/.test(text)) return previous === "id" ? "id" : "en";
    const idWords = new Set("ada aku apa artikel bagaimana bantu berkaitan bisa buat cari dengan dong gak hai hal halo ini itu kamu kanker kucing jamur tiroid payudara hipertensi lanjut makasih mau mengenai nggak pakai pagi saya selamat seminar siapa siang sore malam tentang terima kasih terus tidak untuk ya".split(" "));
    const enWords = new Set("about anything are breast can cancer cats do feline fungal have hello hey hi how i is me morning nodule please related see show thanks thank thyroid what who why with you your".split(" "));
    const words = text.split(" ");
    const id = words.filter(word => idWords.has(word)).length, en = words.filter(word => enWords.has(word)).length;
    if (id > en) return "id";
    if (en > id) return "en";
    return previous === "id" ? "id" : "en";
  };
  const intent = question => {
    const text = normalize(question).replace(/\b(ya|dong|please)$/, "").trim();
    if (/^(jawab|pakai|gunakan|balas|respond|answer|reply|speak|use)( in)? (bahasa indonesia|indonesian|english|inggris)$/.test(text)) return "LANGUAGE_REQUEST";
    if (/^(halo|hai|hi|hello|hey|good morning|good afternoon|good evening|selamat pagi|selamat siang|selamat sore|selamat malam)$/.test(text)) return "GREETING";
    if (/^(makasih|terima kasih|thanks|thank you|okay|ok|sip|got it|noted)$/.test(text)) return "ACKNOWLEDGEMENT";
    if (/^(bye|goodbye|see you|sampai jumpa|dadah|makasih ya)$/.test(text)) return "GOODBYE";
    if (/^(siapa kamu|kamu siapa|bami itu apa|who are you|what are you)$/.test(text)) return "IDENTITY";
    if (/^(kamu bisa bantu apa|bisa tanya apa|what can you do|what can i ask|help)$/.test(text)) return "CAPABILITIES";
    if (/^(maksudnya|terus|what about it|video|ebook|seminar|artikel|article|yes|no|why)$/.test(text)) return "CLARIFICATION";
    return "KNOWLEDGE";
  };
  const conversation = (kind, lang) => {
    const id = {
      GREETING: "Halo! Saya BAMI, AI Assistant BA Medicale. Ada yang bisa BAMI bantu?",
      ACKNOWLEDGEMENT: "Sama-sama. Kalau ada yang ingin kamu cari lagi, tanya BAMI saja.",
      GOODBYE: "Sampai jumpa! BAMI siap membantu saat kamu ingin belajar lagi.",
      IDENTITY: "Saya BAMI, BA Medicale Intelligence—AI Assistant BA Medicale. Saya membantu kamu menemukan dan memahami materi BA Medicale yang sudah diterbitkan.",
      CAPABILITIES: "BAMI bisa membantu kamu menemukan dan memahami artikel, video, eBook, seminar, dan presentasi yang diterbitkan BA Medicale. Apa yang ingin kamu cari?",
      LANGUAGE_REQUEST: "Baik, BAMI akan menjawab dalam Bahasa Indonesia. Apa yang ingin kamu ketahui?",
      CLARIFICATION: "Boleh diperjelas? Kamu ingin penjelasan singkat atau mencari artikel, video, eBook, dan seminar tentang topik itu?"
    };
    const en = {
      GREETING: "Hi! I’m BAMI, BA Medicale’s AI Assistant. How can I help you today?",
      ACKNOWLEDGEMENT: "You’re welcome. If there’s anything else you’d like to find, just ask BAMI.",
      GOODBYE: "See you! BAMI is here when you’re ready to learn more.",
      IDENTITY: "I’m BAMI, BA Medicale Intelligence—BA Medicale’s AI Assistant. I help you find and understand published BA Medicale learning materials.",
      CAPABILITIES: "I can help you find and understand BA Medicale articles, videos, eBooks, seminars, and presentations. What would you like to explore?",
      LANGUAGE_REQUEST: "Sure, I’ll respond in English. What would you like to know?",
      CLARIFICATION: "Could you tell me a little more? Would you like a brief explanation or help finding articles, videos, eBooks, or seminars on that topic?"
    };
    return (lang === "id" ? id : en)[kind] || "";
  };
  const stopwords = new Set("a an and are about anything apa apakah ada any bantu berkaitan bisa can cari could dan dari dengan di do dokter find for from hal have is itu i ingin ke konten materi mengenai of on or please punya related saya see show something tell the to tentang untuk what which who you your yang".split(" "));
  const terms = value => normalize(value).split(" ").filter(word => word.length > 2 && !stopwords.has(word));
  const aliases = Object.freeze({
    cat: ["cat", "cats", "feline", "kucing"], fungal: ["fungal", "fungus", "fungi", "jamur"],
    thyroid: ["thyroid", "tiroid"], nodule: ["nodule", "nodules", "nodul", "benjolan"],
    breast: ["breast", "payudara"], cancer: ["cancer", "cancers", "kanker", "malignancy", "malignant", "neoplasia"],
    sporotrichosis: ["sporotrichosis", "sporotrikosis"], hypertension: ["hypertension", "hipertensi", "high blood pressure"],
    ebook: ["ebook", "ebooks", "buku"], seminar: ["seminar", "seminars"],
    video: ["video", "videos"], presentation: ["presentation", "presentations", "presentasi"],
    article: ["article", "articles", "artikel"]
  });
  const concepts = words => [...new Set(words.map(word => Object.keys(aliases).find(key => aliases[key].includes(word)) || word))];
  const hasConcept = (text, concept) => (aliases[concept] || [concept]).some(alias => new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`).test(text));
  const conceptFrequency = (text, concept) => (aliases[concept] || [concept]).reduce((total, alias) => total + (text.match(new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`, "g")) || []).length, 0);
  const requestedFamily = query => ["ebook", "seminar", "video", "presentation", "article"].find(family => hasConcept(query, family));
  const retrieve = (question, items, limit = 5) => {
    const query = normalize(question), family = requestedFamily(query);
    const queryTerms = concepts(terms(question)).filter(term => term !== family).slice(0, 16);
    if (!queryTerms.length || !Array.isArray(items)) return [];
    return items.filter(item => item && /^https:\/\/bamedicale\.com\//.test(String(item.url || "")) && (!family || item.family === family))
      .map(item => {
        const title = normalize(item.title), metadata = normalize([item.type, item.family, item.audience, item.condition, item.source, ...(item.disease || []), ...(item.categories || []), ...(item.topics || []), ...(item.authors || [])].join(" "));
        const summary = normalize(`${item.subtitle || ""} ${item.summary || ""}`), body = normalize(item.content || "");
        const matched = queryTerms.filter(term => [title, metadata, summary, body].some(field => hasConcept(field, term)));
        const score = matched.reduce((total, term) => total + (hasConcept(title, term) ? 8 : 0) + (hasConcept(metadata, term) ? 5 : 0) + (hasConcept(summary, term) ? 3 : 0) + Math.min(5, conceptFrequency(body, term)), 0)
          + (item.family === "profile" && /\b(who|siapa)\b/i.test(question) ? 20 : 0);
        return { item, score, coverage: matched.length / queryTerms.length };
      }).filter(entry => entry.score >= 5 && entry.coverage >= (queryTerms.length > 1 ? 0.5 : 1)).sort((a, b) => b.coverage - a.coverage || b.score - a.score || String(a.item.title).localeCompare(String(b.item.title))).slice(0, Math.max(0, Math.min(8, limit)))
      .map(entry => entry.item);
  };
  const classifySafety = question => {
    const text = normalize(question);
    if (/difficulty breathing|cannot breathe|trouble breathing|sesak napas|sulit bernapas|unconscious|tidak sadar|severe chest pain|nyeri dada hebat/.test(text)) return "urgent";
    if (/what medicine should i take|which medicine should i take|can i stop (this|my) medicine|obat apa yang harus saya minum|bolehkah saya berhenti (minum )?obat|diagnose me|diagnosis saya|(?:i have|my child has|my mother has|my father has|saya punya|saya mengalami|anak saya|ibu saya|ayah saya).{0,100}(?:pain|lump|symptom|disease|cancer|thyroid|nyeri|benjolan|gejala|penyakit|kanker|tiroid)/.test(text)) return "personal";
    return "normal";
  };
  const redact = value => String(value || "").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]").replace(/(?:\+?62|0)8\d[\d\s().-]{7,14}/g, "[phone]").slice(0, 1000);
  const logQuestion = (question, safety) => safety === "normal" && !/\b(my|mine|saya|anak saya|ibu saya|ayah saya|aku|istri saya|suami saya)\b/i.test(question) ? redact(question) : "[personal medical question withheld]";
  const periodStart = (period, now) => {
    const offset = 7 * 3600000, today = new Date(now + offset), day = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - offset;
    if (period === "Today") return day;
    if (period === "7 Days") return day - 6 * 86400000;
    if (period === "30 Days") return day - 29 * 86400000;
    if (period === "This Month") return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1) - offset;
    if (period === "Previous Month") return Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1) - offset;
    return 0;
  };
  const withinPeriod = (value, period, now) => {
    const at = Date.parse(value), today = new Date(now + 7 * 3600000), end = period === "Previous Month" ? Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1) - 7 * 3600000 : Infinity;
    return Number.isFinite(at) && at >= periodStart(period, now) && at < end;
  };
  const insights = (visitors, inquiries, period = "30 Days", now = Date.now(), publishedItems = null) => {
    const start = periodStart(period, now);
    const selected = inquiries.filter(row => withinPeriod(row.timestamp, period, now));
    const selectedVisitors = visitors.filter(row => period === "All Time" || withinPeriod(row.created_at, period, now) || withinPeriod(row.last_activity_at, period, now));
    const count = predicate => selected.filter(predicate).length;
    // Conversation and safety turns remain in visitor/session/inquiry totals but are not knowledge-answer opportunities.
    const knowledge = selected.filter(row => !["CONVERSATIONAL", "SAFETY_LIMITED", "ERROR"].includes(row.answer_status) && (injection(row.question) || intent(row.question) === "KNOWLEDGE"));
    const knowledgeCount = predicate => knowledge.filter(predicate).length;
    const rated = count(row => row.helpful_feedback === "HELPFUL" || row.helpful_feedback === "NOT_HELPFUL");
    const by = (field, rows = selected) => Object.entries(rows.reduce((acc, row) => { const key = String(row[field] || "").trim(); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, count: value }));
    const isGap = row => String(row.content_gap).toUpperCase() === "TRUE";
    const gapKind = row => {
      if (!isGap(row)) return "NOT_GAP";
      if (injection(row.question) || row.answer_status === "SAFETY_LIMITED") return "SAFETY_LIMITED";
      if (intent(row.question) !== "KNOWLEDGE") return "CONVERSATIONAL";
      if (!Array.isArray(publishedItems)) return "UNVERIFIED";
      const at = Date.parse(row.timestamp);
      const contemporary = publishedItems.filter(item => item.date && Number.isFinite(at) && Date.parse(item.date) <= at);
      if (retrieve(row.question, contemporary, 1).length) return "RETRIEVAL_MISS";
      if (terms(row.question).length === 0 || /^\[/.test(String(row.question || ""))) return "AMBIGUOUS_QUERY";
      return "GENUINE_CONTENT_GAP";
    };
    const auditedGaps = knowledge.filter(isGap);
    const gapAudit = Object.fromEntries(["GENUINE_CONTENT_GAP", "RETRIEVAL_MISS", "AMBIGUOUS_QUERY", "CONVERSATIONAL", "SAFETY_LIMITED", "UNVERIFIED"].map(kind => [kind, auditedGaps.filter(row => gapKind(row) === kind).length]));
    const opportunities = by("topic", knowledge.filter(row => gapKind(row) === "GENUINE_CONTENT_GAP"))
      .map(row => ({ label: row.label, count: knowledgeCount(item => item.topic === row.label), gaps: row.count }))
      .filter(row => row.count >= 3);
    return {
      period, totalVisitors: selectedVisitors.length, newVisitors: selectedVisitors.filter(row => withinPeriod(row.created_at, period, now)).length,
      returningVisitors: selectedVisitors.filter(row => period === "All Time" ? Number(row.session_count) > 1 : !withinPeriod(row.created_at, period, now)).length,
      sessions: new Set(selected.map(row => row.session_id)).size, inquiries: selected.length,
      groundedRate: knowledge.length ? knowledgeCount(row => row.answer_status === "GROUNDED") / knowledge.length : null,
      contentGapRate: knowledge.length ? knowledgeCount(isGap) / knowledge.length : null,
      correctedGenuineGapRate: Array.isArray(publishedItems) && knowledge.length && gapAudit.AMBIGUOUS_QUERY === 0 && gapAudit.UNVERIFIED === 0 ? gapAudit.GENUINE_CONTENT_GAP / knowledge.length : null,
      gapAudit,
      helpfulRate: rated ? count(row => row.helpful_feedback === "HELPFUL") / rated : null,
      safetyLimited: count(row => row.answer_status === "SAFETY_LIMITED"),
      averageLatencyMs: selected.length ? selected.reduce((sum, row) => sum + (Number(row.response_latency_ms) || 0), 0) / selected.length : null,
      audiences: by("audience"), professions: by("profession"), questions: by("question", knowledge), topics: by("topic", knowledge), diseases: by("disease", knowledge),
      statuses: by("answer_status"), opportunities, recent: selected.slice(-30).reverse()
    };
  };
  return Object.freeze({ professions, consentVersion, email, phone, validProfile, retrieve, searchTerms: value => concepts(terms(value)).flatMap(concept => aliases[concept] || [concept]), classifySafety, injection, language, intent, conversation, redact, logQuestion, periodStart, withinPeriod, insights });
})();
if (typeof module === "object" && module.exports) module.exports = BAMI_CORE;
