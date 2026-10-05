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
  const stopwords = new Set("a an and are about apa apakah ada artikel buku can could dan di do dokter for from have is itu i ingin ke mengenai of on or please saya see show tell the to tentang untuk video what which who you your yang".split(" "));
  const terms = value => normalize(value).split(" ").filter(word => word.length > 2 && !stopwords.has(word));
  const retrieve = (question, items, limit = 5) => {
    const queryTerms = terms(question).slice(0, 16);
    if (!queryTerms.length || !Array.isArray(items)) return [];
    return items.filter(item => item && /^https:\/\/bamedicale\.com\//.test(String(item.url || "")))
      .map(item => {
        const title = normalize(item.title), metadata = normalize([item.type, item.family, item.audience, ...(item.disease || []), ...(item.topics || []), ...(item.authors || [])].join(" "));
        const body = normalize(`${item.summary || ""} ${item.content || ""}`);
        const score = queryTerms.reduce((total, term) => total + (title.includes(term) ? 8 : 0) + (metadata.includes(term) ? 5 : 0) + (body.includes(term) ? 1 : 0), 0)
          + (item.family === "profile" && /\b(who|siapa)\b/i.test(question) ? 20 : 0);
        return { item, score };
      }).filter(entry => entry.score >= 5).sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title))).slice(0, Math.max(0, Math.min(8, limit)))
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
  const insights = (visitors, inquiries, period = "30 Days", now = Date.now()) => {
    const start = periodStart(period, now);
    const selected = inquiries.filter(row => withinPeriod(row.timestamp, period, now));
    const selectedVisitors = visitors.filter(row => period === "All Time" || withinPeriod(row.created_at, period, now) || withinPeriod(row.last_activity_at, period, now));
    const count = predicate => selected.filter(predicate).length;
    const rated = count(row => row.helpful_feedback === "HELPFUL" || row.helpful_feedback === "NOT_HELPFUL");
    const by = field => Object.entries(selected.reduce((acc, row) => { const key = String(row[field] || "").trim(); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, count: value }));
    const opportunities = by("topic").map(row => ({ ...row, gaps: selected.filter(item => item.topic === row.label && item.content_gap === "TRUE").length })).filter(row => row.count >= 3 && row.gaps > 0);
    return {
      period, totalVisitors: selectedVisitors.length, newVisitors: selectedVisitors.filter(row => withinPeriod(row.created_at, period, now)).length,
      returningVisitors: selectedVisitors.filter(row => period === "All Time" ? Number(row.session_count) > 1 : !withinPeriod(row.created_at, period, now)).length,
      sessions: new Set(selected.map(row => row.session_id)).size, inquiries: selected.length,
      groundedRate: selected.length ? count(row => row.answer_status === "GROUNDED") / selected.length : null,
      contentGapRate: selected.length ? count(row => row.content_gap === "TRUE") / selected.length : null,
      helpfulRate: rated ? count(row => row.helpful_feedback === "HELPFUL") / rated : null,
      safetyLimited: count(row => row.answer_status === "SAFETY_LIMITED"),
      averageLatencyMs: selected.length ? selected.reduce((sum, row) => sum + (Number(row.response_latency_ms) || 0), 0) / selected.length : null,
      audiences: by("audience"), professions: by("profession"), questions: by("question"), topics: by("topic"), diseases: by("disease"),
      statuses: by("answer_status"), opportunities, recent: selected.slice(-30).reverse()
    };
  };
  return Object.freeze({ professions, consentVersion, email, phone, validProfile, retrieve, classifySafety, redact, logQuestion, periodStart, withinPeriod, insights });
})();
if (typeof module === "object" && module.exports) module.exports = BAMI_CORE;
