"use strict";
/* Focused local UI QA with a fake Apps Script transport. No production rows or AI calls. */
const { chromium } = require("playwright");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
const frame = fs.readFileSync(path.join(__dirname, "frame.html"), "utf8");
const endpoint = "https://script.google.com/macros/s/bami-mock/exec";
const sessions = new Map();
let id = 0;
const mock = (action, input) => {
  if (action === "onboard") {
    const token = `test-token-${++id}`, sessionId = `session-${id}`;
    sessions.set(token, { sessionId, history: [] });
    return { token, sessionId, audience: input.audience, profession: input.profession, history: [] };
  }
  const current = sessions.get(input.token);
  if (!current) return { error: "Please start BAMI again." };
  if (action === "resume") return { sessionId: current.sessionId, history: current.history };
  if (action === "newChat") { current.sessionId = `session-${++id}`; current.history = []; return { sessionId: current.sessionId }; }
  if (action === "ask") {
    if (input.sessionId !== current.sessionId) return { error: "Please enter a shorter question in the current chat." };
    const greeting = input.question === "halo" || input.question === "hello", language = /halo|ada video/.test(input.question) ? "id" : "en";
    const answer = { id: `answer-${++id}`, answer: greeting ? language === "id" ? "Halo! Ada yang bisa BAMI bantu?" : "Hi! How can BAMI help?" : language === "id" ? "BAMI menemukan video tiroid yang relevan." : "Published BA Medicale thyroid learning is available.", status: greeting ? "CONVERSATIONAL" : "GROUNDED", language, sources: greeting ? [] : [{ type: "Article", title: "Thyroid knowledge", url: "https://bamedicale.com/library.html?disease=endocrine-metabolic" }] };
    current.history.push({ id: answer.id, question: input.question, answer: answer.answer, status: answer.status, language, sources: answer.sources });
    return answer;
  }
  if (action === "feedback") return { saved: true };
  return { error: "Unsupported action." };
};
(async () => {
  const server = http.createServer((req, res) => {
    const name = new URL(req.url, "http://localhost").pathname;
    if (name === "/data/bami-config.json") return res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ enabled: true, endpoint }));
    const file = path.resolve(root, `.${name === "/" ? "/index.html" : name}`);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" })[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const context = await browser.newContext();
    await context.exposeBinding("__bamiMock", (_source, action, input) => mock(action, input));
    await context.route("https://script.google.com/macros/s/bami-mock/exec**", route => {
      const bridge = new URL(route.request().url()).searchParams.get("bridge") || "";
      const stub = `window.google={script:{run:{withSuccessHandler(fn){this.ok=fn;return this},withFailureHandler(fn){this.fail=fn;return this},bamiApi(action,input){window.__bamiMock(action,input).then(this.ok,this.fail)}}}};`;
      const html = frame.replace("<?!= JSON.stringify(bridge) ?>", JSON.stringify(bridge)).replace('const parentOrigin="https://bamedicale.com"', `const parentOrigin=${JSON.stringify(origin)}`).replace("<script>\n(() =>", `<script>\n${stub}\n(() =>`);
      route.fulfill({ status: 200, contentType: "text/html", body: html });
    });
    for (const width of [360, 390, 430, 820, 1024, 1440]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 850 });
      await page.goto(origin + "/");
      const launcher = page.getByRole("button", { name: "Open BAMI" });
      await launcher.waitFor();
      const siteFont = await page.locator("body").evaluate(node => getComputedStyle(node).fontFamily);
      assert.equal(siteFont, '"Plus Jakarta Sans", Arial, sans-serif');
      const introFont = await page.locator(".bami-intro strong").evaluate(node => getComputedStyle(node).fontFamily);
      assert.equal(introFont, siteFont);
      assert.equal(await launcher.locator("img").getAttribute("src"), "/assets/bami/bami-mascot.webp");
      assert.equal(await launcher.locator("img").evaluate(img => img.complete && img.naturalWidth > 0), true);
      assert.equal(await launcher.textContent(), "");
      assert.equal(await page.getByRole("button", { name: "Ask BAMI", exact: true }).count(), 0);
      const idle = await launcher.locator(".bami-mascot").evaluate(node => getComputedStyle(node).animationName);
      assert.equal(idle, "bami-idle");
      assert.equal(await launcher.getAttribute("aria-expanded"), "false");
      if (width === 360) {
        await page.getByText("Hi, I’m BAMI").waitFor({ timeout: 4000 });
        assert.equal(await page.getByRole("button", { name: "Start a chat →" }).count(), 1);
        await page.getByRole("button", { name: "Start a chat →" }).click();
      } else await launcher.click();
      const chat = page.frameLocator(".bami-panel iframe");
      try { await chat.getByText("Your guide to BA Medicale knowledge.").waitFor({ timeout: 7000 }); }
      catch (error) { console.error("BAMI frame URLs:", page.frames().map(item => item.url())); console.error("Frame body:", await chat.locator("body").innerText().catch(() => "unavailable")); throw error; }
      const chatFonts = await chat.locator("body").evaluate(node => {
        const doc = node.ownerDocument;
        const font = selector => {
          const style = getComputedStyle(doc.querySelector(selector));
          return { family: style.fontFamily, weight: style.fontWeight };
        };
        return { body: font("body"), heading: font("h1"), label: font(".field span"), input: font(".field input"), button: font(".primary"), stylesheet: Boolean(doc.querySelector('link[href*="family=Plus+Jakarta+Sans"]')) };
      });
      assert.equal(chatFonts.stylesheet, true);
      for (const role of ["body", "heading", "label", "input", "button"]) assert.equal(chatFonts[role].family, siteFont, `${width}px ${role} font`);
      assert.equal(chatFonts.heading.weight, "700");
      assert.equal(chatFonts.label.weight, "700");
      assert.equal(chatFonts.button.weight, "700");
      const start = chat.getByRole("button", { name: "Start Chat" });
      assert.equal(await start.isDisabled(), true);
      await chat.getByRole("textbox", { name: "Email" }).fill("nana@example.com");
      await chat.getByRole("textbox", { name: "WhatsApp / mobile" }).fill("081234567890");
      await chat.getByLabel("I am a…").selectOption("Doctors");
      await chat.locator('select[name="profession"]').selectOption("General Practitioner");
      await chat.getByRole("checkbox").check();
      assert.equal(await start.isEnabled(), true);
      await start.click();
      await chat.getByRole("textbox", { name: "Ask BAMI a question" }).fill("halo");
      await chat.getByRole("button", { name: "Send" }).click();
      await chat.getByText("Halo! Ada yang bisa BAMI bantu?").waitFor();
      assert.equal(await chat.locator(".bubble").first().evaluate(node => getComputedStyle(node).fontFamily), siteFont);
      assert.equal(await chat.getByRole("textbox", { name: "Ajukan pertanyaan kepada BAMI" }).getAttribute("placeholder"), "Tanyakan materi BA Medicale");
      await chat.getByRole("textbox", { name: "Ajukan pertanyaan kepada BAMI" }).fill("ada video tentang thyroid?");
      await chat.getByRole("button", { name: "Kirim" }).click();
      await chat.getByText("BAMI menemukan video tiroid yang relevan.").waitFor();
      await chat.getByRole("button", { name: "Membantu", exact: true }).last().click();
      await chat.getByText("Terima kasih. Masukan kamu membantu BAMI menjadi lebih baik.").waitFor();
      assert.equal(await chat.getByText("BAMI menemukan video tiroid yang relevan.").count(), 1);
      await chat.getByRole("button", { name: "Percakapan Baru" }).click();
      await chat.getByRole("textbox", { name: "Ajukan pertanyaan kepada BAMI" }).fill("Thyroid materials?");
      await chat.getByRole("button", { name: "Kirim" }).click();
      await chat.getByText("Published BA Medicale thyroid learning is available.").first().waitFor();
      await chat.getByRole("button", { name: "Helpful", exact: true }).click();
      await chat.getByText("Thank you. Your feedback helps BAMI improve.").waitFor();
      await chat.getByRole("textbox", { name: "Ask BAMI a question" }).fill("More thyroid materials?");
      await chat.getByRole("button", { name: "Send" }).click();
      await chat.getByRole("button", { name: "Not Helpful", exact: true }).click();
      await chat.getByText("Thank you. Your feedback has been recorded and will help BAMI improve its answers.").waitFor();
      await chat.getByRole("button", { name: "Minimize BAMI" }).click();
      assert.equal(await launcher.getAttribute("aria-expanded"), "false");
      await page.goto(origin + "/library.html");
      const again = page.getByRole("button", { name: "Open BAMI" });
      await again.waitFor();
      assert.equal(await page.getByText("Hi, I’m BAMI").isVisible(), false);
      assert.equal(await again.getAttribute("aria-expanded"), "false");
      await again.click();
      await chat.getByText("Published BA Medicale thyroid learning is available.").first().waitFor();
      await chat.getByRole("button", { name: "New Chat" }).click();
      await chat.locator(".empty").waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${width}px horizontal overflow`);
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(await again.locator(".bami-mascot").evaluate(node => getComputedStyle(node).animationName), "none");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.evaluate(() => Object.defineProperty(document, "hidden", { configurable: true, value: true }));
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      assert.equal(await again.evaluate(node => node.classList.contains("bami-paused")), true);
      await page.evaluate(() => localStorage.clear());
      await page.close();
      console.log(`BAMI browser mock: ${width}px PASS`);
    }
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
