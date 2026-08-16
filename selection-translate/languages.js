// Shared language table. Loaded before content.js and by popup.html.
var QT_LANGUAGES = [
  { code: "vi", name: "Vietnamese" },
  { code: "en", name: "English" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "th", name: "Thai" },
  { code: "km", name: "Khmer" },
  { code: "lo", name: "Lao" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "he", name: "Hebrew" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" },
  { code: "cs", name: "Czech" },
  { code: "el", name: "Greek" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "fa", name: "Persian" },
  { code: "ta", name: "Tamil" },
  { code: "sw", name: "Swahili" }
];

var QT_LANG_NAME = function (code) {
  if (!code) return "Auto";
  var hit = QT_LANGUAGES.find(function (l) {
    return l.code.toLowerCase() === String(code).toLowerCase();
  });
  return hit ? hit.name : String(code).toUpperCase();
};

if (typeof module !== "undefined") module.exports = { QT_LANGUAGES: QT_LANGUAGES };

// LanguageTool's own list, which is not the same as the translation list.
// Vietnamese is not among them — LanguageTool has no Vietnamese rule set.
var QT_CHECK_LANGUAGES = [
  { code: "auto", name: "Detect automatically" },
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "de-DE", name: "German" },
  { code: "fr-FR", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "pl-PL", name: "Polish" },
  { code: "ru-RU", name: "Russian" },
  { code: "uk-UA", name: "Ukrainian" },
  { code: "ja-JP", name: "Japanese" },
  { code: "zh-CN", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "ca-ES", name: "Catalan" },
  { code: "da-DK", name: "Danish" },
  { code: "sv", name: "Swedish" },
  { code: "el-GR", name: "Greek" },
  { code: "ro-RO", name: "Romanian" }
];
