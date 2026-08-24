const form = document.querySelector("#draftForm");
const list = document.querySelector("#draftList");
const statusLine = document.querySelector("#formStatus");
const clearButton = document.querySelector("#clearForm");
const filters = document.querySelector("#filters");
const dialog = document.querySelector("#draftDialog");
const detail = document.querySelector("#draftDetail");

let drafts = [];
let activeFilter = "all";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function splitLines(value) {
  return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function formBoolean(data, name) {
  return data.get(name) === "on";
}

function bytes(size) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let value = size;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataBase64: reader.result
    });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function payloadFromForm() {
  const data = new FormData(form);
  const uploads = [...form.elements.files.files];
  const files = [];
  for (const file of uploads) {
    files.push(await readFileAsBase64(file));
  }
  return {
    contentType: data.get("contentType"),
    destination: data.get("destination"),
    audience: data.get("audience"),
    status: data.get("status"),
    topicHint: data.get("topicHint"),
    sourceLinks: splitLines(data.get("sourceLinks")),
    sourceNotes: data.get("sourceNotes"),
    localPaths: splitLines(data.get("localPaths")),
    autoTitle: formBoolean(data, "autoTitle"),
    autoSummary: formBoolean(data, "autoSummary"),
    autoPlacement: formBoolean(data, "autoPlacement"),
    autoVisualTreatment: formBoolean(data, "autoVisualTreatment"),
    createDetailPage: formBoolean(data, "createDetailPage"),
    files
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed: ${response.status}`);
  return body;
}

async function refreshDrafts() {
  const body = await api("/api/drafts");
  drafts = body.drafts || [];
  renderDrafts();
}

function renderDrafts() {
  const visible = activeFilter === "all" ? drafts : drafts.filter((draft) => draft.status === activeFilter);
  if (!visible.length) {
    list.innerHTML = `<article class="draft-item"><h3>No ${escapeHtml(activeFilter)} drafts yet.</h3><p>Create a draft on the left. You can save many drafts before asking Codex to publish.</p></article>`;
    return;
  }
  list.innerHTML = visible.map((draft) => `
    <article class="draft-item">
      <div class="chips">
        <span class="chip ${draft.status === "ready" ? "ready" : ""}">${escapeHtml(draft.status || "draft")}</span>
        <span class="chip">${escapeHtml(draft.contentType)}</span>
        <span class="chip">${escapeHtml(draft.destination)}</span>
        <span class="chip">${escapeHtml(draft.audience)}</span>
      </div>
      <h3>${escapeHtml(draft.topicHint || "Untitled draft")}</h3>
      <p>${escapeHtml(draft.sourceNotes || "No notes yet. Add source material or a short hint before processing.")}</p>
      <div class="draft-meta">
        <span class="chip">${(draft.files || []).length} files</span>
        <span class="chip">${(draft.sourceLinks || []).length} links</span>
        <span class="chip">Updated ${escapeHtml((draft.updatedAt || "").slice(0, 16).replace("T", " "))}</span>
      </div>
      <div class="draft-actions">
        <button type="button" data-action="view" data-id="${escapeHtml(draft.id)}">Open</button>
        <button type="button" data-action="ready" data-id="${escapeHtml(draft.id)}">Ready</button>
        <button type="button" data-action="archive" data-id="${escapeHtml(draft.id)}">Archive</button>
      </div>
    </article>
  `).join("");
}

function renderDetail(draft) {
  const files = (draft.files || []).map((file) => `
    <li>
      <strong>${escapeHtml(file.originalName)}</strong><br>
      ${escapeHtml(file.storedPath)}<br>
      ${escapeHtml(file.kind)} · ${bytes(file.size)}
    </li>
  `).join("") || "<li>No files attached yet.</li>";
  const issues = (draft.intakeIssues || []).map((issue) => `<li>${escapeHtml(issue)}</li>`).join("");

  detail.innerHTML = `
    <p class="eyebrow">Draft detail</p>
    <h2>${escapeHtml(draft.topicHint || "Untitled draft")}</h2>
    <div class="detail-grid">
      <label>Status
        <select id="detailStatus">
          ${["draft", "ready", "needs-info", "published", "archived"].map((item) => `<option value="${item}" ${draft.status === item ? "selected" : ""}>${item}</option>`).join("")}
        </select>
      </label>
      <label>Destination
        <select id="detailDestination">
          ${["auto", "library", "courses", "seminar", "videos", "ebooks", "resources"].map((item) => `<option value="${item}" ${draft.destination === item ? "selected" : ""}>${item}</option>`).join("")}
        </select>
      </label>
    </div>
    <label>Topic hint
      <input id="detailTopic" value="${escapeHtml(draft.topicHint || "")}">
    </label>
    <label>Notes for Codex
      <textarea id="detailNotes" rows="5">${escapeHtml(draft.sourceNotes || "")}</textarea>
    </label>
    <h3>Attached files</h3>
    <ul class="file-list">${files}</ul>
    ${issues ? `<h3>Import issues</h3><ul class="file-list">${issues}</ul>` : ""}
    <div class="draft-actions">
      <button type="button" class="primary" data-detail-action="save" data-id="${escapeHtml(draft.id)}">Save changes</button>
      <button type="button" data-detail-action="delete" data-id="${escapeHtml(draft.id)}">Delete draft</button>
    </div>
  `;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusLine.textContent = "Saving draft...";
  try {
    const payload = await payloadFromForm();
    const body = await api("/api/drafts", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    form.reset();
    statusLine.textContent = `Saved: ${body.draft.topicHint || body.draft.id}`;
    await refreshDrafts();
  } catch (error) {
    statusLine.textContent = error.message;
  }
});

clearButton.addEventListener("click", () => {
  form.reset();
  statusLine.textContent = "";
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  filters.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  renderDrafts();
});

list.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const draft = drafts.find((item) => item.id === button.dataset.id);
  if (!draft) return;

  if (button.dataset.action === "view") {
    renderDetail(draft);
    dialog.showModal();
    return;
  }
  if (button.dataset.action === "ready") {
    await api(`/api/drafts/${draft.id}`, { method: "PATCH", body: JSON.stringify({ status: "ready" }) });
    await refreshDrafts();
    return;
  }
  if (button.dataset.action === "archive") {
    await api(`/api/drafts/${draft.id}`, { method: "PATCH", body: JSON.stringify({ status: "archived" }) });
    await refreshDrafts();
  }
});

detail.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-detail-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.detailAction === "delete") {
    if (!confirm("Delete this local draft and its copied assets?")) return;
    await api(`/api/drafts/${id}`, { method: "DELETE" });
    dialog.close();
    await refreshDrafts();
    return;
  }
  await api(`/api/drafts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: document.querySelector("#detailStatus").value,
      destination: document.querySelector("#detailDestination").value,
      topicHint: document.querySelector("#detailTopic").value,
      sourceNotes: document.querySelector("#detailNotes").value
    })
  });
  dialog.close();
  await refreshDrafts();
});

refreshDrafts().catch((error) => {
  list.innerHTML = `<article class="draft-item"><h3>Admin API is not available.</h3><p>${escapeHtml(error.message)}</p></article>`;
});
