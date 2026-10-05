/* Global BAMI shell. Only an explicitly configured, separate public service is launched. */
(() => {
  "use strict";
  const eligible = document.querySelector("[data-shell]") && !/\/(?:jumi|admin|attendance|login)(?:\/|\.|$)/i.test(location.pathname);
  if (!eligible) return;
  fetch("/data/bami-config.json", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(config => {
    if (!config?.enabled || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.endpoint || "")) return;
    const launcher = document.createElement("button"), panel = document.createElement("section"), frame = document.createElement("iframe");
    const intro = document.createElement("aside"), media = document.createElement("span"), mascot = document.createElement("img");
    launcher.type = "button"; launcher.className = "bami-launcher";
    launcher.setAttribute("aria-label", "Open BAMI"); launcher.setAttribute("aria-expanded", "false"); launcher.setAttribute("aria-controls", "bami-panel");
    media.className = "bami-mascot"; mascot.src = "/assets/bami/bami-mascot.webp"; mascot.width = 640; mascot.height = 640;
    mascot.alt = ""; mascot.decoding = "async"; media.append(mascot); launcher.append(media);
    const language = /^id(?:-|$)/i.test(navigator.language || "") ? "id" : "en";
    intro.className = "bami-intro"; intro.id = "bami-intro"; intro.hidden = true;
    intro.innerHTML = language === "id"
      ? '<strong>Hai, saya BAMI</strong><p>AI Assistant BA Medicale, siap membantu 24/7.</p><p>Tanyakan tentang konten medis, video, eBook, seminar, dan lainnya.</p><button type="button">Mulai chat →</button>'
      : '<strong>Hi, I’m BAMI</strong><p>BA Medicale AI Assistant, available 24/7.</p><p>Ask me about our medical content, videos, eBooks, seminars, and more.</p><button type="button">Start a chat →</button>';
    panel.id = "bami-panel"; panel.className = "bami-panel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "BAMI — BA Medicale Intelligence");
    frame.title = "BAMI — BA Medicale Intelligence"; frame.referrerPolicy = "no-referrer"; frame.loading = "lazy"; panel.append(frame);
    document.body.append(launcher, intro, panel);
    const key = "ba-medicale-bami-token-v1";
    let loaded = false;
    const bridge = crypto.randomUUID();
    const track = name => window.dispatchEvent(new CustomEvent("bami:analytics", { detail: name }));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let attentionTimer, introTimer, dismissalTimer;
    const stopAttention = () => { clearTimeout(attentionTimer); attentionTimer = undefined; };
    const attention = () => {
      stopAttention();
      if (document.hidden || reduced.matches || !panel.hidden) return;
      attentionTimer = setTimeout(() => {
        if (!document.hidden && panel.hidden && !reduced.matches) {
          launcher.classList.add("bami-attention");
          setTimeout(() => launcher.classList.remove("bami-attention"), 900);
        }
        attention();
      }, 28000 + Math.floor(Math.random() * 14000));
    };
    const hideIntro = () => { clearTimeout(introTimer); clearTimeout(dismissalTimer); intro.hidden = true; launcher.classList.remove("bami-intro-wake"); };
    const collapse = () => { panel.hidden = true; launcher.setAttribute("aria-expanded", "false"); launcher.classList.remove("bami-open"); launcher.focus(); attention(); };
    const open = () => {
      hideIntro(); stopAttention(); launcher.classList.remove("bami-attention");
      try { localStorage.setItem("bami_intro_seen", "1"); } catch (_) { /* Storage is optional. */ }
      launcher.classList.add("bami-open", "bami-opening");
      setTimeout(() => launcher.classList.remove("bami-opening"), 300);
      panel.hidden = false; launcher.setAttribute("aria-expanded", "true");
      if (!loaded) { frame.src = `${config.endpoint}?bridge=${encodeURIComponent(bridge)}`; loaded = true; }
      frame.focus(); track("bami_open");
    };
    launcher.addEventListener("click", open);
    intro.querySelector("button").addEventListener("click", open);
    try {
      if (!localStorage.getItem("bami_intro_seen")) {
        introTimer = setTimeout(() => {
          if (document.hidden || !panel.hidden) return;
          intro.hidden = false; launcher.classList.add("bami-intro-wake");
          localStorage.setItem("bami_intro_seen", "1");
          dismissalTimer = setTimeout(hideIntro, 6000);
        }, 2200);
      }
    } catch (_) { /* Storage can be disabled; the launcher remains usable. */ }
    attention();
    document.addEventListener("visibilitychange", () => {
      launcher.classList.toggle("bami-paused", document.hidden);
      if (document.hidden) { stopAttention(); clearTimeout(introTimer); hideIntro(); }
      else attention();
    });
    reduced.addEventListener("change", attention);
    window.addEventListener("message", event => {
      if (!/^https:\/\/(?:script\.google\.com|[a-z0-9.-]+\.googleusercontent\.com)$/.test(event.origin) || event.data?.bridge !== bridge) return;
      const message = event.data;
      if (!message || typeof message !== "object") return;
      if (message.bami === "ready") { event.source.postMessage({ bami: "restore", token: localStorage.getItem(key) || "" }, event.origin); }
      if (message.bami === "state") { if (typeof message.token === "string" && message.token.length < 300) { if (message.token) localStorage.setItem(key, message.token); else localStorage.removeItem(key); track(message.token ? "bami_onboarding_complete" : "bami_onboarding_start"); } }
      if (message.bami === "close") collapse();
      if (message.bami === "answer") { track("bami_answer"); if (message.status === "CONTENT_GAP") track("bami_content_gap"); }
      if (message.bami === "feedback") track("bami_feedback");
      if (message.bami === "content-click") track("bami_content_click");
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !panel.hidden) collapse(); });
  }).catch(() => {});
})();
