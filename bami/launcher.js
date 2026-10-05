/* Global BAMI shell. Only an explicitly configured, separate public service is launched. */
(() => {
  "use strict";
  const eligible = document.querySelector("[data-shell]") && !/\/(?:jumi|admin|attendance|login)(?:\/|\.|$)/i.test(location.pathname);
  if (!eligible) return;
  fetch("/data/bami-config.json", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(config => {
    if (!config?.enabled || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.endpoint || "")) return;
    const launcher = document.createElement("button"), panel = document.createElement("section"), frame = document.createElement("iframe");
    launcher.type = "button"; launcher.className = "bami-launcher"; launcher.textContent = "Ask BAMI";
    launcher.setAttribute("aria-label", "Ask BAMI"); launcher.setAttribute("aria-expanded", "false"); launcher.setAttribute("aria-controls", "bami-panel");
    panel.id = "bami-panel"; panel.className = "bami-panel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "BAMI — BA Medicale Intelligence");
    frame.title = "BAMI — BA Medicale Intelligence"; frame.referrerPolicy = "no-referrer"; frame.loading = "lazy"; panel.append(frame);
    document.body.append(launcher, panel);
    const key = "ba-medicale-bami-token-v1";
    let loaded = false;
    const bridge = crypto.randomUUID();
    const track = name => window.dispatchEvent(new CustomEvent("bami:analytics", { detail: name }));
    const collapse = () => { panel.hidden = true; launcher.setAttribute("aria-expanded", "false"); launcher.focus(); };
    launcher.addEventListener("click", () => {
      panel.hidden = false; launcher.setAttribute("aria-expanded", "true");
      if (!loaded) { frame.src = `${config.endpoint}?bridge=${encodeURIComponent(bridge)}`; loaded = true; }
      frame.focus(); track("bami_open");
    });
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
