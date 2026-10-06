/* One media treatment for canonical published Related Learning records. */
const fs = require('node:fs');
const path = require('node:path');
const escape = value => String(value || "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const { publicAudienceLabel } = require('../content-registry');
const safePath = value => {
  const path = String(value || "").replace(/^\//, "");
  return /^(?!.*\.\.)(?:[a-z0-9_-]+\/)*[a-z0-9_?=&%./-]+$/i.test(path) ? `/${path}` : "";
};
const safeCover = value => {
  const cover = String(value || "");
  if (/^https:\/\/i\.ytimg\.com\/vi\/[a-zA-Z0-9_-]{11}\/(?:hqdefault|maxresdefault|mqdefault)\.jpg$/.test(cover)) return cover;
  return safePath(cover);
};
const renderCard = record => {
  const href = safePath(record.route);
  if (!href || !record.title) return "";
  const family = String(record.family || "resource").toLowerCase();
  const type = record.contentType || family;
  const audience = publicAudienceLabel(record.primaryAudience);
  const candidate = safeCover(record.cover);
  const cover = candidate.startsWith('/') && !fs.existsSync(path.join(__dirname, '..', candidate)) ? '' : candidate;
  const media = `<span class="seo-related-card__fallback" aria-hidden="true">BA Medicale</span>${cover ? `<img src="${escape(cover)}" alt="" loading="lazy" decoding="async" width="640" height="420">` : ''}`;
  return `<a class="seo-related-card seo-related-card--${escape(family)}" href="${escape(href)}"><span class="seo-related-card__media">${media}</span><span class="seo-related-card__body"><span class="seo-related-card__type">${escape(type)}${audience ? ` · ${escape(audience)}` : ''}</span><b>${escape(record.title)}</b><span class="seo-related-card__action">Explore learning <span aria-hidden="true">→</span></span></span></a>`;
};
const render = records => `<div class="seo-related-grid">${records.map(renderCard).join("")}</div>`;
module.exports = { render, renderCard, safeCover };
