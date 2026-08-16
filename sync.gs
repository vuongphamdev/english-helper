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
    .addSeparator()
    .addItem("Dump starter data", "dumpStarterData")
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
/*  Starter data                                                      */
/* ================================================================== */

/**
 * Populates the sheet with ~150 curated rows covering vocabulary, slang,
 * collocations, and useful sentences. IPA, Vietnamese, and Audio are left
 * blank so that enrichment can fill them in automatically afterwards.
 */
function dumpStarterData() {
  var sh = sheet_();
  var lastRow = sh.getLastRow();

  if (lastRow > 1) {
    var ui = SpreadsheetApp.getUi();
    var answer = ui.alert(
      "Starter data",
      "This will add starter data below your existing rows. Continue?",
      ui.ButtonSet.YES_NO,
    );
    if (answer !== ui.Button.YES) return;
  }

  var now = new Date();
  // Schema: [Term, Type, POS, IPA, Meaning, Vietnamese, Example, Note, Tags, Added, Audio]
  //          POS, IPA, Vietnamese, Audio left blank — enrichment fills them.
  var rows = [
    // ── Vocab: everyday verbs with collocations (tag: core) ────────
    ["take", "vocab", "", "", "to move something from one place/state to another", "", "Take a break, take responsibility, take notes.", "", "core", now, ""],
    ["make", "vocab", "", "", "to create or produce something", "", "Make a decision, make progress, make sense.", "", "core", now, ""],
    ["get", "vocab", "", "", "to obtain, become, or arrive", "", "Get started, get stuck, get the hang of.", "", "core", now, ""],
    ["keep", "vocab", "", "", "to continue or retain", "", "Keep track, keep in mind, keep up with.", "", "core", now, ""],
    ["run", "vocab", "", "", "to operate or move quickly", "", "Run a test, run into problems, run out of time.", "", "core", now, ""],
    ["set", "vocab", "", "", "to put in place or establish", "", "Set up, set a deadline, set expectations.", "", "core", now, ""],
    ["break", "vocab", "", "", "to separate into parts or pause", "", "Break down, break something, take a break.", "", "core", now, ""],
    ["hold", "vocab", "", "", "to keep or conduct", "", "Hold a meeting, hold on, hold off.", "", "core", now, ""],
    ["pull", "vocab", "", "", "to draw toward oneself", "", "Pull a request, pull together, pull off.", "", "core", now, ""],
    ["push", "vocab", "", "", "to press forward or exert force", "", "Push back, push through, push a commit.", "", "core", now, ""],

    // ── Vocab: confusing pairs (tag: confusing) ────────────────────
    ["affect", "vocab", "", "", "verb — to have an influence on", "", "The bug affected users.", "", "confusing", now, ""],
    ["effect", "vocab", "", "", "noun — a result or outcome", "", "It had a big effect on performance.", "", "confusing", now, ""],
    ["advice", "vocab", "", "", "noun — a recommendation", "", "I need advice on this design.", "", "confusing", now, ""],
    ["advise", "vocab", "", "", "verb — to give a recommendation", "", "Can you advise me on the architecture?", "", "confusing", now, ""],
    ["lose", "vocab", "", "", "verb — to be unable to find or keep", "", "Don't lose the API key.", "", "confusing", now, ""],
    ["loose", "vocab", "", "", "adjective — not tight", "", "The cable connection is loose.", "", "confusing", now, ""],
    ["quite", "vocab", "", "", "adverb — fairly, to a degree", "", "It's quite quiet here.", "", "confusing", now, ""],
    ["quiet", "vocab", "", "", "adjective — making little noise", "", "The office is very quiet today.", "", "confusing", now, ""],
    ["principal", "vocab", "", "", "adjective/noun — main; headmaster", "", "The principal reason is performance.", "", "confusing", now, ""],
    ["principle", "vocab", "", "", "noun — a fundamental rule or belief", "", "The principal principle is simplicity.", "", "confusing", now, ""],
    ["complement", "vocab", "", "", "verb/noun — to complete or make whole", "", "These tools complement each other.", "", "confusing", now, ""],
    ["compliment", "vocab", "", "", "verb/noun — to praise", "", "She complimented the clean code.", "", "confusing", now, ""],
    ["farther", "vocab", "", "", "adverb — at a greater physical distance", "", "The server room is farther down the hall.", "", "confusing", now, ""],
    ["further", "vocab", "", "", "adverb — additional, to a greater extent", "", "Further details are needed before we deploy.", "", "confusing", now, ""],
    ["lay", "vocab", "", "", "verb — to put down (needs an object)", "", "Lay the book down on the table.", "", "confusing", now, ""],
    ["lie", "vocab", "", "", "verb — to recline (no object needed)", "", "I'll lie here and rest for a bit.", "", "confusing", now, ""],

    // ── Vocab: feelings (tag: feelings) ────────────────────────────
    ["overwhelmed", "vocab", "", "", "feeling that there is too much to handle", "", "I'm overwhelmed by the backlog.", "", "feelings", now, ""],
    ["frustrated", "vocab", "", "", "annoyed at being unable to change something", "", "I'm frustrated with this bug.", "", "feelings", now, ""],
    ["relieved", "vocab", "", "", "glad that a worry or problem has ended", "", "I was relieved the deploy went fine.", "", "feelings", now, ""],
    ["anxious", "vocab", "", "", "worried or uneasy about what may happen", "", "She's anxious about the demo.", "", "feelings", now, ""],
    ["thrilled", "vocab", "", "", "extremely pleased and excited", "", "I'm thrilled to join the team.", "", "feelings", now, ""],
    ["exhausted", "vocab", "", "", "extremely tired", "", "I'm exhausted after that sprint.", "", "feelings", now, ""],
    ["grateful", "vocab", "", "", "feeling thankful and appreciative", "", "I'm grateful for the review.", "", "feelings", now, ""],
    ["confident", "vocab", "", "", "sure of one's abilities or outcome", "", "He's confident about the architecture.", "", "feelings", now, ""],

    // ── Vocab: work vocabulary (tag: work) ─────────────────────────
    ["bandwidth", "vocab", "", "", "available time or capacity", "", "I don't have bandwidth this week.", "", "work", now, ""],
    ["blocker", "vocab", "", "", "something that stops progress", "", "The missing API key is my blocker.", "", "work", now, ""],
    ["deliverable", "vocab", "", "", "a thing that must be provided or completed", "", "What are the deliverables for this sprint?", "", "work", now, ""],
    ["stakeholder", "vocab", "", "", "a person with an interest in the project", "", "We need stakeholder approval.", "", "work", now, ""],
    ["leverage", "vocab", "", "", "to use something to maximum advantage", "", "Let's leverage the existing API.", "", "work", now, ""],
    ["scalable", "vocab", "", "", "able to grow or be made larger", "", "We need a scalable solution.", "", "work", now, ""],
    ["bottleneck", "vocab", "", "", "the slowest point that limits throughput", "", "The database is the bottleneck.", "", "work", now, ""],
    ["trade-off", "vocab", "", "", "a sacrifice of one thing for another", "", "There's a trade-off between speed and quality.", "", "work", now, ""],
    ["iterate", "vocab", "", "", "to repeat a process to improve it", "", "Let's iterate on the design.", "", "work", now, ""],
    ["onboard", "vocab", "", "", "to bring a new person up to speed", "", "We need to onboard the new hire.", "", "work", now, ""],

    // ── Vocab: polite phrases (tag: polite) ────────────────────────
    ["Could you possibly…", "vocab", "", "", "a soft, polite request", "", "Could you possibly review my PR today?", "", "polite", now, ""],
    ["I was wondering if…", "vocab", "", "", "a very indirect way to ask something", "", "I was wondering if you had time for a quick call.", "", "polite", now, ""],
    ["Would it be possible to…", "vocab", "", "", "a formal request", "", "Would it be possible to extend the deadline?", "", "polite", now, ""],
    ["I'm afraid…", "vocab", "", "", "introduces bad news softly", "", "I'm afraid we won't make the release date.", "", "polite", now, ""],
    ["That's a fair point, but…", "vocab", "", "", "polite way to disagree", "", "That's a fair point, but the data says otherwise.", "", "polite", now, ""],
    ["Just to clarify…", "vocab", "", "", "asking for clarity without assigning blame", "", "Just to clarify, are we targeting v2 or v3?", "", "polite", now, ""],
    ["It might be worth…", "vocab", "", "", "a soft suggestion", "", "It might be worth adding a cache layer.", "", "polite", now, ""],

    // ── Slang: daily (tag: slang) ──────────────────────────────────
    ["hang out", "slang", "", "", "to spend time casually with someone", "", "Want to hang out after work?", "work-ok", "slang", now, ""],
    ["grab a bite", "slang", "", "", "to eat something quickly", "", "Let's grab a bite before the meeting.", "work-ok", "slang", now, ""],
    ["my bad", "slang", "", "", "my mistake", "", "Oh, my bad — I sent the wrong link.", "casual", "slang", now, ""],
    ["no worries", "slang", "", "", "it's fine, don't worry about it", "", "No worries, I'll fix it myself.", "work-ok", "slang", now, ""],
    ["I'm beat", "slang", "", "", "I'm very tired", "", "I'm beat — heading home early.", "casual", "slang", now, ""],
    ["hit me up", "slang", "", "", "contact me", "", "Hit me up if you need help.", "casual", "slang", now, ""],
    ["catch up", "slang", "", "", "to talk and update each other", "", "Let's catch up over coffee.", "work-ok", "slang", now, ""],
    ["chill", "slang", "", "", "to relax or calm down", "", "Let's just chill this weekend.", "casual", "slang", now, ""],
    ["bail", "slang", "", "", "to leave or cancel plans", "", "Sorry, I have to bail on dinner tonight.", "casual", "slang", now, ""],
    ["vibe", "slang", "", "", "a feeling or atmosphere", "", "The team has a good vibe.", "casual", "slang", now, ""],

    // ── Slang: reactions ───────────────────────────────────────────
    ["No way!", "slang", "", "", "expression of disbelief", "", "No way! That actually worked?", "casual", "slang", now, ""],
    ["For real?", "slang", "", "", "are you serious?", "", "For real? They shipped it already?", "casual", "slang", now, ""],
    ["Fair enough", "slang", "", "", "I accept that point", "", "Fair enough — let's try your approach.", "work-ok", "slang", now, ""],
    ["Makes sense", "slang", "", "", "I understand and agree", "", "Makes sense — let's go with that.", "work-ok", "slang", now, ""],
    ["Good call", "slang", "", "", "that was a good decision", "", "Good call on adding the retry logic.", "work-ok", "slang", now, ""],
    ["That's rough", "slang", "", "", "expression of sympathy", "", "Three deploys in one day? That's rough.", "casual", "slang", now, ""],
    ["Nailed it", "slang", "", "", "did it perfectly", "", "You nailed it — the demo was flawless.", "work-ok", "slang", now, ""],
    ["Spot on", "slang", "", "", "exactly right", "", "Your estimate was spot on.", "work-ok", "slang", now, ""],

    // ── Slang: idioms ──────────────────────────────────────────────
    ["a piece of cake", "slang", "", "", "something very easy", "", "The migration was a piece of cake.", "idiom", "slang", now, ""],
    ["hit the nail on the head", "slang", "", "", "to be exactly right about something", "", "You hit the nail on the head with that analysis.", "idiom", "slang", now, ""],
    ["under the weather", "slang", "", "", "feeling slightly ill", "", "I'm a bit under the weather today.", "idiom", "slang", now, ""],
    ["call it a day", "slang", "", "", "to stop working for the day", "", "Let's call it a day — we can finish tomorrow.", "idiom", "slang", now, ""],
    ["on the same page", "slang", "", "", "in agreement, sharing the same understanding", "", "Let's make sure we're on the same page.", "idiom", "slang", now, ""],
    ["the ball is in your court", "slang", "", "", "it is your turn to act or decide", "", "I've sent the proposal — the ball is in your court.", "idiom", "slang", now, ""],
    ["cut corners", "slang", "", "", "to do something carelessly to save time", "", "Don't cut corners on testing.", "idiom", "slang", now, ""],
    ["break the ice", "slang", "", "", "to start a conversation in an awkward situation", "", "He told a joke to break the ice.", "idiom", "slang", now, ""],
    ["get the ball rolling", "slang", "", "", "to start something", "", "Let's get the ball rolling on the redesign.", "idiom", "slang", now, ""],
    ["sleep on it", "slang", "", "", "to wait until tomorrow before deciding", "", "It's a big change — let me sleep on it.", "idiom", "slang", now, ""],

    // ── Slang: internet shorthand ──────────────────────────────────
    ["btw", "slang", "", "", "by the way", "", "Btw, the build is green now.", "text-only", "slang", now, ""],
    ["idk", "slang", "", "", "I don't know", "", "Idk if that approach will scale.", "text-only", "slang", now, ""],
    ["tbh", "slang", "", "", "to be honest", "", "Tbh, I prefer the first design.", "text-only", "slang", now, ""],
    ["asap", "slang", "", "", "as soon as possible", "", "Can you fix this asap?", "text-only", "slang", now, ""],
    ["fyi", "slang", "", "", "for your information", "", "Fyi, the endpoint changed.", "text-only", "slang", now, ""],
    ["lmk", "slang", "", "", "let me know", "", "Lmk when the PR is ready.", "text-only", "slang", now, ""],
    ["imo", "slang", "", "", "in my opinion", "", "Imo, we should refactor first.", "text-only", "slang", now, ""],

    // ── Collocations: make/do/take/have (tag: core) ────────────────
    ["make a decision", "collocation", "", "", "to decide", "", "We need to make a decision by Friday.", "", "core", now, ""],
    ["make progress", "collocation", "", "", "to advance toward a goal", "", "The team is making progress on the migration.", "", "core", now, ""],
    ["make an effort", "collocation", "", "", "to try hard", "", "Please make an effort to attend.", "", "core", now, ""],
    ["make a mistake", "collocation", "", "", "to do something incorrectly", "", "Everyone makes mistakes — just fix it.", "", "core", now, ""],
    ["do research", "collocation", "", "", "to investigate a topic", "", "I need to do some research before the meeting.", "", "core", now, ""],
    ["do your best", "collocation", "", "", "to try as hard as you can", "", "Just do your best — that's all we ask.", "", "core", now, ""],
    ["do someone a favour", "collocation", "", "", "to help someone out", "", "Could you do me a favour and review this?", "", "core", now, ""],
    ["take a break", "collocation", "", "", "to pause and rest", "", "Let's take a break before the next session.", "", "core", now, ""],
    ["take responsibility", "collocation", "", "", "to accept ownership", "", "I'll take responsibility for the outage.", "", "core", now, ""],
    ["take notes", "collocation", "", "", "to write down key points", "", "Can someone take notes during the meeting?", "", "core", now, ""],
    ["take turns", "collocation", "", "", "to alternate doing something", "", "Let's take turns presenting.", "", "core", now, ""],
    ["have a look", "collocation", "", "", "to examine or inspect", "", "Can you have a look at this error?", "", "core", now, ""],
    ["have a meeting", "collocation", "", "", "to attend or hold a meeting", "", "We have a meeting at 3 pm.", "", "core", now, ""],
    ["have a go", "collocation", "", "", "to try something", "", "Let me have a go at fixing it.", "", "core", now, ""],

    // ── Collocations: adjective + noun (tag: natural) ──────────────
    ["heavy rain", "collocation", "", "", "intense rainfall", "", "The event was cancelled due to heavy rain.", "", "natural", now, ""],
    ["strong coffee", "collocation", "", "", "coffee with an intense flavour", "", "I need a strong coffee this morning.", "", "natural", now, ""],
    ["high priority", "collocation", "", "", "something very important and urgent", "", "This bug is high priority.", "", "natural", now, ""],
    ["sharp increase", "collocation", "", "", "a sudden and large rise", "", "There was a sharp increase in traffic.", "", "natural", now, ""],
    ["deep understanding", "collocation", "", "", "thorough and comprehensive knowledge", "", "She has a deep understanding of the codebase.", "", "natural", now, ""],
    ["rough estimate", "collocation", "", "", "an approximate, imprecise calculation", "", "A rough estimate is about two weeks.", "", "natural", now, ""],
    ["steep learning curve", "collocation", "", "", "something difficult to learn at first", "", "Kubernetes has a steep learning curve.", "", "natural", now, ""],
    ["tight deadline", "collocation", "", "", "a deadline with very little spare time", "", "We're working against a tight deadline.", "", "natural", now, ""],
    ["broad experience", "collocation", "", "", "wide-ranging experience across many areas", "", "She has broad experience in backend systems.", "", "natural", now, ""],
    ["narrow scope", "collocation", "", "", "a limited or focused range", "", "Keep the PR to a narrow scope.", "", "natural", now, ""],

    // ── Collocations: verb + noun (tag: business) ──────────────────
    ["raise a concern", "collocation", "", "", "to bring up a worry or issue", "", "I'd like to raise a concern about the timeline.", "", "business", now, ""],
    ["meet a deadline", "collocation", "", "", "to finish before the due date", "", "We managed to meet the deadline.", "", "business", now, ""],
    ["run a test", "collocation", "", "", "to execute a test", "", "Let me run a test before merging.", "", "business", now, ""],
    ["fix a bug", "collocation", "", "", "to resolve a software defect", "", "I spent the morning fixing a bug.", "", "business", now, ""],
    ["ship a feature", "collocation", "", "", "to release a feature to users", "", "We shipped the feature on Tuesday.", "", "business", now, ""],
    ["close a deal", "collocation", "", "", "to finalise an agreement", "", "Sales just closed a deal with the enterprise client.", "", "business", now, ""],
    ["address an issue", "collocation", "", "", "to deal with a problem", "", "We need to address this issue before launch.", "", "business", now, ""],
    ["launch a product", "collocation", "", "", "to release a product publicly", "", "They plan to launch the product next quarter.", "", "business", now, ""],
    ["conduct a review", "collocation", "", "", "to carry out a formal examination", "", "Let's conduct a review of the architecture.", "", "business", now, ""],
    ["draft a proposal", "collocation", "", "", "to write an initial version of a proposal", "", "I'll draft a proposal and share it tomorrow.", "", "business", now, ""],

    // ── Collocations: adverb combos (tag: fluency) ─────────────────
    ["highly recommend", "collocation", "", "", "to strongly suggest something", "", "I highly recommend this library.", "", "fluency", now, ""],
    ["strongly suggest", "collocation", "", "", "to advise with emphasis", "", "I strongly suggest we add tests first.", "", "fluency", now, ""],
    ["deeply appreciate", "collocation", "", "", "to be very thankful", "", "I deeply appreciate your help on this.", "", "fluency", now, ""],
    ["fully understand", "collocation", "", "", "to comprehend completely", "", "I fully understand the trade-offs.", "", "fluency", now, ""],
    ["seriously consider", "collocation", "", "", "to think about something carefully", "", "We should seriously consider a rewrite.", "", "fluency", now, ""],
    ["absolutely agree", "collocation", "", "", "to agree completely", "", "I absolutely agree with that assessment.", "", "fluency", now, ""],

    // ── Sentences (tag: template) ──────────────────────────────────
    ["I just wanted to follow up on our earlier conversation.", "sentence", "", "", "polite follow-up opener", "", "", "", "template", now, ""],
    ["Could you walk me through how this works?", "sentence", "", "", "asking someone to explain step by step", "", "", "", "template", now, ""],
    ["Let me know if there's anything I can help with.", "sentence", "", "", "offering assistance", "", "", "", "template", now, ""],
    ["I'll circle back once I have more details.", "sentence", "", "", "promising to return with information", "", "", "", "template", now, ""],
    ["That's a good point — I hadn't thought of it that way.", "sentence", "", "", "acknowledging someone's insight", "", "", "", "template", now, ""],
    ["I think we're on the same page now.", "sentence", "", "", "confirming mutual understanding", "", "", "", "template", now, ""],
    ["Can we take a step back and look at the bigger picture?", "sentence", "", "", "suggesting a broader perspective", "", "", "", "template", now, ""],
    ["I'd love to get your thoughts on this.", "sentence", "", "", "inviting feedback", "", "", "", "template", now, ""],
    ["Let's table this for now and revisit it next week.", "sentence", "", "", "postponing a topic politely", "", "", "", "template", now, ""],
    ["Just to be clear, are we aligned on the next steps?", "sentence", "", "", "confirming agreement on actions", "", "", "", "template", now, ""],
    ["I appreciate you bringing this up.", "sentence", "", "", "thanking someone for raising a point", "", "", "", "template", now, ""],
    ["There might be a better way to approach this.", "sentence", "", "", "soft suggestion of an alternative", "", "", "", "template", now, ""],
    ["I'll take the action item and get back to you by Friday.", "sentence", "", "", "committing to a task with a deadline", "", "", "", "template", now, ""],
    ["The short answer is yes, but let me explain the details.", "sentence", "", "", "answering then elaborating", "", "", "", "template", now, ""],
    ["I don't have a strong opinion either way.", "sentence", "", "", "expressing neutrality on a decision", "", "", "", "template", now, ""],
    ["Would it make sense to loop in someone from the other team?", "sentence", "", "", "suggesting cross-team collaboration", "", "", "", "template", now, ""],
    ["I want to make sure I'm not missing anything.", "sentence", "", "", "double-checking for completeness", "", "", "", "template", now, ""],
    ["Let's set up a quick sync to go over the requirements.", "sentence", "", "", "proposing a short meeting", "", "", "", "template", now, ""],
    ["I think the trade-off is worth it in this case.", "sentence", "", "", "accepting a compromise", "", "", "", "template", now, ""],
    ["That's outside my area, but I can connect you with someone who knows.", "sentence", "", "", "redirecting helpfully", "", "", "", "template", now, ""],
  ];

  var startRow = lastRow < 2 ? 2 : lastRow + 1;
  sh.getRange(startRow, 1, rows.length, HEADERS.length).setValues(rows);

  // Auto-enrich single words (IPA, audio, meaning)
  run_(false);

  SpreadsheetApp.getActive().toast(
    "Added " + rows.length + " starter rows. Enrichment ran for single words.",
    "English",
    8,
  );
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
            added: r[9] ? (function() { try { return new Date(r[9]).toISOString().slice(0, 10); } catch(e) { return ""; } })() : "",
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
