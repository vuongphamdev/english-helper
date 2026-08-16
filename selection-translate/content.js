/* Selection Translate — in-page UI.
   Everything lives in a shadow root so host page CSS can't reach it. */

(() => {
  if (window.__qtLoaded) return;
  window.__qtLoaded = true;

  const DEFAULTS = {
    targetLang: "vi",
    autoTranslate: false,
    provider: "google",
    checkLang: "auto",
    ltServer: "",
    sheetUrl: "",
    sheetKey: "",
    lastSaveType: "vocab"
  };

  const SAVE_TYPES = [
    { id: "vocab", label: "Word" },
    { id: "collocation", label: "Collocation" },
    { id: "slang", label: "Slang" },
    { id: "sentence", label: "Sentence" }
  ];

  let settings = { ...DEFAULTS };
  let mode = "translate";
  let requestId = 0;

  // What the user selected, and where it came from.
  let source = { text: "", rect: null, field: null, context: "" };

  // The type chosen for the entry being saved right now.
  let saveType = "vocab";

  // Live grammar state — text mutates as fixes are applied.
  let check = { text: "", matches: [], language: "", dirty: false };
  let translation = { text: "", lang: "", forText: "" };

  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const [key, { newValue }] of Object.entries(changes)) settings[key] = newValue;
  });

  /* -------------------------------------------------------------- markup */

  const host = document.createElement("div");
  // Set as !important individually: a bare cssText loses to page rules like
  // `div { display: none !important }`, which some sites really do ship.
  for (const [prop, value] of Object.entries({
    all: "initial",
    position: "fixed",
    top: "0",
    left: "0",
    width: "0",
    height: "0",
    margin: "0",
    padding: "0",
    border: "0",
    opacity: "1",
    visibility: "visible",
    "pointer-events": "none",
    "z-index": "2147483647"
  })) {
    host.style.setProperty(prop, value, "important");
  }
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>
      :host, * { box-sizing: border-box; }
      .bubble, .panel {
        position: fixed;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #17181C;
        display: none;
      }
      .bubble {
        width: 30px; height: 30px;
        align-items: center; justify-content: center;
        background: linear-gradient(180deg, #2B2D34, #17181C);
        border-radius: 9px;
        cursor: pointer;
        box-shadow:
          0 4px 12px rgba(0,0,0,.28),
          0 0 0 1px rgba(0,0,0,.35),
          inset 0 1px 0 rgba(255,255,255,.11);
        transition: transform .16s cubic-bezier(.34,1.56,.64,1), box-shadow .16s ease;
      }
      .bubble:hover {
        transform: translateY(-1px) scale(1.06);
        box-shadow:
          0 7px 18px rgba(0,0,0,.32),
          0 0 0 1px rgba(0,0,0,.35),
          inset 0 1px 0 rgba(255,255,255,.16);
      }
      .bubble:active { transform: scale(.93); }
      .bubble:focus-visible { outline: 2px solid #FFD24A; outline-offset: 2px; }
      .bubble svg { width: 16px; height: 16px; display: block; }
      .bubble.on { display: flex; animation: pop .19s cubic-bezier(.34,1.56,.64,1); }
      @keyframes pop { from { opacity: 0; transform: scale(.55) translateY(-3px); } }

      .panel {
        width: 360px;
        max-width: calc(100vw - 24px);
        background: #fff;
        border: 1px solid rgba(0,0,0,.10);
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.08);
        overflow: hidden;
        animation: rise .13s ease-out;
      }
      .panel.on { display: block; }
      @keyframes rise { from { opacity: 0; transform: translateY(4px); } }
      @media (prefers-reduced-motion: reduce) {
        .panel, .bubble.on { animation: none; }
        .bubble, .icon, .tab, .fix { transition: none; }
        .bubble:hover, .fix:hover, .icon:active, .fix:active,
        .bubble:active, .tab:active { transform: none; }
      }

      /* --- save form --- */
      .save { padding: 2px 0 0; }
      .types { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 11px; }
      .chip {
        font: 600 11px/1 inherit;
        color: #6B6F76; background: #F4F5F7;
        border: 1px solid rgba(0,0,0,.07); border-radius: 999px;
        padding: 6px 11px; cursor: pointer;
      }
      .chip:hover { color: #17181C; }
      .chip.on { background: #17181C; border-color: #17181C; color: #FFD24A; }
      .chip:focus-visible { outline: 2px solid #17181C; outline-offset: 2px; }

      .f { display: block; margin-bottom: 8px; }
      .f > span {
        display: block;
        font: 600 9.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: .09em; text-transform: uppercase; color: #9A9EA6;
        margin-bottom: 4px;
      }
      .f input, .f textarea {
        width: 100%; font: inherit; font-size: 12.5px; color: #17181C;
        background: #FAFAFA; border: 1px solid rgba(0,0,0,.09);
        border-radius: 7px; padding: 7px 8px;
      }
      .f textarea { resize: vertical; min-height: 44px; line-height: 1.45; }
      .f input:focus, .f textarea:focus {
        outline: 2px solid #17181C; outline-offset: 1px; border-color: transparent;
      }
      .save-go {
        width: 100%; font: 600 12.5px/1 inherit; color: #17181C; background: #FFD24A;
        border: 0; border-radius: 9px; padding: 11px 15px; cursor: pointer; margin-top: 2px;
      }
      .save-go:hover { filter: brightness(.96); }
      .save-go:disabled { opacity: .45; cursor: default; filter: none; }
      .save-go:focus-visible { outline: 2px solid #17181C; outline-offset: 2px; }
      .s-status { margin: 8px 0 0; font-size: 11.5px; line-height: 1.5; color: #6B6F76; }
      .s-status.bad { color: #C23A32; }
      .s-status b { color: #17181C; font-weight: 600; }

      header {
        display: flex; align-items: center; gap: 8px;
        padding: 8px;
        border-bottom: 1px solid rgba(0,0,0,.07);
      }
      .tabs {
        display: flex; gap: 2px;
        padding: 2px;
        background: rgba(0,0,0,.055);
        border-radius: 7px;
      }
      .tab {
        all: unset;
        font: 600 11px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 6px 11px;
        border-radius: 5px;
        cursor: pointer;
        color: #6B6F76;
        transition: color .16s ease, background .16s ease, box-shadow .16s ease;
      }
      .tab:hover { color: #17181C; }
      .tab:active { transform: scale(.97); }
      .tab[aria-selected="true"] {
        background: #fff;
        color: #17181C;
        box-shadow: 0 1px 3px rgba(0,0,0,.16), 0 0 0 .5px rgba(0,0,0,.05);
      }
      .tab:focus-visible { outline: 2px solid #17181C; outline-offset: 1px; }
      .spacer { flex: 1; }
      .icon {
        all: unset;
        width: 26px; height: 26px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 6px;
        cursor: pointer;
        color: #6B6F76;
        transition: background .14s ease, color .14s ease, transform .12s ease;
      }
      .icon:hover { background: rgba(0,0,0,.07); color: #17181C; }
      .icon:active { transform: scale(.88); }
      .icon:focus-visible { outline: 2px solid #17181C; outline-offset: 1px; }
      .icon svg { width: 15px; height: 15px; display: block; }
      .icon.done { color: #1A8A45; background: rgba(26,138,69,.12); }

      .body { padding: 12px; max-height: 340px; overflow-y: auto; }

      /* The signature: results read as if swiped with a marker. */
      .result {
        font-size: 16px; line-height: 1.5;
        margin: 0;
        background-image: linear-gradient(#FFD24A, #FFD24A);
        background-repeat: no-repeat;
        background-size: 100% 44%;
        background-position: 0 88%;
        display: inline;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .result.plain { background-image: none; }

      .dict { margin: 12px 0 0; padding: 0; list-style: none; }
      .dict li { display: flex; gap: 8px; font-size: 12.5px; line-height: 1.6; }
      .dict .pos {
        flex: 0 0 62px;
        font: italic 11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #9A9EA6;
      }
      .dict .terms { color: #4A4E56; overflow-wrap: anywhere; }

      .orig {
        margin-top: 12px; padding-top: 10px;
        border-top: 1px dashed rgba(0,0,0,.12);
        font-size: 12.5px; line-height: 1.5; color: #6B6F76;
        overflow-wrap: anywhere; white-space: pre-wrap;
        max-height: 84px; overflow-y: auto;
      }

      /* ---- grammar ---- */
      .checked {
        margin: 0;
        font-size: 14.5px; line-height: 1.7;
        white-space: pre-wrap; overflow-wrap: anywhere;
      }
      .flag {
        background: none;
        color: inherit;
        padding-bottom: 1px;
        border-bottom: 2px solid #C9CCD2;
        cursor: pointer;
      }
      .flag.hard { border-color: #D8453A; }
      .flag.soft { border-color: #E9A23B; }
      .flag:hover, .flag.active { background: rgba(255,210,74,.45); }

      .issues { margin: 14px 0 0; padding: 0; list-style: none; }
      .issue {
        padding: 9px 0;
        border-top: 1px solid rgba(0,0,0,.07);
      }
      .issue .badge {
        display: inline-block;
        font: 600 9.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: .07em; text-transform: uppercase;
        color: #6B6F76;
        border: 1px solid rgba(0,0,0,.14);
        border-radius: 4px;
        padding: 3px 5px;
        margin-bottom: 6px;
      }
      .issue .badge.hard { color: #B4231C; border-color: rgba(180,35,28,.35); }
      .issue .msg { margin: 0; font-size: 12.5px; line-height: 1.5; color: #4A4E56; }
      .fixes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .fix {
        all: unset;
        font: 500 12.5px/1 inherit;
        padding: 7px 11px;
        border-radius: 7px;
        border: 1px solid rgba(0,0,0,.13);
        background: #fff;
        color: #4A4E56;
        cursor: pointer;
        transition: background .14s ease, border-color .14s ease, color .14s ease,
                    transform .12s ease, box-shadow .14s ease;
      }
      .fix:hover {
        background: #FFD24A;
        border-color: transparent;
        color: #17181C;
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0,0,0,.10);
      }
      .fix:active { transform: translateY(0) scale(.96); box-shadow: none; }
      .fix:focus-visible { outline: 2px solid #17181C; outline-offset: 2px; }
      /* The top-ranked suggestion carries the marker; the rest stay quiet
         so a sentence with six issues doesn't turn into a wall of yellow. */
      .fix.primary {
        font-weight: 600;
        color: #17181C;
        background: #FFD24A;
        border-color: transparent;
        box-shadow: 0 1px 2px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.45);
      }
      .fix.primary:hover { filter: brightness(.95); box-shadow: 0 4px 11px rgba(216,168,20,.42); }
      .clean {
        margin: 12px 0 0;
        font-size: 13px;
        color: #1A8A45;
      }

      .note { margin-top: 10px; font-size: 11.5px; color: #9A9EA6; }
      .error { font-size: 13px; line-height: 1.5; color: #B4231C; margin: 0; }

      .dots { display: flex; gap: 5px; padding: 6px 0; }
      .dots i {
        width: 6px; height: 6px; border-radius: 50%;
        background: #C9CCD2;
        animation: pulse 1s ease-in-out infinite;
      }
      .dots i:nth-child(2) { animation-delay: .15s; }
      .dots i:nth-child(3) { animation-delay: .3s; }
      @keyframes pulse { 50% { background: #17181C; transform: translateY(-2px); } }

      footer {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 10px;
        border-top: 1px solid rgba(0,0,0,.07);
        background: #FAFAFA;
      }
      footer > div { display: none; align-items: center; gap: 8px; width: 100%; }
      footer > div.on { display: flex; }
      select {
        all: unset;
        font: 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #17181C;
        padding: 7px 26px 7px 9px;
        border: 1px solid rgba(0,0,0,.13);
        border-radius: 7px;
        background: #fff;
        background-image:
          linear-gradient(45deg, transparent 50%, #6B6F76 50%),
          linear-gradient(135deg, #6B6F76 50%, transparent 50%);
        background-position: calc(100% - 14px) calc(50% + 1px), calc(100% - 9px) calc(50% + 1px);
        background-size: 5px 5px, 5px 5px;
        background-repeat: no-repeat;
        cursor: pointer;
        max-width: 175px;
        transition: border-color .14s ease, box-shadow .14s ease;
      }
      select:hover { border-color: rgba(0,0,0,.28); }
      select:focus-visible { outline: 2px solid #17181C; outline-offset: 1px; }
      .hint {
        font: 10.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #A8ACB4; letter-spacing: .04em;
      }
      .credit {
        font: 10.5px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        color: #A8ACB4;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .credit:hover { color: #17181C; }

      @media (prefers-color-scheme: dark) {
        .panel { background: #1E1F24; border-color: rgba(255,255,255,.12); color: #ECEDEF; }
        header, footer, .issue { border-color: rgba(255,255,255,.09); }
        footer { background: #232429; }
        .tabs { background: rgba(255,255,255,.07); }
        .tab[aria-selected="true"] { background: #34363D; color: #ECEDEF; }
        .icon:hover { background: rgba(255,255,255,.09); color: #ECEDEF; }
        .icon:focus-visible, select:focus-visible, .tab:focus-visible { outline-color: #FFD24A; }
        .result { color: #ECEDEF; background-image: linear-gradient(rgba(255,210,74,.28), rgba(255,210,74,.28)); }
        .dict .terms, .issue .msg { color: #C4C7CD; }
        .orig { border-color: rgba(255,255,255,.14); color: #9DA1A9; }
        .issue .badge { color: #9DA1A9; border-color: rgba(255,255,255,.18); }
        .issue .badge.hard { color: #FF8B84; border-color: rgba(255,139,132,.4); }
        .flag { border-color: #55585F; }
        .fix { background: #2A2C33; border-color: rgba(255,255,255,.14); color: #C4C7CD; }
        .fix:hover { background: #FFD24A; color: #17181C; border-color: transparent; }
        .fix.primary { background: #FFD24A; color: #17181C; }
        .chip { background: #2A2C33; border-color: rgba(255,255,255,.12); color: #9DA1A9; }
        .chip:hover { color: #ECEDEF; }
        .chip.on { background: #FFD24A; border-color: transparent; color: #17181C; }
        .f input, .f textarea {
          background: #232429; border-color: rgba(255,255,255,.12); color: #ECEDEF;
        }
        .f input:focus, .f textarea:focus { outline-color: #FFD24A; }
        .s-status { color: #9DA1A9; }
        .s-status b { color: #ECEDEF; }
        .fix:focus-visible { outline-color: #FFD24A; }
        .icon.done { color: #5FCB86; background: rgba(95,203,134,.16); }
        .flag:hover, .flag.active { background: rgba(255,210,74,.3); }
        .clean { color: #5FCB86; }
        select { background-color: #2A2C33; color: #ECEDEF; border-color: rgba(255,255,255,.14); }
        select:hover { border-color: rgba(255,255,255,.32); }
        .dots i { background: #4A4E56; }
        @keyframes pulse { 50% { background: #FFD24A; transform: translateY(-2px); } }
        .error { color: #FF8B84; }
        .credit:hover { color: #ECEDEF; }
      }
    </style>

    <div class="bubble" role="button" tabindex="0" title="Translate or check selection">
      <svg viewBox="0 0 24 24" fill="none" stroke="#FFD24A" stroke-width="2.1"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 6h9M8.5 6c0 4.5-2 7.8-5 9.5"/>
        <path d="M6 10.5c1.4 2.6 3.4 4.2 6 5"/>
        <path d="M12.5 20l4-9 4 9M14.2 17h4.6"/>
      </svg>
    </div>

    <div class="panel" role="dialog" aria-label="Translation and grammar">
      <header>
        <div class="tabs" role="tablist">
          <button class="tab" role="tab" data-mode="translate" aria-selected="true">Translate</button>
          <button class="tab" role="tab" data-mode="check" aria-selected="false">Check</button>
          <button class="tab" role="tab" data-mode="save" aria-selected="false">Save</button>
        </div>
        <span class="spacer"></span>
        <button class="icon" data-act="speak" title="Read aloud" aria-label="Read aloud">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/>
            <path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>
        </button>
        <button class="icon" data-act="copy" title="Copy" aria-label="Copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/>
            <path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>
        </button>
        <button class="icon" data-act="close" title="Close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </header>

      <div class="body"></div>

      <footer>
        <div class="foot-translate on">
          <select class="target" aria-label="Translate into"></select>
          <span class="spacer"></span>
          <span class="hint">Esc to close</span>
        </div>
        <div class="foot-check">
          <select class="checklang" aria-label="Check language"></select>
          <span class="spacer"></span>
          <a class="credit" href="https://languagetool.org" target="_blank" rel="noopener">LanguageTool</a>
        </div>
        <div class="foot-save">
          <span class="hint">Goes to your English sheet</span>
          <span class="spacer"></span>
          <span class="hint">Esc to close</span>
        </div>
      </footer>
    </div>
  `;

  const bubble = root.querySelector(".bubble");
  const panel = root.querySelector(".panel");
  const body = root.querySelector(".body");
  const targetSelect = root.querySelector(".target");
  const checkSelect = root.querySelector(".checklang");
  const footTranslate = root.querySelector(".foot-translate");
  const footCheck = root.querySelector(".foot-check");
  const footSave = root.querySelector(".foot-save");

  fill(targetSelect, QT_LANGUAGES);
  fill(checkSelect, QT_CHECK_LANGUAGES);

  function fill(select, list) {
    for (const item of list) {
      const option = document.createElement("option");
      option.value = item.code;
      option.textContent = item.name;
      select.appendChild(option);
    }
  }

  const mount = () => {
    if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
  };

  /* ----------------------------------------------------------- selection */

  function readSelection() {
    const el = document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
      try {
        // Reading selectionStart throws on input types that don't support it
        // (number, email, date). Without this guard the whole handler dies.
        const { selectionStart: start, selectionEnd: end } = el;
        if (typeof start === "number" && start !== end) {
          const text = el.value.slice(start, end).trim();
          if (text) {
            return {
              text,
              rect: el.getBoundingClientRect(),
              field: { el, start, end },
              context: sentenceAround(el.value, start, end - start)
            };
          }
        }
      } catch {
        /* fall through to the document selection */
      }
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const text = sel.toString().trim();
    if (!text) return null;

    const range = sel.getRangeAt(0);
    const rects = range.getClientRects();
    const rect = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return null;
    return { text, rect, field: null, context: contextFromSelection(sel, text) };
  }

  /* ------------------------------------------------------------- context */

  // Saving a word is far more useful with the sentence it appeared in, so
  // pull that out of the surrounding block while the selection still exists.
  function contextFromSelection(sel, text) {
    try {
      const node = sel.anchorNode;
      const block = node && node.nodeType === 3 ? node.parentElement : node;
      if (!block) return "";
      const hay = String(block.innerText || block.textContent || "").replace(/\s+/g, " ").trim();
      if (!hay || hay.length > 2000) return "";
      const needle = text.replace(/\s+/g, " ");
      const at = hay.toLowerCase().indexOf(needle.toLowerCase());
      return at < 0 ? "" : sentenceAround(hay, at, needle.length);
    } catch {
      return "";
    }
  }

  function sentenceAround(hay, at, length) {
    const text = String(hay || "").replace(/\s+/g, " ");
    if (!text || at < 0) return "";

    let start = 0;
    for (let i = at - 1; i >= 0; i--) {
      if (".!?".includes(text[i])) { start = i + 1; break; }
    }
    let end = text.length;
    for (let i = at + length; i < text.length; i++) {
      if (".!?".includes(text[i])) { end = i + 1; break; }
    }

    const out = text.slice(start, end).trim();
    // Not worth offering if it is just the selection again, or a whole page.
    if (out.length <= length + 2 || out.length > 400) return "";
    return out;
  }

  let settleTimer = 0;

  function onSelectionEnd(event) {
    if (event && event.composedPath && event.composedPath().includes(host)) return;

    // Let the browser finish updating the selection first.
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const found = readSelection();
      if (!found) {
        if (!panel.classList.contains("on")) hideAll();
        return;
      }

      source = found;

      if (settings.autoTranslate) {
        openPanel(found.text, found.rect, "translate");
      } else {
        showBubble(found.rect);
      }
    }, 30);
  }

  document.addEventListener("mouseup", onSelectionEnd, true);

  // Backstop for selections the mouse never finishes: triple-click drags that
  // end outside the document, double-click on some editors, Ctrl+A.
  document.addEventListener("selectionchange", () => {
    if (panel.classList.contains("on")) return;
    const found = readSelection();
    if (found && found.text !== source.text) onSelectionEnd();
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift" || (e.shiftKey && e.key.startsWith("Arrow")) || (e.ctrlKey && e.key === "a")) {
      onSelectionEnd(e);
    }
  }, true);

  document.addEventListener("mousedown", (e) => {
    if (e.composedPath && e.composedPath().includes(host)) return;
    hideAll();
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideAll();
  }, true);

  window.addEventListener("scroll", () => {
    // Only hide the bubble on scroll, keep the panel open
    if (!panel.classList.contains("on")) hideAll();
  }, true);
  window.addEventListener("resize", () => hideAll());

  /* ---------------------------------------------------------- positioning */

  function showBubble(rect) {
    mount();
    panel.classList.remove("on");
    bubble.style.top = Math.min(rect.bottom + 6, window.innerHeight - 34) + "px";
    bubble.style.left = Math.min(Math.max(rect.right - 4, 6), window.innerWidth - 34) + "px";
    bubble.classList.add("on");
  }

  function placePanel(rect) {
    mount();
    panel.classList.add("on");
    const width = panel.offsetWidth || 360;
    const height = panel.offsetHeight || 160;

    let left = rect.left;
    if (left + width > window.innerWidth - 10) left = window.innerWidth - width - 10;
    left = Math.max(10, left);

    let top = rect.bottom + 8;
    if (top + height > window.innerHeight - 10) {
      const above = rect.top - height - 8;
      top = above > 10 ? above : Math.max(10, window.innerHeight - height - 10);
    }

    panel.style.left = left + "px";
    panel.style.top = top + "px";
  }

  const anchor = () => source.rect || { left: 40, right: 40, top: 40, bottom: 40 };

  function hideAll() {
    bubble.classList.remove("on");
    panel.classList.remove("on");
    window.speechSynthesis?.cancel();
  }

  /* ------------------------------------------------------------- dispatch */

  function openPanel(text, rect, nextMode, presetType) {
    if (nextMode) mode = nextMode;
    bubble.classList.remove("on");
    source.text = text;

    for (const tab of root.querySelectorAll(".tab")) {
      tab.setAttribute("aria-selected", String(tab.dataset.mode === mode));
    }
    footTranslate.classList.toggle("on", mode === "translate");
    footCheck.classList.toggle("on", mode === "check");
    footSave.classList.toggle("on", mode === "save");
    targetSelect.value = settings.targetLang;
    checkSelect.value = settings.checkLang;

    if (mode === "save") {
      saveType = presetType || guessType(text);
      placePanel(rect || anchor());
      renderSave(text);
      return;
    }

    spinner();
    placePanel(rect || anchor());
    mode === "check" ? runCheck(text) : runTranslate(text, settings.targetLang);
  }

  function spinner() {
    body.innerHTML = `<div class="dots"><i></i><i></i><i></i></div>`;
  }

  function ask(message) {
    const id = ++requestId;
    let pending;
    try {
      pending = chrome.runtime.sendMessage(message);
    } catch {
      renderError("The extension was reloaded. Refresh this page and try again.");
      return null;
    }
    return Promise.resolve(pending).then((res) => {
      if (id !== requestId) return null;
      if (!res) {
        renderError("The extension was reloaded. Refresh this page and try again.");
        return null;
      }
      if (!res.ok) {
        renderError(res.error);
        return null;
      }
      return res;
    }).catch(() => {
      if (id === requestId) renderError("Couldn't reach the service.");
      return null;
    });
  }

  /* ---------------------------------------------------------- translation */

  function runTranslate(text, target) {
    ask({ type: "qt:translate", text, target, provider: settings.provider })?.then((res) => {
      if (!res) return;
      translation = { text: res.text, lang: target, forText: text };

      const long = res.text.length > 220;
      let html = `<p class="result${long ? " plain" : ""}">${escapeHtml(res.text)}</p>`;

      if (res.dict?.length) {
        html += `<ul class="dict">` + res.dict.map((entry) =>
          `<li><span class="pos">${escapeHtml(entry.pos || "—")}</span>` +
          `<span class="terms">${escapeHtml((entry.terms || []).join(", "))}</span></li>`
        ).join("") + `</ul>`;
      }

      html += `<p class="note">${escapeHtml(QT_LANG_NAME(res.source) || "Auto")} → ` +
              `${escapeHtml(QT_LANG_NAME(target))}</p>`;
      if (text.length > 60) html += `<div class="orig">${escapeHtml(text)}</div>`;
      if (res.note) html += `<p class="note">${escapeHtml(res.note)}</p>`;

      body.innerHTML = html;
      placePanel(anchor());
    });
  }

  /* ----------------------------------------------------------------- save */

  function guessType(text) {
    const words = text.trim().split(/\s+/).length;
    if (words === 1) return "vocab";
    return words <= 4 ? "collocation" : "sentence";
  }

  function renderSave(text) {
    const chips = SAVE_TYPES.map((t) =>
      `<button class="chip${t.id === saveType ? " on" : ""}" data-type="${t.id}">` +
      `${escapeHtml(t.label)}</button>`
    ).join("");

    const viSeed = (translation.forText === text && translation.lang === "vi") ? translation.text : "";
    const noteSeed = (translation.forText === text && translation.lang !== "vi") ? translation.text : "";

    body.innerHTML =
      `<div class="save">` +
        `<div class="types" role="group" aria-label="Entry type">${chips}</div>` +
        `<label class="f"><span>Term</span>` +
          `<input class="s-term" value="${escapeHtml(text)}"></label>` +
        `<label class="f"><span>Example</span>` +
          `<textarea class="s-ex" placeholder="The sentence you met it in">` +
          `${escapeHtml(source.context || "")}</textarea></label>` +
        `<label class="f"><span>Note</span>` +
          `<input class="s-note" value="${escapeHtml(noteSeed)}" ` +
          `placeholder="Meaning in your own words"></label>` +
        `<label class="f"><span>Vietnamese</span>` +
          `<input class="s-vi" value="${escapeHtml(viSeed)}" ` +
          `placeholder="Auto-filled"></label>` +
        `<label class="f"><span>Tags</span>` +
          `<input class="s-tags" placeholder="work, travel"></label>` +
        `<button class="save-go" data-act="do-save">Save to sheet</button>` +
        `<p class="s-status">Pronunciation and the English definition are filled in by the sheet.</p>` +
      `</div>`;

    placePanel(anchor());

    // Auto-fill Vietnamese if no seed from translation tab
    if (!viSeed) {
      const vi = root.querySelector(".s-vi");
      chrome.runtime.sendMessage({
        type: "qt:translate", text, target: "vi", provider: settings.provider
      }).then((res) => {
        if (res?.ok && vi.isConnected && !vi.value.trim()) vi.value = res.text;
      }).catch(() => {});
    }

    // Auto-fill note from non-Vietnamese translation if no seed
    if (!noteSeed && translation.forText !== text) {
      const note = root.querySelector(".s-note");
      chrome.runtime.sendMessage({
        type: "qt:translate", text, target: settings.targetLang, provider: settings.provider
      }).then((res) => {
        if (res?.ok && note.isConnected && !note.value.trim()) note.value = res.text;
      }).catch(() => {});
    }
  }

  function doSave() {
    const button = root.querySelector(".save-go");
    const status = root.querySelector(".s-status");
    const term = root.querySelector(".s-term").value.trim();
    if (!term) { root.querySelector(".s-term").focus(); return; }

    button.disabled = true;
    status.classList.remove("bad");
    status.textContent = "Saving…";

    const item = {
      type: saveType,
      term,
      example: root.querySelector(".s-ex").value.trim(),
      note: root.querySelector(".s-note").value.trim(),
      vietnamese: root.querySelector(".s-vi").value.trim(),
      tags: root.querySelector(".s-tags").value.trim()
    };

    Promise.resolve(chrome.runtime.sendMessage({ type: "qt:save", item }))
      .then((res) => {
        if (!res?.ok) {
          status.classList.add("bad");
          status.textContent = res?.error || "Couldn't save that.";
          button.disabled = false;
          return;
        }
        const bits = [res.action === "updated" ? "Updated on the sheet" : "Saved to the sheet"];
        if (res.pos) bits.push(res.pos);
        if (res.vietnamese) bits.push(res.vietnamese);
        if (res.ipa) bits.push(res.ipa);
        if (res.meaning) bits.push(String(res.meaning).split("\n")[0]);
        status.innerHTML = `<b>${escapeHtml(bits[0])}</b>` +
          (bits.length > 1 ? " · " + escapeHtml(bits.slice(1).join(" · ")) : "");
        button.textContent = "Saved";
        setTimeout(() => { if (mode === "save") hideAll(); }, 1400);
      })
      .catch(() => {
        status.classList.add("bad");
        status.textContent = "The extension was reloaded. Refresh this page and try again.";
        button.disabled = false;
      });
  }

  /* -------------------------------------------------------------- grammar */

  function runCheck(text) {
    ask({
      type: "qt:check",
      text,
      language: settings.checkLang,
      server: settings.ltServer
    })?.then((res) => {
      if (!res) return;
      check = { text: res.text, matches: res.matches, language: res.language, dirty: false };
      renderCheck(res.truncated);
    });
  }

  function severity(match) {
    return ["misspelling", "grammar", "typographical"].includes(match.issueType) ? "hard" : "soft";
  }

  function renderCheck(truncated) {
    const { text, matches } = check;

    let html = `<p class="checked">${highlight(text, matches)}</p>`;

    if (!matches.length) {
      html += `<p class="clean">No issues found${check.dirty ? " — all fixes applied." : "."}</p>`;
    } else {
      html += `<ul class="issues">` + matches.map((m) => {
        const level = severity(m);
        const label = m.category || (level === "hard" ? "Grammar" : "Style");
        const fixes = m.replacements.map((value, i) =>
          `<button class="fix${i === 0 ? " primary" : ""}" data-fix="${m.id}" ` +
          `data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`
        ).join("");
        return `<li class="issue" data-issue="${m.id}">` +
          `<span class="badge ${level}">${escapeHtml(label)}</span>` +
          `<p class="msg">${escapeHtml(m.detail || m.message)}</p>` +
          (fixes ? `<div class="fixes">${fixes}</div>` : "") +
          `</li>`;
      }).join("") + `</ul>`;
    }

    const bits = [];
    if (check.language) bits.push(check.language);
    bits.push(matches.length === 1 ? "1 issue" : `${matches.length} issues`);
    if (truncated) bits.push("text was truncated");
    html += `<p class="note">${escapeHtml(bits.join(" · "))}</p>`;

    body.innerHTML = html;
    placePanel(anchor());
  }

  function highlight(text, matches) {
    const sorted = [...matches].sort((a, b) => a.offset - b.offset);
    let out = "";
    let cursor = 0;
    for (const m of sorted) {
      if (m.offset < cursor) continue; // overlapping match, skip
      out += escapeHtml(text.slice(cursor, m.offset));
      out += `<mark class="flag ${severity(m)}" data-flag="${m.id}">` +
             `${escapeHtml(text.substr(m.offset, m.length))}</mark>`;
      cursor = m.offset + m.length;
    }
    return out + escapeHtml(text.slice(cursor));
  }

  // Apply locally and shift the remaining offsets rather than re-querying —
  // the free tier only allows 20 requests a minute.
  function applyFix(id, replacement) {
    const match = check.matches.find((m) => m.id === id);
    if (!match) return;

    check.text =
      check.text.slice(0, match.offset) + replacement + check.text.slice(match.offset + match.length);

    const delta = replacement.length - match.length;
    check.matches = check.matches
      .filter((m) => m.id !== id)
      .map((m) => (m.offset > match.offset ? { ...m, offset: m.offset + delta } : m));
    check.dirty = true;

    writeBack(check.text);
    renderCheck();
  }

  // If the text came from a real input, put the correction back in place.
  function writeBack(next) {
    const field = source.field;
    if (!field || !field.el.isConnected) return false;
    const el = field.el;
    try {
      const value = el.value;
      const updated = value.slice(0, field.start) + next + value.slice(field.end);
      // React and friends track the value via a patched setter; go native.
      const setter = Object.getOwnPropertyDescriptor(
        el.constructor.prototype, "value"
      )?.set;
      setter ? setter.call(el, updated) : (el.value = updated);
      field.end = field.start + next.length;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch {
      return false;
    }
  }

  /* --------------------------------------------------------------- shared */

  function renderError(message) {
    body.innerHTML = `<p class="error">${escapeHtml(message || "Something went wrong.")}</p>`;
    placePanel(anchor());
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  const output = () => {
    if (mode === "check") return check.text;
    if (mode === "save") return root.querySelector(".s-term")?.value.trim() || source.text;
    return translation.text;
  };

  /* ------------------------------------------------------------- controls */

  // preventDefault keeps the page selection alive while the bubble is clicked.
  bubble.addEventListener("mousedown", (e) => e.preventDefault());
  bubble.addEventListener("click", () => openPanel(source.text, source.rect));
  bubble.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPanel(source.text, source.rect);
    }
  });

  panel.addEventListener("mousedown", (e) => {
    // Everything else has its mousedown swallowed so the page selection
    // survives; form controls need it to focus.
    if (e.target.closest("select, a, input, textarea")) return;
    e.preventDefault();
  });

  panel.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-mode]");
    if (tab) {
      if (tab.dataset.mode !== mode) openPanel(source.text, source.rect, tab.dataset.mode);
      return;
    }

    const chip = e.target.closest("[data-type]");
    if (chip) {
      saveType = chip.dataset.type;
      for (const c of root.querySelectorAll(".chip")) c.classList.toggle("on", c === chip);
      chrome.storage.sync.set({ lastSaveType: saveType });
      return;
    }

    const fix = e.target.closest("[data-fix]");
    if (fix) {
      applyFix(Number(fix.dataset.fix), fix.dataset.value);
      return;
    }

    const flag = e.target.closest("[data-flag]");
    if (flag) {
      const issue = root.querySelector(`[data-issue="${flag.dataset.flag}"]`);
      issue?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      for (const el of root.querySelectorAll(".flag")) el.classList.remove("active");
      flag.classList.add("active");
      return;
    }

    const action = e.target.closest("[data-act]")?.dataset.act;
    if (!action) return;

    if (action === "close") hideAll();

    if (action === "do-save") doSave();

    if (action === "copy" && output()) {
      navigator.clipboard.writeText(output()).then(() => {
        const button = root.querySelector('[data-act="copy"]');
        if (button.classList.contains("done")) return;
        const original = button.innerHTML;
        button.innerHTML =
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ` +
          `stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>`;
        button.classList.add("done");
        setTimeout(() => {
          button.innerHTML = original;
          button.classList.remove("done");
        }, 1100);
      }).catch(() => {});
    }

    if (action === "speak" && output()) {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(output());
      utterance.lang = mode === "save" ? "en-US"
                     : mode === "check" ? (settings.checkLang === "auto" ? "en" : settings.checkLang)
                     : (translation.lang || "en");
      synth.speak(utterance);
    }
  });

  targetSelect.addEventListener("change", () => {
    settings.targetLang = targetSelect.value;
    chrome.storage.sync.set({ targetLang: targetSelect.value });
    spinner();
    runTranslate(source.text, targetSelect.value);
  });

  checkSelect.addEventListener("change", () => {
    settings.checkLang = checkSelect.value;
    chrome.storage.sync.set({ checkLang: checkSelect.value });
    spinner();
    runCheck(check.dirty ? check.text : source.text);
  });

  /* ------------------------------------------------- messages from worker */

  // One line so you can confirm from DevTools that the script actually ran.
  console.log("[Selection Translate] ready — select text to see the button.");

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "qt:run-text" && msg.text) {
      const found = readSelection();
      if (found) source = found;
      openPanel(msg.text, source.rect, msg.mode, msg.saveType);
    }

    if (msg?.type === "qt:run-selection") {
      const found = readSelection();
      if (!found) return; // another frame owns the selection
      source = found;
      openPanel(found.text, found.rect, msg.mode, msg.saveType);
    }
  });
})();
