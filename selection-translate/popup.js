const DEFAULTS = {
  targetLang: "vi",
  secondLang: "en",
  autoTranslate: false,
  provider: "google",
  checkLang: "auto",
  ltServer: "",
  sheetUrl: "",
  sheetKey: "",
  lastSaveType: "vocab"
};

const $ = (id) => document.getElementById(id);
const targetSelect = $("target");
const providerSelect = $("provider");
const autoToggle = $("auto");
const input = $("input");
const output = $("out");
const goButton = $("go");
const checkButton = $("checkBtn");
const checkLangSelect = $("checkLang");
const serverInput = $("ltServer");
const saveButton = $("saveBtn");
const saveTypeSelect = $("saveType");
const sheetUrlInput = $("sheetUrl");
const sheetKeyInput = $("sheetKey");
const testButton = $("testBtn");
const sheetStatusDot = $("sheetStatus");

function updateSheetStatus(state) {
  const colors = { ok: "#1E8E5A", err: "#C23A32", off: "var(--faint)" };
  sheetStatusDot.style.background = colors[state] || colors.off;
}

fill(targetSelect, QT_LANGUAGES);
fill(checkLangSelect, QT_CHECK_LANGUAGES);

function fill(select, list) {
  for (const item of list) {
    const option = document.createElement("option");
    option.value = item.code;
    option.textContent = item.name;
    select.appendChild(option);
  }
}

chrome.storage.sync.get(DEFAULTS, (stored) => {
  const settings = { ...DEFAULTS, ...stored };
  targetSelect.value = settings.targetLang;
  providerSelect.value = settings.provider;
  autoToggle.checked = Boolean(settings.autoTranslate);
  checkLangSelect.value = settings.checkLang;
  serverInput.value = settings.ltServer || "";
  sheetUrlInput.value = settings.sheetUrl || "";
  sheetKeyInput.value = settings.sheetKey || "";
  saveTypeSelect.value = settings.lastSaveType || "vocab";

  // Auto-test sheet connection on load
  const savedUrl = (settings.sheetUrl || "").trim();
  if (savedUrl) {
    chrome.runtime.sendMessage({ type: "qt:sheet-test", url: savedUrl }).then((res) => {
      updateSheetStatus(res?.ok ? "ok" : "err");
    }).catch(() => {
      updateSheetStatus("err");
    });
  } else {
    updateSheetStatus("off");
  }
});

checkLangSelect.addEventListener("change", () => {
  chrome.storage.sync.set({ checkLang: checkLangSelect.value });
});

serverInput.addEventListener("change", () => {
  chrome.storage.sync.set({ ltServer: serverInput.value.trim().replace(/\/+$/, "") });
});

checkButton.addEventListener("click", checkGrammar);
saveButton.addEventListener("click", saveEntry);
testButton.addEventListener("click", testSheet);

sheetUrlInput.addEventListener("change", () => {
  chrome.storage.sync.set({ sheetUrl: sheetUrlInput.value.trim() });
});

sheetKeyInput.addEventListener("change", () => {
  chrome.storage.sync.set({ sheetKey: sheetKeyInput.value.trim() });
});

saveTypeSelect.addEventListener("change", () => {
  chrome.storage.sync.set({ lastSaveType: saveTypeSelect.value });
});

targetSelect.addEventListener("change", () => {
  chrome.storage.sync.set({ targetLang: targetSelect.value });
  if (input.value.trim()) translate();
});

providerSelect.addEventListener("change", () => {
  chrome.storage.sync.set({ provider: providerSelect.value });
});

autoToggle.addEventListener("change", () => {
  chrome.storage.sync.set({ autoTranslate: autoToggle.checked });
});

goButton.addEventListener("click", translate);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) translate();
});

async function checkGrammar() {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  checkButton.disabled = true;
  output.textContent = "Checking…";

  try {
    const res = await chrome.runtime.sendMessage({
      type: "qt:check",
      text,
      language: checkLangSelect.value,
      server: serverInput.value.trim()
    });

    output.textContent = "";
    if (!res?.ok) return fail(res?.error || "Grammar check failed.");

    if (!res.matches.length) {
      const clean = document.createElement("span");
      clean.textContent = "No issues found.";
      output.appendChild(clean);
      return;
    }

    for (const match of res.matches) {
      const line = document.createElement("span");
      line.className = "issue-line";

      const was = document.createElement("span");
      was.className = "was";
      was.textContent = res.text.substr(match.offset, match.length);
      line.appendChild(was);

      if (match.replacements[0]) {
        line.appendChild(document.createTextNode(" → "));
        const now = document.createElement("span");
        now.className = "now";
        now.textContent = match.replacements[0];
        line.appendChild(now);
      }

      const why = document.createElement("span");
      why.className = "why";
      why.textContent = match.detail || match.message;
      line.appendChild(why);

      output.appendChild(line);
    }
  } catch {
    output.textContent = "";
    fail("Couldn't reach the grammar service.");
  } finally {
    checkButton.disabled = false;
  }
}

async function saveEntry() {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  // Persist the URL even if the field was never blurred.
  await chrome.storage.sync.set({
    sheetUrl: sheetUrlInput.value.trim(),
    sheetKey: sheetKeyInput.value.trim(),
    lastSaveType: saveTypeSelect.value
  });

  saveButton.disabled = true;
  output.textContent = "Saving…";

  try {
    const res = await chrome.runtime.sendMessage({
      type: "qt:save",
      item: { type: saveTypeSelect.value, term: text }
    });

    output.textContent = "";
    if (!res?.ok) {
      updateSheetStatus("err");
      return fail(res?.error || "Couldn't save that.");
    }

    updateSheetStatus("ok");
    const hit = document.createElement("span");
    hit.className = "hit";
    const bits = [res.action === "updated" ? "Updated on the sheet" : "Saved to the sheet"];
    if (res.pos) bits.push(res.pos);
    if (res.vietnamese) bits.push(res.vietnamese);
    if (res.ipa) bits.push(res.ipa);
    if (res.meaning) bits.push(String(res.meaning).split("\n")[0]);
    hit.textContent = bits.join(" · ");
    output.appendChild(hit);
  } catch {
    output.textContent = "";
    updateSheetStatus("err");
    fail("Couldn't reach the sheet.");
  } finally {
    saveButton.disabled = false;
  }
}

async function testSheet() {
  const url = sheetUrlInput.value.trim();
  await chrome.storage.sync.set({ sheetUrl: url, sheetKey: sheetKeyInput.value.trim() });

  testButton.disabled = true;
  output.textContent = "Checking…";

  try {
    const res = await chrome.runtime.sendMessage({ type: "qt:sheet-test", url });
    output.textContent = "";
    if (!res?.ok) {
      updateSheetStatus("err");
      return fail(res?.error || "Couldn't reach the sheet.");
    }

    updateSheetStatus("ok");
    const hit = document.createElement("span");
    hit.className = "hit";
    hit.textContent = res.count === 1
      ? "Connected — 1 entry on the sheet."
      : `Connected — ${res.count} entries on the sheet.`;
    output.appendChild(hit);
  } catch {
    output.textContent = "";
    updateSheetStatus("err");
    fail("Couldn't reach the sheet.");
  } finally {
    testButton.disabled = false;
  }
}

function fail(message) {
  const bad = document.createElement("span");
  bad.className = "bad";
  bad.textContent = message;
  output.appendChild(bad);
}

async function translate() {
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  goButton.disabled = true;
  output.textContent = "Translating…";

  try {
    const res = await chrome.runtime.sendMessage({
      type: "qt:translate",
      text,
      target: targetSelect.value,
      provider: providerSelect.value
    });

    output.textContent = "";
    if (!res?.ok) {
      const bad = document.createElement("span");
      bad.className = "bad";
      bad.textContent = res?.error || "Translation failed.";
      output.appendChild(bad);
      return;
    }

    const hit = document.createElement("span");
    hit.className = "hit";
    hit.textContent = res.text;
    output.appendChild(hit);
  } catch {
    output.textContent = "";
    const bad = document.createElement("span");
    bad.className = "bad";
    bad.textContent = "Couldn't reach the translation service.";
    output.appendChild(bad);
  } finally {
    goButton.disabled = false;
  }
}

// Show the shortcut the user actually has bound, not the suggested one.
chrome.commands?.getAll?.((commands) => {
  const list = commands || [];
  const translate = list.find((c) => c.name === "translate-selection")?.shortcut;
  const save = list.find((c) => c.name === "save-selection")?.shortcut;
  const parts = [];
  if (translate) parts.push(`${translate} translate`);
  if (save) parts.push(`${save} save`);
  $("kbd").textContent = parts.length ? parts.join(" · ") : "No shortcut assigned";
});

$("shortcuts").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
