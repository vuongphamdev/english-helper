/* Selection Translate — service worker.
   Owns the network calls so content scripts never touch a remote origin
   directly, and wires up the context menu + keyboard shortcut. */

const DEFAULTS = {
  targetLang: "vi",
  secondLang: "en",
  autoTranslate: false,
  provider: "google",
  checkLang: "auto",
  ltServer: "",
  sheetUrl: "",
  sheetKey: "",
  lastSaveType: ""
};

const SAVE_TYPES = [
  { id: "vocab", label: "Word" },
  { id: "collocation", label: "Collocation" },
  { id: "slang", label: "Slang" },
  { id: "sentence", label: "Sentence" }
];

const MAX_CHARS = 5000;
const CHUNK_SIZE = 1200;

/* ---------------------------------------------------------------- setup */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "qt-translate",
      title: 'Translate "%s"',
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "qt-check",
      title: 'Check grammar of "%s"',
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "qt-save",
      title: 'Save "%s" to my sheet',
      contexts: ["selection"]
    });
    for (const t of SAVE_TYPES) {
      chrome.contextMenus.create({
        id: "qt-save-" + t.id,
        parentId: "qt-save",
        title: "as " + t.label.toLowerCase(),
        contexts: ["selection"]
      });
    }
  });
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    chrome.storage.sync.set({ ...DEFAULTS, ...stored });
  });
});

// Open side panel when the toolbar icon is clicked (no default_popup).
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  const id = String(info.menuItemId || "");
  const text = info.selectionText || "";

  if (id.startsWith("qt-save-")) {
    send(tab.id, { type: "qt:run-text", mode: "save", saveType: id.slice(8), text }, info.frameId);
    return;
  }
  if (id !== "qt-translate" && id !== "qt-check") return;
  send(tab.id, { type: "qt:run-text", mode: id === "qt-check" ? "check" : "translate", text }, info.frameId);
});

const COMMAND_MODES = {
  "translate-selection": "translate",
  "check-selection": "check",
  "save-selection": "save"
};

chrome.commands.onCommand.addListener((command) => {
  const mode = COMMAND_MODES[command];
  if (!mode) return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) send(tab.id, { type: "qt:run-selection", mode });
  });
});

function send(tabId, message, frameId) {
  const options = typeof frameId === "number" ? { frameId } : undefined;
  chrome.tabs.sendMessage(tabId, message, options, () => {
    // Content scripts can't run on chrome:// pages or the Web Store.
    void chrome.runtime.lastError;
  });
}

/* ------------------------------------------------------------ messaging */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "qt:translate") {
    translate(msg.text, msg.target, msg.provider)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || "Translation failed" }));
    return true; // keep the channel open for the async reply
  }

  if (msg?.type === "qt:save") {
    saveToSheet(msg.item)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || "Couldn't save" }));
    return true;
  }

  if (msg?.type === "qt:sheet-test") {
    testSheet(msg.url)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || "Couldn't reach the sheet" }));
    return true;
  }

  if (msg?.type === "qt:check") {
    checkGrammar(msg.text, msg.language, msg.server)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || "Grammar check failed" }));
    return true;
  }
});

/* ----------------------------------------------------------- translation */

async function translate(rawText, target, provider) {
  const text = String(rawText || "").trim().slice(0, MAX_CHARS);
  if (!text) throw new Error("Nothing to translate");
  if (!target) throw new Error("No target language set");

  if (provider === "mymemory") return myMemory(text, target);

  try {
    return await google(text, target);
  } catch (err) {
    // Fall back rather than dead-ending the user on a transient failure.
    const backup = await myMemory(text, target);
    return { ...backup, note: "Google was unreachable — used MyMemory instead." };
  }
}

async function google(text, target) {
  const chunks = chunk(text, CHUNK_SIZE);
  const out = [];
  let source = "";
  let dict = null;

  for (const part of chunks) {
    const url =
      "https://translate.googleapis.com/translate_a/single" +
      "?client=gtx&dj=1&sl=auto&dt=t&dt=bd" +
      "&tl=" + encodeURIComponent(target) +
      "&q=" + encodeURIComponent(part);

    const res = await fetch(url);
    if (!res.ok) throw new Error("Translation service returned " + res.status);
    const data = await res.json();

    out.push((data.sentences || []).map((s) => s.trans || "").join(""));
    source = source || data.src || "";
    if (!dict && Array.isArray(data.dict)) {
      dict = data.dict.slice(0, 4).map((d) => ({
        pos: d.pos || "",
        terms: (d.terms || []).slice(0, 5)
      }));
    }
  }

  return { text: out.join(" ").trim(), source, dict, provider: "google" };
}

async function myMemory(text, target) {
  const source = guessSource(text, target);
  const url =
    "https://api.mymemory.translated.net/get" +
    "?q=" + encodeURIComponent(text.slice(0, 500)) +
    "&langpair=" + encodeURIComponent(base(source) + "|" + base(target));

  const res = await fetch(url);
  if (!res.ok) throw new Error("MyMemory returned " + res.status);
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated) throw new Error(data?.responseDetails || "MyMemory returned no translation");

  return { text: translated, source, dict: null, provider: "mymemory" };
}

/* ---------------------------------------------------------------- utils */

// MyMemory has no auto-detect, so make a cheap script-based guess.
function guessSource(text, target) {
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh-CN";
  if (/[\u0e00-\u0e7f]/.test(text)) return "th";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  if (/[ăâđêôơưĂÂĐÊÔƠƯ]|[\u0300-\u0303\u0309\u0323]/.test(text.normalize("NFD"))) return "vi";
  return base(target) === "en" ? "vi" : "en";
}

function base(code) {
  return String(code || "en").split("-")[0];
}

// Split on sentence ends so each request stays under the URL length limit.
function chunk(text, size) {
  if (text.length <= size) return [text];
  const pieces = [];
  let buffer = "";
  for (const sentence of text.split(/(?<=[.!?。！？\n])\s+/)) {
    if ((buffer + sentence).length > size && buffer) {
      pieces.push(buffer.trim());
      buffer = "";
    }
    if (sentence.length > size) {
      for (let i = 0; i < sentence.length; i += size) pieces.push(sentence.slice(i, i + size));
    } else {
      buffer += sentence + " ";
    }
  }
  if (buffer.trim()) pieces.push(buffer.trim());
  return pieces;
}

/* ------------------------------------------------------------ word bank */

/**
 * Auto-detect part of speech using the free dictionary API.
 * Only works for single English words; returns "" for phrases.
 */
async function detectPOS(term) {
  const words = term.trim().split(/\s+/);
  if (words.length > 1) return ""; // phrases don't have a single POS
  try {
    const url = "https://api.dictionaryapi.dev/api/v2/entries/en/" +
                encodeURIComponent(term.toLowerCase());
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const parts = new Set();
    for (const entry of data) {
      for (const m of (entry.meanings || [])) {
        if (m.partOfSpeech) parts.add(m.partOfSpeech);
      }
    }
    return [...parts].join(", ");
  } catch { return ""; }
}

/**
 * Translate text to Vietnamese using the existing google() helper.
 */
async function translateToVi(text) {
  try {
    const result = await google(text, "vi");
    return result.text || "";
  } catch { return ""; }
}

/**
 * Posts one entry to the Apps Script web app bound to the user's sheet.
 *
 * Content-Type is text/plain deliberately: application/json makes the browser
 * send a CORS preflight, and Apps Script never answers OPTIONS. The body is
 * still JSON — the script parses e.postData.contents itself.
 */
async function saveToSheet(item) {
  const { sheetUrl, sheetKey } = await chrome.storage.sync.get({ sheetUrl: "", sheetKey: "" });
  if (!sheetUrl) {
    throw new Error("No sheet connected yet. Open the extension popup and paste your web app URL.");
  }

  const term = String(item?.term || "").trim();
  if (!term) throw new Error("Nothing to save");

  // Detect POS and translate to Vietnamese in parallel
  const [pos, vietnamese] = await Promise.all([
    detectPOS(term),
    translateToVi(term)
  ]);

  let res;
  try {
    res = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        key: sheetKey,
        type: item.type || "",
        term,
        pos,
        vietnamese,
        example: item.example || "",
        note: item.note || "",
        tags: item.tags || ""
      })
    });
  } catch {
    throw new Error("Can't reach your sheet. Check the web app URL in the popup.");
  }

  if (!res.ok) throw new Error("The sheet returned " + res.status);

  let data;
  try {
    data = await res.json();
  } catch {
    // Apps Script serves an HTML login page when the deployment isn't public.
    throw new Error("The sheet answered with a login page — redeploy it with access set to Anyone.");
  }
  if (!data.ok) throw new Error(data.error || "The sheet refused the entry");
  // Include pos and vietnamese in the response so the UI can display them
  return { ...data, pos: data.pos || pos, vietnamese: data.vietnamese || vietnamese };
}

async function testSheet(url) {
  const target = String(url || "").trim();
  if (!target) throw new Error("Paste the web app URL first");
  if (!/^https:\/\/script\.google\.com\//.test(target)) {
    throw new Error("That doesn't look like an Apps Script URL");
  }

  const res = await fetch(target, { method: "GET" });
  if (!res.ok) throw new Error("The sheet returned " + res.status);

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Got a login page instead of data — redeploy with access set to Anyone.");
  }
  if (!data.ok) throw new Error(data.error || "The script reported a problem");
  return { count: data.count || 0 };
}

/* ------------------------------------------------------ grammar checking */

const LT_MAX_CHARS = 8000; // public tier caps a request at 20KB; stay well under

async function checkGrammar(rawText, language, server) {
  const text = String(rawText || "").trim().slice(0, LT_MAX_CHARS);
  if (!text) throw new Error("Nothing to check");

  const base = (server || "https://api.languagetool.org").replace(/\/+$/, "");
  const endpoint = base + "/v2/check";

  let data;
  try {
    data = await postCheck(endpoint, text, language || "auto");
  } catch (err) {
    // Auto-detection needs a reasonable amount of text; short fragments fail.
    if ((language || "auto") === "auto" && /detect/i.test(err.message)) {
      data = await postCheck(endpoint, text, "en-US");
    } else {
      throw err;
    }
  }

  const detected = data.language?.detectedLanguage?.name || data.language?.name || "";

  const matches = (data.matches || []).map((m, i) => ({
    id: i,
    offset: m.offset,
    length: m.length,
    message: m.shortMessage || m.message || "Possible issue",
    detail: m.message || "",
    issueType: m.rule?.issueType || "",
    category: m.rule?.category?.name || "",
    replacements: (m.replacements || []).slice(0, 5).map((r) => r.value).filter(Boolean)
  }));

  return { text, language: detected, matches, truncated: rawText.trim().length > LT_MAX_CHARS };
}

async function postCheck(endpoint, text, language) {
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text, language, level: "default" })
    });
  } catch {
    throw new Error(
      endpoint.includes("localhost") || endpoint.includes("127.0.0.1")
        ? "Can't reach your local LanguageTool server. Is it running?"
        : "Can't reach LanguageTool."
    );
  }

  if (res.status === 429) {
    throw new Error("LanguageTool is rate-limiting this IP. Wait a minute, or run your own server.");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail.slice(0, 160) || "LanguageTool returned " + res.status);
  }
  return res.json();
}
