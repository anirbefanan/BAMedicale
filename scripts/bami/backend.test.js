"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

function service() {
  const props = new Map(), cache = new Map(), sheets = new Map();
  let sequence = 0, active = "owner@example.com";
  class Sheet {
    constructor(name) { this.name = name; this.rows = []; }
    getLastRow() { return this.rows.length; }
    getLastColumn() { return Math.max(0, ...this.rows.map(row => row.length)); }
    getRange(row, col, count, width) { return {
      getValues: () => Array.from({ length: count }, (_, i) => Array.from({ length: width }, (_, j) => this.rows[row - 1 + i]?.[col - 1 + j] ?? "")),
      setValues: values => { values.forEach((line, i) => { const target = this.rows[row - 1 + i] || []; line.forEach((value, j) => { target[col - 1 + j] = value; }); this.rows[row - 1 + i] = target; }); }
    }; }
    appendRow(values) { this.rows.push(values); }
    setFrozenRows() {}
  }
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => props.get(key) || "", setProperty: (key, value) => props.set(key, value), setProperties: values => Object.entries(values).forEach(([key, value]) => props.set(key, value)) }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets.get(name) || null, insertSheet: name => { const sheet = new Sheet(name); sheets.set(name, sheet); return sheet; } }) },
    Session: { getActiveUser: () => ({ getEmail: () => active }), getEffectiveUser: () => ({ getEmail: () => "owner@example.com" }) },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key) || null, put: (key, value) => cache.set(key, value) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: {
      getUuid: () => (++sequence).toString(16).padStart(8, "0") + "-0000-0000-0000-000000000000",
      base64EncodeWebSafe: value => Buffer.from(value).toString("base64url"),
      base64DecodeWebSafe: value => Buffer.from(value, "base64url"),
      computeHmacSha256Signature: (value, key) => [...crypto.createHmac("sha256", key).update(value).digest()],
      newBlob: value => ({ getDataAsString: () => Buffer.from(value).toString("utf8") })
    },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify({ schemaVersion: 1, items: [] }) }) },
    HtmlService: { XFrameOptionsMode: { ALLOWALL: "ALLOWALL" }, createTemplateFromFile: () => ({ evaluate() { return { addMetaTag() { return this; }, setTitle() { return this; }, setXFrameOptionsMode(value) { assert.equal(value, "ALLOWALL"); return this; } }; } }) },
    console, Buffer, Date
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "Code.gs"), "utf8"), context);
  return { context, props, cache, sheets, setActive: value => { active = value; } };
}

test("BAMI sheet setup is owner-only, additive, and idempotent", () => {
  const s = service(); s.setActive("");
  assert.throws(() => s.context.setupBami("A".repeat(40)), /owner/);
  s.setActive("owner@example.com");
  s.context.setupBami("A".repeat(40));
  assert.equal(s.sheets.size, 2);
  assert.equal(s.sheets.get("AI_Visitors").rows.length, 1);
  s.context.setupBami("A".repeat(40));
  assert.equal(s.sheets.size, 2);
  assert.equal(s.sheets.get("AI_Inquiries").rows.length, 1);
  assert.ok(s.props.get("BAMI_SIGNING_KEY").length >= 32);
});

test("public BAMI view supports the first-party embedded launcher", () => {
  const s = service();
  assert.ok(s.context.doGet({ parameter: { bridge: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } }));
});

test("onboarding, resume, new chat, isolation, feedback, and unavailable AI remain safe", () => {
  const s = service(); s.context.setupBami("A".repeat(40));
  const profile = { email: "a@example.com", phone: "081234567890", audience: "Public", profession: "Student", consent: true, consentVersion: "bami-v1-2026-10" };
  assert.ok(s.context.bamiApi("onboard", profile).error);
  assert.equal(s.sheets.get("AI_Visitors").rows.length, 1);
  s.props.set("BAMI_GEMINI_API_KEY", "mock-key");
  const first = s.context.bamiApi("onboard", profile);
  assert.ok(first.token); assert.equal(s.sheets.get("AI_Visitors").rows.length, 2);
  assert.equal(s.context.bamiApi("resume", { token: first.token }).sessionId, first.sessionId);
  const second = s.context.bamiApi("newChat", { token: first.token });
  assert.notEqual(second.sessionId, first.sessionId);
  assert.equal(s.context.bamiApi("resume", { token: first.token }).sessionId, second.sessionId);
  const answer = s.context.bamiApi("ask", { token: first.token, sessionId: second.sessionId, question: "unrelatedmadeupterm" });
  assert.equal(answer.status, "CONTENT_GAP");
  assert.equal(s.context.bamiApi("feedback", { token: first.token, inquiryId: answer.id, value: "HELPFUL" }).saved, true);
  assert.equal(s.context.bamiApi("feedback", { token: first.token, inquiryId: answer.id, value: "NOT_HELPFUL" }).saved, false);
  assert.equal(s.context.bamiApi("ask", { token: first.token, sessionId: first.sessionId, question: "unrelatedmadeupterm" }).error, "Please enter a shorter question in the current chat.");
  const other = s.context.bamiApi("onboard", { ...profile, email: "b@example.com" });
  assert.equal(s.context.bamiApi("feedback", { token: other.token, inquiryId: answer.id, value: "HELPFUL" }).saved, false);
  assert.equal(s.context.bamiApi("resume", { token: "forged" }).error, "Please start BAMI again.");
  assert.ok(!JSON.stringify(s.context.bamiApi("resume", { token: first.token })).includes("a@example.com"));
});
