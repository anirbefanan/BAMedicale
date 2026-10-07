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
    const idWords = new Set("ada aku apa artikel bagaimana bantu berkaitan bisa buat bulan cari dengan dong gak hai hal halo hipertensi ini itu jelaskan kamu kanker kemarin kucing jamur lanjut lalu makasih materi mau mengenai menjelaskan nggak pakai pagi payudara poin saya selamat seminar siapa siang sore malam tentang terima kasih terbaru terus tidak tiroid untuk ya".split(" "));
    const enWords = new Set("about anything are breast can cancer cats do feline fungal have hello hey hi how i is know last latest me month morning newest nodule please published recent related see show thanks thank thyroid what who why with you your".split(" "));
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
  const stopwords = new Set("a an and are about anything apa apakah ada any awam bantu berkaitan bisa can cari could dan dari dengan di diketahui do dokter explain find for from hal have how ingin ini is it itu i jelaskan kenapa ke konten materi membahas menjelaskan mengenai of on or orang penting please poin perlu punya related saya see show something tell the this to tentang terkait untuk what which who why you your yang".split(" "));
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
  const requestedFamily = query => ["ebook", "seminar", "video", "presentation", "article"].find(family => hasConcept(query, family)) ||
    (/\bseminarnya\b/.test(query) ? "seminar" : /\bpresentasinya\b/.test(query) ? "presentation" : /\bvideonya\b/.test(query) ? "video" : /\bebooknya\b/.test(query) ? "ebook" : /\bartikelnya\b/.test(query) ? "article" : "");
  const discoverySpellings = Object.freeze({ artcle: "article", artice: "article", artike: "artikel", artikle: "artikel", seminer: "seminar", semnar: "seminar", vidio: "video", vedio: "video", latset: "latest", newst: "newest", buln: "bulan" });
  const normalizeDiscovery = value => normalize(value).split(" ").map(word => discoverySpellings[word] || word).join(" ");
  // Normalize website-discovery language into facts the registry can answer. Keep
  // grammar words out of medical-topic retrieval; the same intent works across
  // languages and paraphrases without making Gemini the inventory database.
  const discoveryWords = new Set("ada apa apakah are any artikel articles article baru bawakan berapa bulan can cari could did do does dont e book ebook ebooks gak give have healthcare hi how i in ini is it itu kah kalau kalo kemarin know last latest lalu link linknya list listed mana materi masyarakat me minggu month months most newest new of pada paling past pembicara previous professionals public publish published recently recent registered released resources saja sebelumnya see seminar seminars show siang something tahun tell tenaga there this to terbaru terakhir tersedia upcoming untuk was were which what where who you your yang yes".split(" "));
  const queryMeaning = (question, prior = null) => {
    const q = normalizeDiscovery(question), words = q.split(" ");
    const family = requestedFamily(q) || (prior && /\b(bulan|month|kemarin|lalu|last|previous|yang|what about|kalo|kalau|materinya|pembicara|speaker|link|video|presentasi)\b/.test(q) ? requestedFamily(normalize(prior.question || "")) : "");
    const period = /\b(?:bulan (?:kemarin|lalu|sebelumnya)|(?:last|previous) month)\b/.test(q) ? "last_month"
      : /\b(?:bulan ini|this month|current month)\b/.test(q) ? "this_month"
      : /\b(?:tahun (?:kemarin|lalu)|(?:last|previous) year)\b/.test(q) ? "last_year"
      : /\b(?:tahun ini|this year|current year)\b/.test(q) ? "this_year"
      : /\b(?:minggu (?:kemarin|lalu)|(?:last|previous) week)\b/.test(q) ? "last_week"
      : /\b(?:minggu ini|this week|current week)\b/.test(q) ? "this_week"
      : /\b(?:hari ini|today)\b/.test(q) ? "today"
      : /\b(?:kemarin|yesterday)\b/.test(q) ? "yesterday" : "";
    const latest = /\b(?:terbaru|terakhir|terkini|latest|newest|most recent(?:ly)?|recently published|published recently)\b/.test(q);
    const count = /\b(?:berapa|jumlah|how many|number of)\b/.test(q);
    const discover = /\b(?:ada|punya|tersedia|terdaftar|apa saja|mana|dimana|link|what|which|where|show|find|list|bisa baca|can i read|do you have|are there|any|published|publish|terbit)\b/.test(q);
    const detail = /\b(?:materinya apa|membahas apa|presentasinya|videonya|ebooknya dimana|artikelnya dimana|linknya|link artikel ini|materi seminarnya|siapa pembicara(?:nya)?|who spoke|speakers?)\b/.test(q);
    const general = /\b(?:materi|konten|content|materials?|resources?|published|publish|terbit)\b/.test(q);
    const topicTerms = concepts(words.filter(word => word.length > 2 && !stopwords.has(word) && !discoveryWords.has(word) && !["video", "videos", "presentasi", "presentation", "presentations", "seminar", "seminars", "artikel", "article", "articles", "ebook", "ebooks"].includes(word)));
    return { q, family, period, latest, count, discover, detail, general, topicTerms };
  };
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
      }).filter(entry => entry.score >= 5 && entry.coverage >= (queryTerms.length > 1 ? 0.5 : 1)).sort((a, b) => b.coverage - a.coverage || b.score - a.score || String(a.item.title).localeCompare(String(b.item.title))).slice(0, Math.max(0, Math.min(100, limit)))
      .map(entry => entry.item);
  };
  // Complete published inventory answers are deterministic, including a verified zero.
  const websiteLookup = (question, items, lang = "en", now = Date.now(), prior = null) => {
    if (!Array.isArray(items) || !items.length) return null;
    const priorItems = (prior?.ids || []).map(id => items.find(item => item.id === id)).filter(Boolean);
    const meaning = queryMeaning(question, prior), { q, period, latest, count, detail, general, topicTerms } = meaning;
    const family = requestedFamily(q) || meaning.family;
    if ((!family && !priorItems.length && !general) || (!period && !latest && !count && !meaning.discover && !detail && !/\b(yang untuk|for doctors?|for public|untuk dokter|upcoming|past|mendatang|lampau)\b/.test(q))) return null;
    if (/\b(apa itu|what is|jelaskan|explain|kenapa|why|bagaimana)\b/.test(q) && !latest && !count && !/\b(ada|do you have|are there|membahas apa|materinya apa)\b/.test(q)) return null;
    const local = new Date(now + 7 * 3600000), y = local.getUTCFullYear(), m = local.getUTCMonth(), d = local.getUTCDate(), weekday = (local.getUTCDay() + 6) % 7;
    const at = (year, month, day) => Date.UTC(year, month, day) - 7 * 3600000;
    const windows = { this_month: [at(y,m,1),at(y,m+1,1)], last_month: [at(y,m-1,1),at(y,m,1)], this_year: [at(y,0,1),at(y+1,0,1)], last_year: [at(y-1,0,1),at(y,0,1)], this_week: [at(y,m,d-weekday),at(y,m,d-weekday+7)], last_week: [at(y,m,d-weekday-7),at(y,m,d-weekday)], today: [at(y,m,d),at(y,m,d+1)], yesterday: [at(y,m,d-1),at(y,m,d)] };
    const date = item => Date.parse(item.family === "seminar" ? item.eventStart || "" : item.date || "");
    let found = items.filter(item => (!item.status || item.status === "published") && item.url && (!family ? item.family !== "profile" : item.family === family));
    const audience = /\b(dokter|doctors?|physicians?)\b/.test(q) ? "DOCTOR" : /\b(healthcare professionals?|tenaga kesehatan)\b/.test(q) ? "HEALTHCARE WORKER" : /\b(public|masyarakat|umum)\b/.test(q) ? "PUBLIC" : "";
    if (audience) found = found.filter(item => item.audience === audience || (item.audiences || []).includes(audience));
    if (period) found = found.filter(item => Number.isFinite(date(item)) && date(item) >= windows[period][0] && date(item) < windows[period][1]);
    else if (/\b(upcoming|mendatang)\b/.test(q)) found = found.filter(item => item.family === "seminar" && Date.parse(item.eventEnd || item.eventStart) > now);
    else if (/\b(past|lampau)\b/.test(q)) found = found.filter(item => item.family === "seminar" && Date.parse(item.eventEnd || item.eventStart) <= now);
    if (priorItems.length && !requestedFamily(q) && !period && !topicTerms.length && (latest || audience)) found = priorItems.filter(item => !audience || item.audience === audience || (item.audiences || []).includes(audience));
    if (topicTerms.length && (!detail || !priorItems.length)) found = retrieve(topicTerms.join(" "), found, found.length);
    if (!family && topicTerms.length && !found.length) return null; // An absent broad medical subject needs an honest content-gap response.
    const resultFamily = detail && /\b(presentasinya|presentation)\b/.test(q) ? "presentation" : detail && /\bvideonya\b/.test(q) ? "video" : family;
    if (detail && priorItems.length && !period && !latest) found = (resultFamily === "presentation" || (/\bvideonya\b/.test(q) && priorItems[0].family === "seminar")) ? items.filter(item => item.family === resultFamily && item.eventId === priorItems[0].id) : priorItems;
    found.sort((a,b) => date(b) - date(a) || String(a.title).localeCompare(String(b.title)));
    const id = lang === "id", label = { seminar: "seminar", ebook: "eBook", video: "video", article: id ? "artikel" : "article", presentation: id ? "presentasi" : "presentation" }[resultFamily] || (id ? "materi" : "item");
    const periodLabel = period ? new Intl.DateTimeFormat(id ? "id-ID" : "en-US", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(windows[period][0])) : "";
    const selected = found.slice(0, latest ? 1 : 5), sources = selected.map(item => ({ id: item.id, title: item.title, type: item.type, url: item.url }));
    const names = selected.map(item => `${item.title}${item.family === "seminar" && item.eventStart ? ` (${new Intl.DateTimeFormat(id ? "id-ID" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(item.eventStart))})` : ""}`).join("; ");
    let answer = !found.length ? (id ? `Belum ada ${label} BA Medicale yang terdaftar${periodLabel ? ` untuk ${periodLabel}` : ""}.` : `No BA Medicale ${label} is listed${periodLabel ? ` for ${periodLabel}` : ""}.`) : latest ? (id ? `${label} terbaru BA Medicale: ${names}.` : `Latest BA Medicale ${label}: ${names}.`) : count ? (id ? `BA Medicale memiliki ${found.length} ${label}${periodLabel ? ` pada ${periodLabel}` : ""}.` : `BA Medicale has ${found.length} ${label}${found.length === 1 ? "" : "s"}${periodLabel ? ` in ${periodLabel}` : ""}.`) : `${id ? `BA Medicale memiliki ${found.length} ${label}${periodLabel ? ` pada ${periodLabel}` : ""}` : `BA Medicale has ${found.length} ${label}${found.length === 1 ? "" : "s"}${periodLabel ? ` in ${periodLabel}` : ""}`}: ${names}${found.length > selected.length ? ` ${id ? "dan lainnya" : "and more"}` : ""}.`;
    if (detail && found.length && /\b(materinya apa|membahas apa|siapa pembicara(?:nya)?|who spoke|speakers?)\b/.test(q)) answer += ` ${selected.map(item => /\b(pembicara(?:nya)?|who spoke|speakers?)\b/.test(q) ? (item.speakers || item.presenters || item.authors || []).join(", ") : item.summary).filter(Boolean).join(" ")}`;
    const needsSynthesis = Boolean(found.length && /\b(jelaskan|menjelaskan|explain|membahas apa|poin penting|what does|apa yang dijelaskan)\b/.test(q));
    return { answer, status: "STRUCTURED", sources, count: found.length, family: resultFamily, period, route: "structured_lookup", needsSynthesis };
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
    const real = row => String(row.is_qa || "").toUpperCase() !== "TRUE";
    const selected = inquiries.filter(row => real(row) && withinPeriod(row.timestamp, period, now));
    const selectedVisitors = visitors.filter(row => real(row) && (period === "All Time" || withinPeriod(row.created_at, period, now) || withinPeriod(row.last_activity_at, period, now)));
    const count = predicate => selected.filter(predicate).length;
    // Only recorded knowledge outcomes enter the denominator. Old rows without a reliable
    // status stay unknown; current corpus changes never rewrite historical outcomes.
    const knowledge = selected.filter(row => ["GROUNDED", "PARTIAL", "CONTENT_GAP"].includes(String(row.answer_status)) && !injection(row.question) && intent(row.question) === "KNOWLEDGE");
    const knowledgeCount = predicate => knowledge.filter(predicate).length;
    const rated = count(row => row.helpful_feedback === "HELPFUL" || row.helpful_feedback === "NOT_HELPFUL");
    const by = (field, rows = selected) => Object.entries(rows.reduce((acc, row) => { const key = String(row[field] || "").trim(); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, count: value }));
    const gapKind = row => {
      if (!Array.isArray(publishedItems)) return "UNAVAILABLE";
      if (!terms(row.question).length || /^\[/.test(String(row.question || ""))) return "UNKNOWN";
      return (websiteLookup(row.question, publishedItems, language(row.question), Date.parse(row.timestamp)) || retrieve(row.question, publishedItems, 1).length) ? "COVERED" : "UNRESOLVED";
    };
    const gapAudit = Object.fromEntries(["COVERED", "UNRESOLVED", "UNKNOWN", "UNAVAILABLE"].map(kind => [kind, knowledge.filter(row => gapKind(row) === kind).length]));
    // Unresolved records often have no topic because retrieval found no source.
    // Cluster by recorded topic when present, otherwise by the exact normalized question.
    const clusters = new Map();
    knowledge.filter(row => gapKind(row) === "UNRESOLVED").forEach(row => {
      const label = String(row.topic || row.question || "").trim();
      if (!label) return;
      const key = label.toLowerCase().replace(/\s+/g, " ");
      const prior = clusters.get(key) || { label, count: 0, gaps: 0, lastAsked: "" };
      prior.count++; prior.gaps++; if (String(row.timestamp) > prior.lastAsked) prior.lastAsked = String(row.timestamp);
      clusters.set(key, prior);
    });
    const opportunities = [...clusters.values()].filter(row => row.count >= 3)
      .sort((a, b) => b.count - a.count || b.lastAsked.localeCompare(a.lastAsked)).slice(0, 10);
    return {
      period, totalVisitors: selectedVisitors.length, newVisitors: selectedVisitors.filter(row => withinPeriod(row.created_at, period, now)).length,
      returningVisitors: selectedVisitors.filter(row => period === "All Time" ? Number(row.session_count) > 1 : !withinPeriod(row.created_at, period, now)).length,
      sessions: new Set(selected.map(row => row.session_id)).size, inquiries: selected.length,
      groundedRate: knowledge.length ? knowledgeCount(row => row.answer_status === "GROUNDED") / knowledge.length : null,
      historicalEligible: knowledge.length, historicalGaps: knowledgeCount(row => row.answer_status === "CONTENT_GAP"),
      historicalGapRate: knowledge.length ? knowledgeCount(row => row.answer_status === "CONTENT_GAP") / knowledge.length : null,
      currentAudited: knowledge.length - gapAudit.UNKNOWN - gapAudit.UNAVAILABLE,
      currentUnresolved: gapAudit.UNRESOLVED,
      currentCorpusGapRate: Array.isArray(publishedItems) && knowledge.length && gapAudit.UNKNOWN === 0 ? gapAudit.UNRESOLVED / knowledge.length : null,
      historicalGapsResolved: knowledge.filter(row => row.answer_status === "CONTENT_GAP" && gapKind(row) === "COVERED").length,
      unknownRows: selected.length - knowledge.length - count(row => ["CONVERSATIONAL", "STRUCTURED", "SAFETY_LIMITED", "ERROR"].includes(String(row.answer_status))),
      excludedConversation: count(row => row.answer_status === "CONVERSATIONAL"), excludedStructured: count(row => row.answer_status === "STRUCTURED"), excludedSafety: count(row => row.answer_status === "SAFETY_LIMITED"), excludedErrors: count(row => row.answer_status === "ERROR"),
      qaInquiries: inquiries.filter(row => String(row.is_qa || "").toUpperCase() === "TRUE" && withinPeriod(row.timestamp, period, now)).length,
      gapAudit,
      helpfulRate: rated ? count(row => row.helpful_feedback === "HELPFUL") / rated : null,
      safetyLimited: count(row => row.answer_status === "SAFETY_LIMITED"),
      averageLatencyMs: selected.length ? selected.reduce((sum, row) => sum + (Number(row.response_latency_ms) || 0), 0) / selected.length : null,
      audiences: by("audience"), professions: by("profession"), questions: by("question", knowledge), topics: by("topic", knowledge), diseases: by("disease", knowledge),
      statuses: by("answer_status"), opportunities, recent: selected.slice(-30).reverse()
    };
  };
  return Object.freeze({ professions, consentVersion, email, phone, validProfile, retrieve, websiteLookup, searchTerms: value => concepts(terms(value)).flatMap(concept => aliases[concept] || [concept]), classifySafety, injection, language, intent, conversation, redact, logQuestion, periodStart, withinPeriod, insights });
})();
if (typeof module === "object" && module.exports) module.exports = BAMI_CORE;
