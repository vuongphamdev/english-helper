/**
 * English Reference — Google Sheet sync
 * ------------------------------------------------------------------
 * Two jobs:
 *   1. You type a word. This fills in IPA, an audio link, and an English
 *      definition from dictionaryapi.dev. You write the example yourself.
 *   2. doGet() serves the whole sheet as JSON so the HTML page can read it.
 *
 * Setup
 *   1. Open your Sheet > Extensions > Apps Script. Paste this in. Save.
 *   2. Run setUpSheet() once (authorise when asked).
 *   3. Deploy > New deployment > Web app
 *        Execute as:  Me
 *        Who has access:  Anyone
 *      Copy the /exec URL into SHEET_API in english-reference.html.
 *   4. Optional: run installTrigger() so rows fill in as you type.
 *
 * Note: "Anyone" means anyone with the URL can read your words. It does not
 * expose the rest of your Drive, and nobody can write. If you would rather
 * keep it private, see the "Keep it private" note at the bottom of this file.
 *
 * Column schema (1-indexed):
 *   1 Term | 2 Type | 3 POS | 4 IPA | 5 Meaning | 6 Vietnamese |
 *   7 Example | 8 Note | 9 Tags | 10 Added | 11 Audio
 */

const SHEET_NAME = "Words";
const HEADERS = [
  "Term",
  "Type",
  "POS",
  "IPA",
  "Meaning",
  "Vietnamese",
  "Example",
  "Note",
  "Tags",
  "Added",
  "Audio",
];
const TYPES = ["vocab", "slang", "collocation", "sentence"];

// Fill the Example column from the dictionary when you have left it blank.
// Set to false if you always want to write your own.
const FILL_EXAMPLE_IF_BLANK = true;

/* ================================================================== */
/*  Menu                                                              */
/* ================================================================== */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("English")
    .addItem("Set up sheet", "setUpSheet")
    .addItem("Fill in missing details", "enrichAll")
    .addItem("Fill in selected rows (redo)", "enrichSelection")
    .addSeparator()
    .addItem("Play the word in this row", "playSelected")
    .addItem("Open player", "openPlayer")
    .addSeparator()
    .addItem("Repair audio links", "fixAudioLinks")
    .addItem("Set save key", "setSaveKey")
    .addItem("Fill as I type (install trigger)", "installTrigger")
    .addToUi();
}

/* ================================================================== */
/*  Playing audio inside the Sheet                                    */
/* ================================================================== */

/**
 * A cell cannot play sound, so open a small dialog that can. It uses the
 * recording when there is one and the browser voice when there is not.
 */
function playSelected() {
  const sh = sheet_();
  const row = sh.getActiveRange().getRow();
  if (row < 2) {
    SpreadsheetApp.getActive().toast("Click a word row first.");
    return;
  }

  const term = String(sh.getRange(row, 1).getValue() || "").trim(); // col 1 = Term
  if (!term) {
    SpreadsheetApp.getActive().toast("That row has no word in it.");
    return;
  }
  const ipa = String(sh.getRange(row, 4).getValue() || ""); // col 4 = IPA
  const url = audioFrom_(sh.getRange(row, 11)); // col 11 = Audio

  const html = HtmlService.createHtmlOutput(
    playerHtml_([{ term: term, ipa: ipa, audio: url }], true),
  )
    .setWidth(380)
    .setHeight(190);
  SpreadsheetApp.getUi().showModalDialog(html, "Pronunciation");
}

function openPlayer() {
  const sh = sheet_();
  const last = sh.getLastRow();
  let items = [];
  if (last >= 2) {
    const vals = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
    items = vals
      .map(function (r, i) {
        // r[0]=Term, r[3]=IPA, r[10]=Audio (plain URL text)
        return {
          term: String(r[0] || "").trim(),
          ipa: String(r[3] || ""),
          audio: fixAudioUrl_(String(r[10] || "")),
        };
      })
      .filter(function (x) {
        return x.term;
      })
      .reverse()
      .slice(0, 200);
  }
  const html = HtmlService.createHtmlOutput(playerHtml_(items, false)).setTitle(
    "Pronunciation",
  );
  SpreadsheetApp.getUi().showSidebar(html);
}

function playerHtml_(items, autoplay) {
  const data = JSON.stringify(items);
  return (
    "" +
    "<style>" +
    "body{font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#121B24;margin:0;padding:12px}" +
    ".row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #E3E8EE}" +
    ".w{flex:1;min-width:0}.t{font-weight:600}.p{color:#5A6675;font-size:12px}" +
    "button{border:0;background:#E7ECF7;color:#23407A;border-radius:3px;padding:6px 10px;cursor:pointer;font:inherit}" +
    "button:hover{background:#D8E1F4}button.on{background:#FBEAE8;color:#C42B22}" +
    ".hint{color:#5A6675;font-size:11.5px;margin:10px 0 0}" +
    ".big{font-size:19px;font-weight:600;margin-bottom:2px}" +
    "</style>" +
    '<div id="list"></div>' +
    '<p class="hint">No recording? The browser voice reads it instead. Slang and full sentences always use the voice.</p>' +
    "<script>" +
    "var ITEMS=" +
    data +
    ",AUTO=" +
    (autoplay ? "true" : "false") +
    ";" +
    'var box=document.getElementById("list");' +
    "ITEMS.forEach(function(it,i){" +
    ' var d=document.createElement("div");d.className="row";' +
    ' d.innerHTML=\'<div class="w"><div class="t\'+(AUTO?" big":"")+\'"></div><div class="p"></div></div>\';' +
    ' d.querySelector(".t").textContent=it.term;' +
    ' d.querySelector(".p").textContent=it.ipa||(it.audio?"":"browser voice");' +
    ' var b=document.createElement("button");b.textContent=it.audio?"Play":"Read";' +
    " b.onclick=function(){play(it,b);};d.appendChild(b);box.appendChild(d);" +
    " if(AUTO&&i===0)setTimeout(function(){play(it,b);},150);" +
    "});" +
    "function speak(it,b){" +
    ' if(!("speechSynthesis" in window)){b.textContent="unavailable";return;}' +
    ' speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(it.term);u.lang="en-US";u.rate=0.92;' +
    ' b.classList.add("on");u.onend=function(){b.classList.remove("on");};' +
    " speechSynthesis.speak(u);}" +
    "function play(it,b){" +
    " if(!it.audio)return speak(it,b);" +
    " var a=new Audio(it.audio),done=false;" +
    ' var fb=function(){if(done)return;done=true;b.classList.remove("on");speak(it,b);};' +
    ' a.addEventListener("error",fb);a.addEventListener("ended",function(){b.classList.remove("on");});' +
    ' b.classList.add("on");a.play().catch(fb);}' +
    "<\/script>"
  );
}

/**
 * Converts existing HYPERLINK formulas in the Audio column (11) to plain text
 * URLs, and drops links that were never valid. Run once after updating.
 */
function fixAudioLinks() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return;
  const rng = sh.getRange(2, 11, last - 1, 1); // col 11 = Audio
  const forms = rng.getFormulas();
  const vals = rng.getValues();
  let fixed = 0,
    cleared = 0;

  for (let i = 0; i < vals.length; i++) {
    const formula = forms[i][0];
    const value = vals[i][0];
    if (!formula && !value) continue;

    // Extract URL from HYPERLINK formula if present
    const m = String(formula || "").match(/HYPERLINK\("([^"]+)"/i);
    const url = m ? fixAudioUrl_(m[1]) : fixAudioUrl_(String(value || ""));
    const cell = sh.getRange(i + 2, 11);

    if (!url) {
      cell.clearContent();
      cleared++;
      continue;
    }

    // If it was a formula, convert to plain text
    if (formula) {
      cell.setValue(url);
      fixed++;
    } else if (String(value || "") !== url) {
      // Fix the URL scheme if needed
      cell.setValue(url);
      fixed++;
    }
  }
  SpreadsheetApp.getActive().toast(
    "Repaired " +
      fixed +
      " link" +
      (fixed === 1 ? "" : "s") +
      (cleared
        ? ", cleared " + cleared + " broken one" + (cleared === 1 ? "" : "s")
        : "") +
      ". Use English > Play the word in this row to hear it.",
    "English",
    8,
  );
}

function setUpSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  sh.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight("bold")
    .setBackground("#121B24")
    .setFontColor("#FFFFFF");
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 170); // Term
  sh.setColumnWidth(2, 90); // Type
  sh.setColumnWidth(3, 90); // POS
  sh.setColumnWidth(4, 140); // IPA
  sh.setColumnWidth(5, 360); // Meaning
  sh.setColumnWidth(6, 220); // Vietnamese
  sh.setColumnWidth(7, 360); // Example
  sh.setColumnWidth(8, 220); // Note
  sh.setColumnWidth(9, 140); // Tags
  sh.setColumnWidth(10, 100); // Added
  sh.setColumnWidth(11, 200); // Audio

  // Data validation for Type goes on column 2
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(TYPES, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(2, 2, sh.getMaxRows() - 1).setDataValidation(rule);

  SpreadsheetApp.getActive().toast(
    "Sheet ready. Put the word in column A and pick a type in column B.",
  );
}

/* ================================================================== */
/*  Enrichment                                                        */
/* ================================================================== */

function enrichAll() {
  run_(false);
}
function enrichSelection() {
  run_(true);
}

function run_(selectionOnly) {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return;

  let from = 2,
    to = last;
  if (selectionOnly) {
    const r = sh.getActiveRange();
    from = Math.max(2, r.getRow());
    to = Math.min(last, r.getLastRow());
  }

  const range = sh.getRange(from, 1, to - from + 1, HEADERS.length);
  const rows = range.getValues();
  let filled = 0,
    missed = [];

  // Column indices (0-based): 0=Term, 1=Type, 2=POS, 3=IPA, 4=Meaning,
  //   5=Vietnamese, 6=Example, 7=Note, 8=Tags, 9=Added, 10=Audio
  rows.forEach(function (row, i) {
    const term = String(row[0] || "").trim();
    const type = String(row[1] || "")
      .toLowerCase()
      .trim();
    if (!term) return;
    if (!row[9]) row[9] = new Date(); // Added
    if (!type) row[1] = guessType_(term); // default Type
    if (!shouldLookUp_(String(row[1]).toLowerCase(), term)) return;

    const hasAll = row[3] && row[4]; // IPA && Meaning
    if (hasAll && !selectionOnly) return; // already done

    const data = lookUp_(term);
    if (!data) {
      missed.push(term);
      return;
    }

    if (data.pos) row[2] = data.pos; // POS
    if (data.ipa) row[3] = data.ipa; // IPA
    if (data.audio) row[10] = data.audio; // Audio — plain text URL
    if (data.meaning) row[4] = data.meaning; // Meaning
    if (FILL_EXAMPLE_IF_BLANK && !row[6] && data.example) row[6] = data.example; // Example
    filled++;
    Utilities.sleep(150);
  });

  range.setValues(rows);

  let msg = "Filled " + filled + " row" + (filled === 1 ? "" : "s") + ".";
  if (missed.length)
    msg +=
      " Not in the dictionary: " +
      missed.slice(0, 6).join(", ") +
      (missed.length > 6 ? " and " + (missed.length - 6) + " more" : "") +
      ". Write those by hand.";
  SpreadsheetApp.getActive().toast(msg, "English", 8);
}

/**
 * Fires when you finish typing in column A (Term). Installable trigger only —
 * a simple onEdit cannot call UrlFetchApp.
 */
function onEditInstalled(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== SHEET_NAME) return;
  if (e.range.getColumn() !== 1 || e.range.getRow() < 2) return; // col 1 = Term
  const term = String(e.value || "").trim();
  if (!term) return;

  const row = e.range.getRow();
  // col 2 = Type
  if (!sh.getRange(row, 2).getValue())
    sh.getRange(row, 2).setValue(guessType_(term));
  // col 10 = Added
  if (!sh.getRange(row, 10).getValue())
    sh.getRange(row, 10).setValue(new Date());
  if (
    !shouldLookUp_(String(sh.getRange(row, 2).getValue()).toLowerCase(), term)
  )
    return;

  const data = lookUp_(term);
  if (!data) {
    sh.getRange(row, 8).setValue(
      "Not in dictionary — write the meaning yourself",
    );
    return;
  } // col 8 = Note
  if (data.pos) sh.getRange(row, 3).setValue(data.pos); // col 3 = POS
  if (data.ipa) sh.getRange(row, 4).setValue(data.ipa); // col 4 = IPA
  if (data.audio) sh.getRange(row, 11).setValue(data.audio); // col 11 = Audio (plain text URL)
  if (data.meaning) sh.getRange(row, 5).setValue(data.meaning); // col 5 = Meaning
  if (
    FILL_EXAMPLE_IF_BLANK &&
    !sh.getRange(row, 7).getValue() &&
    data.example
  ) {
    sh.getRange(row, 7).setValue(data.example); // col 7 = Example
  }
}

function installTrigger() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "onEditInstalled")
      ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("onEditInstalled").forSpreadsheet(ss).onEdit().create();
  SpreadsheetApp.getActive().toast("Rows will now fill in as you type.");
}

/**
 * dictionaryapi.dev — free, no key. Returns null when the word is not found,
 * which happens often with slang and always with multi-word phrases.
 */
function lookUp_(term) {
  const url =
    "https://api.dictionaryapi.dev/api/v2/entries/en/" +
    encodeURIComponent(term.toLowerCase());
  let res;
  try {
    res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } catch (err) {
    return null;
  }
  if (res.getResponseCode() !== 200) return null;

  let json;
  try {
    json = JSON.parse(res.getContentText());
  } catch (err) {
    return null;
  }
  if (!json || !json.length) return null;

  const out = { ipa: "", audio: "", meaning: "", example: "", pos: "" };

  // Collect unique parts of speech
  const posSet = {};
  json.forEach(function (entry) {
    (entry.meanings || []).forEach(function (m) {
      if (m.partOfSpeech) posSet[m.partOfSpeech] = true;
    });
  });
  const posArr = Object.keys(posSet);
  if (posArr.length) out.pos = posArr.join(", ");

  json.forEach(function (entry) {
    if (!out.ipa && entry.phonetic) out.ipa = entry.phonetic;
    (entry.phonetics || []).forEach(function (p) {
      if (!out.ipa && p.text) out.ipa = p.text;
      if (!out.audio && p.audio) out.audio = fixAudioUrl_(p.audio);
    });
  });

  // Up to two senses, each tagged with its part of speech.
  const senses = [];
  json.forEach(function (entry) {
    (entry.meanings || []).forEach(function (m) {
      (m.definitions || []).forEach(function (d) {
        if (senses.length < 2 && d.definition) {
          senses.push(m.partOfSpeech + " · " + d.definition);
          if (!out.example && d.example) out.example = d.example;
        }
      });
    });
  });
  out.meaning = senses.join("\n");
  return out.meaning || out.ipa ? out : null;
}

function guessType_(term) {
  const words = term.trim().split(/\s+/).length;
  if (words === 1) return "vocab";
  return words <= 4 ? "collocation" : "sentence";
}

/**
 * The dictionary only knows single words. Looking up "call it a day" burns a
 * request to get nothing back.
 */
function shouldLookUp_(type, term) {
  if (type === "sentence") return false;
  return term.trim().indexOf(" ") === -1;
}

function sheet_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sh)
    throw new Error(
      'No sheet named "' + SHEET_NAME + '". Run Set up sheet first.',
    );
  return sh;
}

/* ================================================================== */
/*  Web app — the HTML page reads this                                */
/* ================================================================== */

/* ================================================================== */
/*  Web app — writing (the Chrome extension posts here)               */
/* ================================================================== */

/**
 * Accepts one row at a time:
 *   { key, type, term, example, note, tags, vietnamese }
 * Fills in IPA / audio / meaning / POS on the way in, and merges instead of
 * duplicating when the same term is already on the sheet.
 *
 * The extension sends Content-Type: text/plain on purpose — anything else
 * triggers a CORS preflight, and Apps Script does not answer OPTIONS.
 */
function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return json_({ ok: false, error: "Body was not JSON" });
  }

  if (!authorised_(body.key))
    return json_({ ok: false, error: "Wrong or missing save key" });

  const term = String(body.term || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!term) return json_({ ok: false, error: "No term to save" });
  if (term.length > 500)
    return json_({ ok: false, error: "That is too long to be one entry" });

  const type =
    TYPES.indexOf(String(body.type || "")) >= 0
      ? String(body.type)
      : guessType_(term);
  const example = String(body.example || "").trim();
  const note = String(body.note || "").trim();
  const tags = String(body.tags || "").trim();
  const vietnamese = String(body.vietnamese || "").trim();

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: "Sheet is busy, try again" });
  }

  try {
    const sh = sheet_();
    const existing = findRow_(sh, term, type);

    let looked = { ipa: "", audio: "", meaning: "", example: "", pos: "" };
    if (shouldLookUp_(type, term)) looked = lookUp_(term) || looked;

    if (existing) {
      // Already there — top up the blanks rather than making a second row.
      const r = existing;
      if (!sh.getRange(r, 3).getValue() && looked.pos)
        sh.getRange(r, 3).setValue(looked.pos); // POS
      if (!sh.getRange(r, 4).getValue() && looked.ipa)
        sh.getRange(r, 4).setValue(looked.ipa); // IPA
      if (!sh.getRange(r, 5).getValue() && looked.meaning)
        sh.getRange(r, 5).setValue(looked.meaning); // Meaning
      if (!sh.getRange(r, 6).getValue() && vietnamese)
        sh.getRange(r, 6).setValue(vietnamese); // Vietnamese
      if (!sh.getRange(r, 11).getValue() && looked.audio)
        sh.getRange(r, 11).setValue(looked.audio); // Audio (plain text)
      if (example) appendCell_(sh.getRange(r, 7), example); // Example
      if (note) appendCell_(sh.getRange(r, 8), note); // Note
      if (tags) appendCell_(sh.getRange(r, 9), tags, ", "); // Tags
      return json_({
        ok: true,
        action: "updated",
        row: r,
        type: type,
        term: term,
        ipa: sh.getRange(r, 4).getValue(),
        meaning: sh.getRange(r, 5).getValue(),
      });
    }

    // New row: Term, Type, POS, IPA, Meaning, Vietnamese, Example, Note, Tags, Added, Audio
    const row = [
      term, // 1 Term
      type, // 2 Type
      looked.pos || "", // 3 POS
      looked.ipa || "", // 4 IPA
      looked.meaning || "", // 5 Meaning
      vietnamese, // 6 Vietnamese
      example || (FILL_EXAMPLE_IF_BLANK ? looked.example : "") || "", // 7 Example
      note, // 8 Note
      tags, // 9 Tags
      new Date(), // 10 Added
      looked.audio || "", // 11 Audio (plain text URL)
    ];
    sh.appendRow(row);
    const r = sh.getLastRow();

    return json_({
      ok: true,
      action: "added",
      row: r,
      type: type,
      term: term,
      ipa: looked.ipa || "",
      meaning: looked.meaning || "",
    });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/** Case-insensitive match on term + type, so "Run" and "run" stay one entry. */
function findRow_(sh, term, type) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const vals = sh.getRange(2, 1, last - 1, 2).getValues(); // cols 1-2: Term, Type
  const needle = term.toLowerCase();
  for (let i = 0; i < vals.length; i++) {
    if (
      String(vals[i][0] || "")
        .trim()
        .toLowerCase() === needle && // col 1 = Term
      String(vals[i][1] || "")
        .trim()
        .toLowerCase() === type
    )
      return i + 2; // col 2 = Type
  }
  return 0;
}

function appendCell_(cell, text, joiner) {
  const current = String(cell.getValue() || "").trim();
  if (!current) {
    cell.setValue(text);
    return;
  }
  if (current.toLowerCase().indexOf(text.toLowerCase()) !== -1) return; // already said
  cell.setValue(current + (joiner || "\n") + text);
}

/**
 * Set a save key with English > Set save key. Until you do, anyone with the
 * URL could post rows, which is fine for a word list but easy to lock down.
 */
function authorised_(key) {
  const want = PropertiesService.getScriptProperties().getProperty("API_KEY");
  if (!want) return true;
  return String(key || "") === want;
}

function setSaveKey() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(
    "Save key",
    "Pick a long random string. Paste the same one into the extension popup.\n" +
      "Leave blank to remove the key.",
    ui.ButtonSet.OK_CANCEL,
  );
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const key = res.getResponseText().trim();
  const props = PropertiesService.getScriptProperties();
  if (key) {
    props.setProperty("API_KEY", key);
    ui.alert("Saved. Put this in the extension popup:\n\n" + key);
  } else {
    props.deleteProperty("API_KEY");
    ui.alert("Key removed — anyone with the URL can post rows.");
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/* ================================================================== */
/*  Web app — reading (the HTML page reads this)                      */
/* ================================================================== */

function doGet(e) {
  const type = e && e.parameter && e.parameter.type;
  let items = [];
  let error = null;

  try {
    const sh = sheet_();
    const last = sh.getLastRow();
    if (last >= 2) {
      const values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();

      // Column indices (0-based): 0=Term, 1=Type, 2=POS, 3=IPA, 4=Meaning,
      //   5=Vietnamese, 6=Example, 7=Note, 8=Tags, 9=Added, 10=Audio
      items = values
        .map(function (r, i) {
          return {
            term: String(r[0] || "").trim(),
            type: String(r[1] || "vocab")
              .toLowerCase()
              .trim(),
            pos: String(r[2] || "").trim(),
            ipa: String(r[3] || "").trim(),
            meaning: String(r[4] || "").trim(),
            vietnamese: String(r[5] || "").trim(),
            example: String(r[6] || "").trim(),
            note: String(r[7] || "").trim(),
            tags: String(r[8] || "")
              .split(",")
              .map(function (s) {
                return s.trim();
              })
              .filter(String),
            added: r[9] ? new Date(r[9]).toISOString().slice(0, 10) : "",
            audio: fixAudioUrl_(String(r[10] || "")),
          };
        })
        .filter(function (x) {
          return x.term;
        });

      if (type)
        items = items.filter(function (x) {
          return x.type === type;
        });
    }
  } catch (err) {
    error = String(err.message || err);
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      ok: !error,
      error: error,
      count: items.length,
      items: items,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * The dictionary returns audio as "//ssl.gstatic.com/..." with no scheme.
 * A cell or a browser cannot open that, so give it one.
 */
function fixAudioUrl_(u) {
  u = String(u || "").trim();
  if (!u) return "";
  if (u.indexOf("//") === 0) return "https:" + u;
  if (u.indexOf("http://") === 0) return "https://" + u.slice(7);
  return u.indexOf("https://") === 0 ? u : "";
}

/**
 * Reads an audio URL from a cell. Handles both legacy HYPERLINK formulas
 * and the new plain-text URL format.
 */
function audioFrom_(cell) {
  const formula = cell.getFormula();
  const value = cell.getValue();
  const m = String(formula || "").match(/HYPERLINK\("([^"]+)"/i);
  if (m) return fixAudioUrl_(m[1]);
  return fixAudioUrl_(value);
}

/* ------------------------------------------------------------------
   A note on access
   The deployment has to be readable by "Anyone" for the extension and the
   HTML page to reach it. Nobody can read your Drive through it, and with a
   save key set, nobody can write either. Reading stays open to anyone who
   has the URL — obscurity, not real auth. Fine for a word list.
------------------------------------------------------------------ */
