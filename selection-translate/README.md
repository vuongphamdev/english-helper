# Selection Translate

A Chrome extension (Manifest V3) that translates whatever text you select, in the tab you're already in.

## Install

1. Unzip the folder somewhere permanent — Chrome reads it from disk every time it starts, so don't leave it in Downloads if you plan to keep it.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the `quick-translate` folder.
5. Pin the extension so the popup is one click away.

No API key, no sign-in. Reload any tabs that were already open before installing.

## Three modes

The panel has **Translate**, **Check**, and **Save** tabs. Translate is the default;
Check runs the selection through LanguageTool; Save writes the selection into your
Google Sheet word bank.

## Use it

- **Select text** on any page. A small button appears next to the selection — click it to see the translation.
- **Turn on "Translate as soon as I select"** in the popup if you'd rather skip the button.
- **Right-click a selection** → *Translate "…"*.
- **Alt+T** translates the current selection, **Alt+Shift+T** checks its grammar, **Alt+S** saves it. Change any of them via the popup's *Change shortcut* link.
- **Right-click a selection** → *Save "…" to my sheet* → pick word, collocation, slang, or sentence.
- In Check mode, flagged text is underlined — red for grammar and spelling, amber for style. Click a suggestion chip to apply it. If the text came from an `<input>` or `<textarea>`, the fix is written straight back into the field.
- Inside the panel: read aloud, copy, or switch the target language on the fly (it re-translates immediately and remembers the choice).
- **Esc**, a click elsewhere, or a scroll closes the panel.

Selections inside `<input>` and `<textarea>` fields work too, as do iframes.

## What's in the box

| File | Job |
| --- | --- |
| `manifest.json` | Permissions, content script registration, keyboard command |
| `background.js` | Service worker — all network calls, context menu, shortcut handling |
| `languages.js` | Translation languages, plus LanguageTool's separate list |
| `content.js` | Selection detection and the in-page panel (Shadow DOM) |
| `popup.html` / `popup.js` | Settings, scratchpad translator, and the word bank connection |

## Saving to a Google Sheet

The Save tab posts one row to an Apps Script web app bound to your own sheet. Set it up
once:

1. In the sheet: **Extensions → Apps Script**, paste in `sheet-sync.gs`, run `setUpSheet()`.
2. **Deploy → New deployment → Web app**, execute as *Me*, access *Anyone*. Copy the
   `/exec` URL.
3. Paste that URL into the extension popup under **Word bank**, then click
   *Test connection*.
4. Optional but recommended: in the sheet, **English → Set save key**, and paste the same
   key into the popup. Without one, anyone who has the URL could post rows to your sheet.

Four entry types: `vocab`, `collocation`, `slang`, `sentence`. The panel guesses from the
length of the selection — one word is a word, two to four is a collocation, longer is a
sentence — and you can override it with the chips.

What gets sent: the term, the sentence it appeared in (pulled from the surrounding text),
your note, and tags. What the sheet adds: IPA, a pronunciation audio link, and the English
definition, looked up server-side. Multi-word phrases aren't in the dictionary, so those
arrive with the meaning blank for you to fill in.

Saving the same term twice doesn't duplicate it — the second save tops up whatever was
blank and appends the new example.

The request goes out as `Content-Type: text/plain` on purpose. Anything else triggers a
CORS preflight, and Apps Script doesn't answer `OPTIONS`. The body is still JSON.

## How grammar checking works

Checks go to LanguageTool's public endpoint, `POST https://api.languagetool.org/v2/check`.
Free, no key, and it returns character offsets rather than a rewritten string — which is
why the panel can underline the exact span and offer click-to-apply fixes.

Their published limits for the free service: 20 requests per IP per minute, 75KB of text
per IP per minute, 20KB per request, and suggestions for at most 30 misspelled words.
This build caps a request at 8,000 characters. Applying a fix does **not** re-query — the
remaining offsets are shifted locally — so you can work through a whole sentence on one
request.

Two conditions LanguageTool asks of you: don't send automated requests (interactive
clicks are the intended use; a checker firing on every keystroke is not), and keep a
visible link back to languagetool.org without `rel="nofollow"`. The panel footer and the
popup both carry that link — leave them in place.

**No rate limits, nothing leaving your machine:**

```
docker run -d -p 8010:8010 erikvl87/languagetool
```

Then put `http://localhost:8010` in the popup's grammar address field. Same API, your
hardware. For a dev machine this is the better setup.

Note: LanguageTool has **no Vietnamese rule set**. Check mode covers English, German,
French, Spanish, Portuguese, Russian, Ukrainian, Japanese, Chinese and others, but not
Vietnamese — translation still handles Vietnamese fine.

## How translation works

The service worker calls Google's public `translate_a/single` endpoint (`client=gtx`). It auto-detects the source language and, for single words, returns dictionary entries grouped by part of speech — those show up under the translation.

This endpoint is the one Google's own page widget uses. It's free and needs no key, but it isn't a documented, supported API: it can rate-limit you or change shape without notice. So there's a fallback:

- If Google fails, the worker automatically retries against MyMemory and labels the result.
- You can also select MyMemory outright in the popup. It has no auto-detect, so the source language is guessed from the script the text is written in (see `guessSource` in `background.js`).

**If you want something you can rely on long-term**, swap in a paid API. Add one function in `background.js` returning `{ text, source, dict }` and add its host to `host_permissions`:

```js
async function deepl(text, target) {
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Authorization": "DeepL-Auth-Key " + KEY,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ text, target_lang: target.toUpperCase() })
  });
  const data = await res.json();
  return {
    text: data.translations[0].text,
    source: data.translations[0].detected_source_language.toLowerCase(),
    dict: null
  };
}
```

Store the key in `chrome.storage.sync` from an options page rather than hard-coding it — anything in the bundle is readable by anyone who has the folder.

## Limits worth knowing

- Content scripts can't run on `chrome://` pages, the Chrome Web Store, or other extensions' pages. Nothing will happen there.
- Text is capped at 5,000 characters per request and split into ~1,200-character chunks so URLs stay under length limits.
- Selected text is sent to a third-party translation service. Don't use it on anything confidential.
- The word bank deployment has to be readable by anyone with the URL. A save key blocks writes, but not reads.
- If you edit the extension and reload it, open tabs keep running the old content script until you refresh them.
