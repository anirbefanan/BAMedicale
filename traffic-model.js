(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BATraffic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  const iso = d => d.toISOString().slice(0, 10);
  const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && iso(new Date(s)) === s;
  const shift = (s, n) => iso(new Date(Date.parse(s) + n * DAY));
  function today(now = new Date(), timeZone = 'Asia/Jakarta') {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    return ['year', 'month', 'day'].map(k => p.find(x => x.type === k).value).join('-');
  }
  function range(key, now = new Date(), timeZone = 'Asia/Jakarta', custom) {
    const t = today(now, timeZone), yesterday = shift(t, -1);
    let start, end = yesterday, previousStart, previousEnd;
    if (key === 'custom') {
      if (!custom || !validDate(custom.startDate) || !validDate(custom.endDate) || custom.startDate > custom.endDate || custom.endDate > yesterday) throw new Error('Choose a valid range of completed days.');
      start = custom.startDate; end = custom.endDate;
      if ((Date.parse(end) - Date.parse(start)) / DAY >= 366) throw new Error('Choose at most 366 completed days.');
    } else if (key === 'mtd') {
      start = t.slice(0, 8) + '01';
      if (end < start) return null;
      previousEnd = shift(start, -1);
      previousStart = previousEnd.slice(0, 8) + '01';
      // Align elapsed days; cap both sides to the shorter month, never spill into a third month.
      const elapsed = Number(end.slice(-2)), count = Math.min(elapsed, Number(previousEnd.slice(-2)));
      end = shift(start, count - 1); previousEnd = shift(previousStart, count - 1);
    } else if (key === 'monthly') {
      end = shift(t.slice(0, 8) + '01', -1); start = end.slice(0, 8) + '01';
      previousEnd = shift(start, -1); previousStart = previousEnd.slice(0, 8) + '01';
    } else {
      const count = { daily: 1, '7d': 7, '28d': 28 }[key];
      if (!count) throw new Error('Unknown period.');
      start = shift(end, 1 - count);
    }
    if (!previousStart) {
      const count = Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1;
      previousEnd = shift(start, -1); previousStart = shift(previousEnd, 1 - count);
    }
    return { startDate: start, endDate: end, previousStartDate: previousStart, previousEndDate: previousEnd };
  }
  const ratio = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b : null;
  const change = (current, previous) => Number.isFinite(current) && Number.isFinite(previous) && previous > 0 ? (current - previous) / previous : null;
  function metrics(row) {
    if (!row) return null;
    return { ...row, averageEngagementTimeSeconds: ratio(row.userEngagementDuration, row.activeUsers), engagementRate: ratio(row.engagedSessions, row.sessions) };
  }
  function insights(p) {
    if (!p?.summary) return [];
    const out = [], delta = change(p.summary.activeUsers, p.previous?.activeUsers);
    if (delta !== null) out.push(`Active users ${delta >= 0 ? 'increased' : 'decreased'} ${Math.abs(delta * 100).toFixed(1)}% vs the previous comparable period.`);
    const mobile = p.devices?.rows?.find(x => x.label === 'mobile');
    const share = ratio(mobile?.sessions, p.devices?.rows?.reduce((sum,row)=>sum+row.sessions,0));
    if (share !== null) out.push(`Mobile accounted for ${(share * 100).toFixed(1)}% of sessions.`);
    const engagement = change(p.summary.averageEngagementTimeSeconds, p.previous?.averageEngagementTimeSeconds);
    if (engagement !== null) out.push(`Average engagement ${engagement >= 0 ? 'increased' : 'decreased'} ${Math.abs(engagement * 100).toFixed(1)}%.`);
    if (p.pages?.rows?.length) out.push(`${p.pages.rows[0].title} was the most-viewed public page.`);
    if (p.countries?.rows?.length) out.push(`${p.countries.rows[0].label} had the most active users among published country totals.`);
    return out.slice(0, 5);
  }
  return { today, range, shift, validDate, ratio, change, metrics, insights };
});
