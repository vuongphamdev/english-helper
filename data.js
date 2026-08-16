/* =======================================================================
   English Reference — data (auto-extracted from the HTML)
   Edit this file or edit the CSV files (sections.csv / entries.csv).
   The HTML page loads this via <script src="english-data.js">.
   ======================================================================= */

const SECTIONS = [
      {
        id: "tenses", label: "Tenses", title: "The 13 tenses",
        blurb: "Time (past / present / future) crossed with aspect (simple / continuous / perfect / perfect continuous). Learn the grid, not 13 separate rules."
      },
      {
        id: "conditionals", label: "Conditionals", title: "If, and what follows",
        blurb: "Each conditional pairs a specific if-clause with a specific result-clause. Mixing the pair is the most common mistake."
      },
      {
        id: "patterns", label: "Patterns", title: "Sentence formulas",
        blurb: "Reusable structures: passive, reported speech, questions, comparatives, relative clauses. Fill the slots and the sentence works."
      },
      {
        id: "vocabulary", label: "Vocabulary", title: "Words that pull their weight",
        blurb: "Grouped by job, not alphabet. Learn the collocation, not the isolated word — you need the whole phrase to sound natural."
      },
      {
        id: "slang", label: "Slang", title: "Everyday informal English",
        blurb: "What people actually say. Register tags tell you where each one is safe: casual with friends, or fine at work too."
      },
      {
        id: "collocations", label: "Collocations", title: "Words that travel together",
        blurb: "Pairings native speakers use without thinking: make a decision, heavy rain, take responsibility. Getting these right does more for fluency than more vocabulary."
      },
      {
        id: "sentences", label: "Sentences", title: "Sentences worth keeping",
        blurb: "Lines you liked and wrote down. Whole sentences stick better than single words \u2014 you keep the grammar, the collocation, and the rhythm together."
      },
      {
        id: "sounds", label: "Pronunciation", title: "Sounds and spelling",
        blurb: "The rules that are actually rules: -ed endings, -s endings, word stress, the schwa. Plus the sounds that trip up most learners."
      }
    ];

const ENTRIES = [

      /* ---------------------------- TENSES ---------------------------- */
      {
        section: "tenses", group: "Present", eyebrow: "Present · simple", title: "Present Simple",
        use: "Facts, habits, routines, timetables, and states that are generally true.",
        patterns: [
          { sign: "+", f: "S + V(<b>s/es</b> for he/she/it)" },
          { sign: "\u2212", f: "S + <b>do/does not</b> + V(bare)" },
          { sign: "?", f: "<b>Do/Does</b> + S + V(bare) ?" }
        ],
        signals: ["always", "usually", "often", "every day", "on Mondays", "rarely", "never"],
        examples: ["Water boils at 100 degrees.", "I work as a developer.", "She catches the 7:40 bus.", "The train leaves at six tomorrow. <i>(timetable = present simple for future)</i>"],
        fixes: [{ bad: "He don't like coffee.", good: "He doesn't like coffee." }, { bad: "Does she works here?", good: "Does she work here?" }]
      },

      {
        section: "tenses", group: "Present", eyebrow: "Present · continuous", title: "Present Continuous",
        use: "Happening right now, happening around now, a temporary situation, or a fixed future arrangement.",
        patterns: [
          { sign: "+", f: "S + <b>am/is/are</b> + V-<b>ing</b>" },
          { sign: "\u2212", f: "S + <b>am/is/are not</b> + V-ing" },
          { sign: "?", f: "<b>Am/Is/Are</b> + S + V-ing ?" }
        ],
        signals: ["now", "right now", "at the moment", "currently", "this week", "tonight"],
        examples: ["I am reading a book about grammar.", "We are living in Da Nang for a year. <i>(temporary)</i>", "She is meeting the client at nine. <i>(arrangement)</i>", "You are always losing your keys! <i>(always + continuous = mild complaint)</i>"],
        fixes: [{ bad: "I am knowing the answer.", good: "I know the answer. (state verbs take simple)" }, { bad: "He is work now.", good: "He is working now." }]
      },

      {
        section: "tenses", group: "Present", eyebrow: "Present · perfect", title: "Present Perfect",
        use: "A past action with a present result, life experience with no stated time, or something unfinished that continues to now.",
        patterns: [
          { sign: "+", f: "S + <b>have/has</b> + V3 (past participle)" },
          { sign: "\u2212", f: "S + <b>have/has not</b> + V3" },
          { sign: "?", f: "<b>Have/Has</b> + S + V3 ?" }
        ],
        signals: ["already", "yet", "just", "ever", "never", "since 2019", "for two years", "so far", "recently"],
        examples: ["I have finished the report. <i>(it is done now)</i>", "Have you ever been to Japan?", "She has worked here since 2019. <i>(still works here)</i>", "They haven't replied yet."],
        fixes: [{ bad: "I have seen him yesterday.", good: "I saw him yesterday. (a finished time needs past simple)" }, { bad: "I have went there.", good: "I have gone there." }]
      },

      {
        section: "tenses", group: "Present", eyebrow: "Present · perfect continuous", title: "Present Perfect Continuous",
        use: "An activity that started in the past and is still going, with the focus on duration — or on the visible result of that activity.",
        patterns: [
          { sign: "+", f: "S + <b>have/has been</b> + V-<b>ing</b>" },
          { sign: "\u2212", f: "S + <b>have/has not been</b> + V-ing" },
          { sign: "?", f: "<b>Have/Has</b> + S + <b>been</b> + V-ing ?" }
        ],
        signals: ["for", "since", "all day", "lately", "how long"],
        examples: ["I have been waiting for an hour.", "How long have you been learning English?", "It has been raining — the roads are wet.", "She has been coding all morning."],
        fixes: [{ bad: "I have been knowing her for years.", good: "I have known her for years." }]
      },

      {
        section: "tenses", group: "Past", eyebrow: "Past · simple", title: "Past Simple",
        use: "A finished action at a finished time. The default tense for telling a story.",
        patterns: [
          { sign: "+", f: "S + V2 (V-<b>ed</b> or irregular)" },
          { sign: "\u2212", f: "S + <b>did not</b> + V(bare)" },
          { sign: "?", f: "<b>Did</b> + S + V(bare) ?" }
        ],
        signals: ["yesterday", "last night", "in 2020", "two days ago", "when I was a child"],
        examples: ["I deployed the fix yesterday.", "She didn't call me back.", "Did you see that email?", "We lived in Hanoi for three years. <i>(we don't anymore)</i>"],
        fixes: [{ bad: "I didn't went home.", good: "I didn't go home. (did already carries the past)" }, { bad: "Where you went?", good: "Where did you go?" }]
      },

      {
        section: "tenses", group: "Past", eyebrow: "Past · continuous", title: "Past Continuous",
        use: "An action in progress at a past moment — usually the background that a shorter past simple action interrupts.",
        patterns: [
          { sign: "+", f: "S + <b>was/were</b> + V-<b>ing</b>" },
          { sign: "\u2212", f: "S + <b>was/were not</b> + V-ing" },
          { sign: "?", f: "<b>Was/Were</b> + S + V-ing ?" },
          { sign: "\u25B8", f: "<b>While</b> + past continuous, <b>when</b> + past simple" }
        ],
        signals: ["while", "when", "at 8pm last night", "all evening"],
        examples: ["I was cooking when the power went out.", "They were arguing all evening.", "What were you doing at midnight?", "While she was driving, he was sleeping."],
        fixes: [{ bad: "I was cook dinner.", good: "I was cooking dinner." }]
      },

      {
        section: "tenses", group: "Past", eyebrow: "Past · perfect", title: "Past Perfect",
        use: "The earlier of two past events. Use it to make the order clear when you aren't telling things in order.",
        patterns: [
          { sign: "+", f: "S + <b>had</b> + V3" },
          { sign: "\u2212", f: "S + <b>had not</b> + V3" },
          { sign: "?", f: "<b>Had</b> + S + V3 ?" }
        ],
        signals: ["before", "after", "by the time", "already", "until then"],
        examples: ["The train had left before we arrived.", "I had never seen snow until I moved.", "By the time she called, I had already fixed it.", "He couldn't log in because he had forgotten his password."],
        fixes: [{ bad: "When I arrived, he already left.", good: "When I arrived, he had already left." }]
      },

      {
        section: "tenses", group: "Past", eyebrow: "Past · perfect continuous", title: "Past Perfect Continuous",
        use: "An activity that had been running for a while before another past moment. Focus on how long.",
        patterns: [
          { sign: "+", f: "S + <b>had been</b> + V-<b>ing</b>" },
          { sign: "\u2212", f: "S + <b>had not been</b> + V-ing" },
          { sign: "?", f: "<b>Had</b> + S + <b>been</b> + V-ing ?" }
        ],
        signals: ["for", "since", "all day", "before that"],
        examples: ["We had been driving for six hours when the car broke down.", "She was tired because she had been studying all night.", "How long had they been dating before the wedding?"]
      },

      {
        section: "tenses", group: "Future", eyebrow: "Future · will", title: "Future Simple (will)",
        use: "Decisions made at the moment of speaking, predictions, promises, offers, and refusals.",
        patterns: [
          { sign: "+", f: "S + <b>will</b> + V(bare)" },
          { sign: "\u2212", f: "S + <b>will not / won't</b> + V(bare)" },
          { sign: "?", f: "<b>Will</b> + S + V(bare) ?" }
        ],
        signals: ["tomorrow", "next week", "probably", "I think", "in the future"],
        examples: ["I'll help you with that. <i>(offer, decided now)</i>", "It will rain later.", "I won't tell anyone. <i>(promise)</i>", "The door won't open. <i>(refusal — even for objects)</i>"],
        fixes: [{ bad: "I will to call you.", good: "I will call you." }, { bad: "When I will arrive, I'll text.", good: "When I arrive, I'll text. (no will after time words)" }]
      },

      {
        section: "tenses", group: "Future", eyebrow: "Future · going to", title: "Future — be going to",
        use: "A plan or intention decided before now, or a prediction based on evidence you can see right now.",
        patterns: [
          { sign: "+", f: "S + <b>am/is/are going to</b> + V(bare)" },
          { sign: "\u2212", f: "S + <b>am/is/are not going to</b> + V" },
          { sign: "?", f: "<b>Am/Is/Are</b> + S + <b>going to</b> + V ?" },
          { sign: "\u25B8", f: "<b>will</b> = decided now &nbsp;\u2022&nbsp; <b>going to</b> = decided before" }
        ],
        examples: ["I'm going to start a new course next month. <i>(already planned)</i>", "Look at those clouds — it's going to pour.", "Are you going to apply for the job?"],
        fixes: [{ bad: "I'm going to sneeze — I'll get a tissue.", good: "correct as written: prediction + instant decision." }]
      },

      {
        section: "tenses", group: "Future", eyebrow: "Future · continuous", title: "Future Continuous",
        use: "An action that will be in progress at a specific future time — or a polite, neutral way to ask about someone's plans.",
        patterns: [
          { sign: "+", f: "S + <b>will be</b> + V-<b>ing</b>" },
          { sign: "\u2212", f: "S + <b>won't be</b> + V-ing" },
          { sign: "?", f: "<b>Will</b> + S + <b>be</b> + V-ing ?" }
        ],
        signals: ["at 8pm tomorrow", "this time next week", "all morning"],
        examples: ["This time next week I'll be flying to Seoul.", "Don't call at seven — I'll be driving.", "Will you be using the meeting room?"]
      },

      {
        section: "tenses", group: "Future", eyebrow: "Future · perfect", title: "Future Perfect",
        use: "Something that will already be complete before a deadline in the future.",
        patterns: [
          { sign: "+", f: "S + <b>will have</b> + V3" },
          { sign: "\u2212", f: "S + <b>won't have</b> + V3" },
          { sign: "?", f: "<b>Will</b> + S + <b>have</b> + V3 ?" }
        ],
        signals: ["by then", "by Friday", "by the time", "before"],
        examples: ["By Friday I will have finished the migration.", "She'll have left by the time you get there.", "We won't have heard back before the deadline."]
      },

      {
        section: "tenses", group: "Future", eyebrow: "Future · perfect continuous", title: "Future Perfect Continuous",
        use: "How long something will have been going on, measured up to a future point. Rare, but worth recognising.",
        patterns: [
          { sign: "+", f: "S + <b>will have been</b> + V-<b>ing</b>" },
          { sign: "?", f: "<b>Will</b> + S + <b>have been</b> + V-ing ?" }
        ],
        signals: ["by then", "for + duration"],
        examples: ["In June I will have been working here for five years.", "By midnight we'll have been debugging for twelve hours."]
      },

      /* ------------------------- CONDITIONALS ------------------------- */
      {
        section: "conditionals", eyebrow: "Type 0", title: "Zero Conditional",
        use: "A general truth or an automatic result. Both clauses are present simple — no if about it, really.",
        patterns: [{ sign: "\u25B8", f: "<b>If</b> + present simple, <b>+</b> present simple" }, { sign: "\u25B8", f: "<b>When</b> works just as well as <b>if</b> here" }],
        examples: ["If you heat ice, it melts.", "If the build fails, the pipeline stops.", "When I drink coffee at night, I can't sleep."]
      },

      {
        section: "conditionals", eyebrow: "Type 1", title: "First Conditional",
        use: "A real, likely future possibility and its consequence.",
        patterns: [{ sign: "\u25B8", f: "<b>If</b> + present simple, <b>will</b> + V(bare)" }, { sign: "\u25B8", f: "Swap <b>will</b> for <b>may / might / can / should / must</b> to change certainty" }],
        examples: ["If it rains, we'll cancel the trip.", "If you push that branch, the tests will run.", "If she calls, tell her I'm out. <i>(imperative result)</i>", "If you finish early, you can leave."],
        fixes: [{ bad: "If it will rain, we'll cancel.", good: "If it rains, we'll cancel." }]
      },

      {
        section: "conditionals", eyebrow: "Type 2", title: "Second Conditional",
        use: "An unreal or unlikely present situation — imagining, hypothesising, giving advice.",
        patterns: [{ sign: "\u25B8", f: "<b>If</b> + past simple, <b>would</b> + V(bare)" }, { sign: "\u25B8", f: "Advice frame: <b>If I were you, I would</b> \u2026" }],
        examples: ["If I had more time, I would learn the guitar.", "If I were you, I'd take the offer.", "What would you do if you won the lottery?", "If we hired one more engineer, we could ship faster."],
        fixes: [{ bad: "If I would have money, I would travel.", good: "If I had money, I would travel." }, { bad: "If he was taller\u2026", good: "If he were taller\u2026 (were is standard for all persons here)" }]
      },

      {
        section: "conditionals", eyebrow: "Type 3", title: "Third Conditional",
        use: "An imagined past — something that did not happen, and its imagined result. Regret, blame, relief.",
        patterns: [{ sign: "\u25B8", f: "<b>If</b> + had + V3, <b>would have</b> + V3" }, { sign: "\u25B8", f: "Formal inversion: <b>Had</b> I known, I would have \u2026" }],
        examples: ["If I had studied harder, I would have passed.", "If we had left earlier, we wouldn't have missed the flight.", "She would have called if she had known.", "Had I known it was urgent, I'd have replied sooner."],
        fixes: [{ bad: "If I would have known\u2026", good: "If I had known\u2026" }]
      },

      {
        section: "conditionals", eyebrow: "Mixed", title: "Mixed Conditionals",
        use: "When the if-clause and the result belong to different times. Two combinations do almost all the work.",
        patterns: [
          { sign: "3\u21922", f: "<b>If</b> + had + V3, <b>would</b> + V &nbsp;\u2014 past cause, present result" },
          { sign: "2\u21923", f: "<b>If</b> + past simple, <b>would have</b> + V3 &nbsp;\u2014 present cause, past result" }
        ],
        examples: ["If I had saved money, I would be on holiday now.", "If she had taken the job, she'd be living in Tokyo.", "If I weren't so shy, I would have asked her out.", "If he were more careful, he wouldn't have broken it."]
      },

      {
        section: "conditionals", eyebrow: "Related", title: "Wish / If only",
        use: "Regret and desire. The tense goes one step further back than the time you mean.",
        patterns: [
          { sign: "now", f: "<b>wish</b> + past simple &nbsp;\u2014 about the present" },
          { sign: "past", f: "<b>wish</b> + had + V3 &nbsp;\u2014 about the past" },
          { sign: "annoy", f: "<b>wish</b> + would + V &nbsp;\u2014 someone else's irritating habit" }
        ],
        examples: ["I wish I spoke Spanish. <i>(I don't)</i>", "I wish I had gone to that meeting. <i>(I didn't)</i>", "I wish you would stop interrupting.", "If only I knew the answer!"],
        fixes: [{ bad: "I wish I would speak Spanish.", good: "I wish I spoke Spanish." }]
      },

      {
        section: "conditionals", eyebrow: "Related", title: "Unless, in case, as long as",
        use: "Other ways to set a condition, each with its own logic.",
        patterns: [
          { sign: "\u2260", f: "<b>unless</b> = if not \u2014 the exception that stops the result" },
          { sign: "\u2192", f: "<b>in case</b> = because it might happen (prepare in advance)" },
          { sign: "=", f: "<b>as long as / provided that</b> = only on this condition" }
        ],
        examples: ["I won't go unless you come with me.", "Take an umbrella in case it rains. <i>(not: if it rains)</i>", "You can borrow it as long as you return it tomorrow.", "Provided that the tests pass, we ship on Friday."],
        fixes: [{ bad: "Unless you don't hurry, we'll be late.", good: "Unless you hurry, we'll be late." }]
      },

      /* --------------------------- PATTERNS --------------------------- */
      {
        section: "patterns", group: "Core structures", eyebrow: "Voice", title: "The Passive",
        use: "Move the focus onto the thing affected, or leave out who did it because it's unknown or unimportant.",
        patterns: [
          { sign: "\u25B8", f: "Object + <b>be</b> (in the original tense) + V3 (+ <b>by</b> + agent)" },
          { sign: "\u25B8", f: "present: <b>is/are</b> V3 \u2022 past: <b>was/were</b> V3 \u2022 perfect: <b>has been</b> V3 \u2022 modal: <b>will/can be</b> V3" }
        ],
        examples: ["The bug was fixed last night.", "This module is used by three services.", "The report has been sent.", "Your request will be reviewed within 24 hours."],
        fixes: [{ bad: "The email was send.", good: "The email was sent." }]
      },

      {
        section: "patterns", group: "Core structures", eyebrow: "Reporting", title: "Reported Speech",
        use: "Telling someone what another person said. The tense usually shifts one step back.",
        patterns: [
          { sign: "\u2193", f: "present \u2192 past &nbsp;\u2022&nbsp; past \u2192 past perfect &nbsp;\u2022&nbsp; will \u2192 would &nbsp;\u2022&nbsp; can \u2192 could" },
          { sign: "say", f: "S + <b>said (that)</b> + clause &nbsp;\u2014 no person after <b>said</b>" },
          { sign: "tell", f: "S + <b>told me (that)</b> + clause &nbsp;\u2014 always a person after <b>told</b>" },
          { sign: "?", f: "He asked <b>if/whether</b> + S + V &nbsp;\u2014 statement word order, no <b>do</b>" }
        ],
        examples: ["\u201cI'm tired.\u201d \u2192 She said she was tired.", "\u201cI'll call you.\u201d \u2192 He said he would call me.", "\u201cDo you work here?\u201d \u2192 She asked if I worked there.", "\u201cClose the door.\u201d \u2192 He told me to close the door."],
        fixes: [{ bad: "He said me he was busy.", good: "He told me he was busy." }, { bad: "She asked where did I live.", good: "She asked where I lived." }]
      },

      {
        section: "patterns", group: "Core structures", eyebrow: "Questions", title: "Question formation",
        use: "English questions need an auxiliary verb, and it moves in front of the subject.",
        patterns: [
          { sign: "y/n", f: "<b>Aux</b> + S + V ? &nbsp;\u2014 Do / Does / Did / Is / Are / Have / Will / Can" },
          { sign: "wh", f: "<b>Wh-</b> + aux + S + V ? &nbsp;\u2014 What / Where / When / Why / How" },
          { sign: "subj", f: "<b>Who / What</b> + V ? &nbsp;\u2014 no auxiliary when asking about the subject" },
          { sign: "tag", f: "positive sentence, <b>negative tag</b>? &nbsp;\u2014 and the reverse" }
        ],
        examples: ["Did you send the invoice?", "Where does she live?", "Who called you? <i>(not: who did call)</i>", "You're coming, aren't you?", "He can't drive, can he?"],
        fixes: [{ bad: "Why you are late?", good: "Why are you late?" }]
      },

      {
        section: "patterns", group: "Core structures", eyebrow: "Clauses", title: "Relative clauses",
        use: "Add information about a noun. Whether you need commas changes the meaning.",
        patterns: [
          { sign: "who", f: "people &nbsp;\u2022&nbsp; <b>which</b> things &nbsp;\u2022&nbsp; <b>that</b> either &nbsp;\u2022&nbsp; <b>whose</b> possession &nbsp;\u2022&nbsp; <b>where</b> places" },
          { sign: "def", f: "defining (no commas) \u2014 the clause identifies which one" },
          { sign: "non", f: "non-defining (<b>, which \u2026 ,</b>) \u2014 extra information; never use <b>that</b>" }
        ],
        examples: ["The engineer who wrote this left the company.", "My laptop, which I bought last year, is already slow.", "That's the caf\u00e9 where we met.", "She's the one whose PR broke the build."],
        fixes: [{ bad: "My brother, that lives in Hue, is a chef.", good: "My brother, who lives in Hue, is a chef." }]
      },

      {
        section: "patterns", group: "Verb patterns", eyebrow: "Verb + verb", title: "Gerund or infinitive",
        use: "When one verb follows another, the first verb decides the form of the second. This is memorised, not derived.",
        patterns: [
          { sign: "-ing", f: "enjoy, avoid, finish, mind, suggest, keep, practise, consider, miss + <b>V-ing</b>" },
          { sign: "to", f: "want, need, decide, hope, promise, agree, learn, offer, refuse + <b>to V</b>" },
          { sign: "both", f: "start, begin, continue, like, love, hate + <b>either</b>, same meaning" },
          { sign: "\u2260", f: "stop / remember / forget / try change meaning with each form" }
        ],
        examples: ["I enjoy working from home.", "She decided to leave early.", "He stopped smoking. <i>(quit)</i> / He stopped to smoke. <i>(paused in order to)</i>", "Remember to lock the door. / I remember locking the door."],
        fixes: [{ bad: "I look forward to hear from you.", good: "I look forward to hearing from you. (to is a preposition here)" }]
      },

      {
        section: "patterns", group: "Verb patterns", eyebrow: "Modals", title: "Modal verbs",
        use: "One word that changes the whole attitude of the sentence: obligation, ability, permission, probability.",
        patterns: [
          { sign: "\u25B8", f: "S + <b>modal</b> + V(bare) &nbsp;\u2014 never <b>to</b>, never <b>-s</b>" },
          { sign: "must", f: "strong obligation \u2022 <b>have to</b> external rule \u2022 <b>should</b> advice \u2022 <b>might</b> possibility" },
          { sign: "\u2260", f: "<b>mustn't</b> = forbidden &nbsp;\u2260&nbsp; <b>don't have to</b> = not necessary" },
          { sign: "past", f: "modal + <b>have</b> + V3 = looking back: should have, must have, could have" }
        ],
        examples: ["You must wear a helmet.", "You don't have to come — it's optional.", "She might be in a meeting.", "I should have replied sooner.", "That must have been expensive."],
        fixes: [{ bad: "He must to go.", good: "He must go." }, { bad: "She cans swim.", good: "She can swim." }]
      },

      {
        section: "patterns", group: "Verb patterns", eyebrow: "Habits", title: "used to / be used to / get used to",
        use: "Three phrases that look alike and mean completely different things.",
        patterns: [
          { sign: "1", f: "<b>used to</b> + V(bare) = a past habit that stopped" },
          { sign: "2", f: "<b>be used to</b> + V-ing / noun = accustomed to it now" },
          { sign: "3", f: "<b>get used to</b> + V-ing / noun = becoming accustomed" }
        ],
        examples: ["I used to smoke, but I quit.", "I'm used to working late.", "She's getting used to the traffic here.", "Did you use to live in Hanoi? <i>(no -d after did)</i>"],
        fixes: [{ bad: "I'm used to work late.", good: "I'm used to working late." }]
      },

      {
        section: "patterns", group: "Verb patterns", eyebrow: "Causatives", title: "Have / get something done",
        use: "Someone else does the work for you. The focus is on the result, not the worker.",
        patterns: [
          { sign: "\u25B8", f: "S + <b>have/get</b> + <i>object</i> + <b>V3</b>" },
          { sign: "\u25B8", f: "S + <b>have</b> + <i>person</i> + <b>V(bare)</b> &nbsp;/&nbsp; <b>get</b> + <i>person</i> + <b>to V</b>" }
        ],
        examples: ["I had my laptop repaired.", "We're getting the office repainted.", "She had her assistant book the flights.", "I got my brother to help me move."],
        fixes: [{ bad: "I cut my hair yesterday. <i>(if a barber did it)</i>", good: "I had my hair cut yesterday." }]
      },

      {
        section: "patterns", group: "Comparison & degree", eyebrow: "Comparison", title: "Comparatives and superlatives",
        use: "More, less, most. The rule depends on how many syllables the adjective has.",
        patterns: [
          { sign: "1", f: "short adj + <b>-er / the -est</b> &nbsp;\u2014 tall \u2192 taller \u2192 the tallest" },
          { sign: "3+", f: "<b>more / the most</b> + long adj &nbsp;\u2014 expensive \u2192 more expensive" },
          { sign: "=", f: "<b>as</b> + adj + <b>as</b> &nbsp;\u2014 equality" },
          { sign: "!", f: "irregular: good\u2192better\u2192best, bad\u2192worse\u2192worst, far\u2192further\u2192furthest" }
        ],
        examples: ["This route is faster than the other one.", "It's the most useful tool I've found.", "She's as tall as her sister.", "The more you practise, the easier it gets."],
        fixes: [{ bad: "more better", good: "better" }, { bad: "He is taller then me.", good: "He is taller than me." }]
      },

      {
        section: "patterns", group: "Comparison & degree", eyebrow: "Degree", title: "too / enough / so / such",
        use: "Saying there is more than you want, or not as much as you need — and adding emphasis.",
        patterns: [
          { sign: "too", f: "<b>too</b> + adj (+ <b>for</b> sb) (+ <b>to</b> V) = more than is acceptable" },
          { sign: "eno", f: "adj + <b>enough</b> &nbsp;/&nbsp; <b>enough</b> + noun = the amount you need" },
          { sign: "so", f: "<b>so</b> + adj/adv (+ <b>that</b> + result)" },
          { sign: "such", f: "<b>such</b> (+ a/an) + adj + <b>noun</b> (+ that + result)" }
        ],
        examples: ["This coffee is too hot to drink.", "He isn't old enough to vote.", "We don't have enough time.", "It was so cold that the pipes froze.", "She's such a good listener."],
        fixes: [{ bad: "It was so a long day.", good: "It was such a long day." }]
      },

      {
        section: "patterns", group: "Nouns & determiners", eyebrow: "Articles", title: "a / an / the / zero",
        use: "The single hardest thing for learners whose language has no articles. Two questions decide it.",
        patterns: [
          { sign: "1", f: "Is it specific for the listener? \u2192 <b>the</b>" },
          { sign: "2", f: "If not: countable singular \u2192 <b>a/an</b> &nbsp;\u2022&nbsp; plural or uncountable \u2192 <b>no article</b>" },
          { sign: "an", f: "<b>an</b> before a vowel <i>sound</i>: an hour, a university" },
          { sign: "\u2205", f: "no article with general plurals, meals, languages, most countries" }
        ],
        examples: ["I bought a laptop. The laptop was expensive. <i>(second mention = the)</i>", "Dogs are loyal. <i>(dogs in general)</i>", "She plays the piano but plays football.", "I have breakfast at seven."],
        fixes: [{ bad: "I am developer.", good: "I am a developer." }, { bad: "The life is hard.", good: "Life is hard." }]
      },

      {
        section: "patterns", group: "Nouns & determiners", eyebrow: "Quantity", title: "Countable and uncountable",
        use: "Whether a noun can be counted decides which quantity words you can use with it.",
        patterns: [
          { sign: "C", f: "<b>many / few / a few / a number of</b> + plural countable" },
          { sign: "U", f: "<b>much / little / a little / an amount of</b> + uncountable" },
          { sign: "C+U", f: "<b>some / any / a lot of / plenty of / no</b> + either" },
          { sign: "\u25B8", f: "count uncountables with a container: <b>a piece of</b> advice, <b>two cups of</b> coffee" }
        ],
        examples: ["How many emails did you get?", "How much time do we have?", "There's a lot of information here.", "Let me give you a piece of advice."],
        fixes: [{ bad: "He gave me many advices.", good: "He gave me a lot of advice." }, { bad: "I have few money.", good: "I have little money." }]
      },

      {
        section: "patterns", group: "Nouns & determiners", eyebrow: "Existence", title: "There is / There are",
        use: "Introducing that something exists. The verb agrees with the noun that comes after it.",
        patterns: [
          { sign: "+", f: "<b>There is</b> + singular/uncountable &nbsp;\u2022&nbsp; <b>There are</b> + plural" },
          { sign: "t", f: "changes tense freely: <b>there was, there will be, there has been</b>" }
        ],
        examples: ["There is a problem with the deploy.", "There are three tickets left.", "There was nobody at the desk.", "There have been several complaints."],
        fixes: [{ bad: "It has a mistake in the code.", good: "There is a mistake in the code." }]
      },

      {
        section: "patterns", group: "Joining ideas", eyebrow: "Connectors", title: "Linking words",
        use: "The joints of a paragraph. Choosing the right one shows the reader how your ideas relate.",
        patterns: [
          { sign: "+", f: "adding: <b>moreover, in addition, besides, furthermore</b>" },
          { sign: "\u2212", f: "contrast: <b>however, although, whereas, even though, nevertheless</b>" },
          { sign: "\u2192", f: "cause/result: <b>because, since, therefore, as a result, so</b>" },
          { sign: "\u2026", f: "sequence: <b>first, then, after that, meanwhile, finally</b>" }
        ],
        examples: ["Although the tests passed, the feature was broken.", "The API was slow; therefore, we added a cache.", "She's fluent in three languages. Moreover, she's learning a fourth.", "I like the design, whereas my manager prefers the old one."],
        fixes: [{ bad: "Although it was late, but we continued.", good: "Although it was late, we continued." }]
      },

      {
        section: "patterns", group: "Joining ideas", eyebrow: "Word order", title: "Adjective order",
        use: "Native speakers follow this order without knowing it. Break it and the sentence sounds wrong even though every word is right.",
        patterns: [{ sign: "\u25B8", f: "opinion \u2192 size \u2192 age \u2192 shape \u2192 colour \u2192 origin \u2192 material \u2192 purpose \u2192 <b>NOUN</b>" }],
        examples: ["a lovely little old round brown Italian leather riding boot", "a beautiful large wooden desk", "an ugly old plastic chair"],
        fixes: [{ bad: "a leather brown big bag", good: "a big brown leather bag" }]
      },

      /* -------------------------- VOCABULARY -------------------------- */
      {
        section: "vocabulary", group: "Foundations", eyebrow: "Set 01", title: "Everyday verbs you'll use hourly",
        use: "Learn these with the words that naturally follow them, not alone.",
        terms: [
          { t: "take", d: "take a break, take a shower, take a photo, take the bus, take care of" },
          { t: "make", d: "make a decision, make a mistake, make dinner, make sure, make progress" },
          { t: "do", d: "do the dishes, do homework, do research, do business, do your best" },
          { t: "get", d: "get up, get home, get tired, get a job, get in touch" },
          { t: "have", d: "have breakfast, have a look, have a meeting, have fun, have time" },
          { t: "go", d: "go home, go shopping, go for a walk, go wrong, go through" }
        ],
        examples: ["Make vs do: you <i>make</i> a decision but <i>do</i> a task. There is no rule — collect the pairs."]
      },

      {
        section: "vocabulary", group: "Foundations", eyebrow: "Set 02", title: "Confusing pairs",
        use: "Words learners mix up constantly. Fix these and your English immediately sounds more careful.",
        terms: [
          { t: "say / tell", d: "say something; tell someone something.", ex: "He said hello. He told me the news." },
          { t: "lend / borrow", d: "lend = give out; borrow = take in.", ex: "Can you lend me $10? I want to borrow your charger." },
          { t: "bring / take", d: "bring = toward the speaker; take = away.", ex: "Bring it here. Take it with you." },
          { t: "remember / remind", d: "you remember; something reminds you.", ex: "Remind me to call her." },
          { t: "affect / effect", d: "affect = verb; effect = noun.", ex: "It affected sales. It had an effect." },
          { t: "fun / funny", d: "fun = enjoyable; funny = makes you laugh (or strange).", ex: "The party was fun. The joke was funny." },
          { t: "boring / bored", d: "-ing describes the thing; -ed describes the person.", ex: "The lecture was boring, so I was bored." },
          { t: "since / for", d: "since + a point in time; for + a duration.", ex: "since Monday / for three days" }
        ]
      },

      {
        section: "vocabulary", group: "Working English", eyebrow: "Set 03", title: "Work and meetings",
        use: "Phrases that carry most professional conversations.",
        terms: [
          { t: "follow up", d: "contact again about something.", ex: "I'll follow up with the client tomorrow." },
          { t: "reach out", d: "make first contact.", ex: "Feel free to reach out if anything is unclear." },
          { t: "circle back", d: "return to a topic later.", ex: "Let's circle back to this after the demo." },
          { t: "align on", d: "agree about.", ex: "We need to align on the deadline." },
          { t: "a heads-up", d: "advance warning.", ex: "Thanks for the heads-up about the outage." },
          { t: "take ownership of", d: "accept responsibility for.", ex: "She took ownership of the migration." },
          { t: "bandwidth", d: "available time and capacity.", ex: "I don't have the bandwidth this week." },
          { t: "blocker", d: "something stopping progress.", ex: "The API key is my only blocker." },
          { t: "looping in", d: "adding someone to a conversation.", ex: "Looping in Mai, who owns this service." }
        ]
      },

      {
        section: "vocabulary", group: "Working English", eyebrow: "Set 04", title: "Sounding polite and indirect",
        use: "Direct English can sound rude. These softeners do most of the diplomatic work.",
        terms: [
          { t: "Could you possibly \u2026", d: "a request that is easy to refuse.", ex: "Could you possibly review this today?" },
          { t: "I was wondering if \u2026", d: "a very soft ask.", ex: "I was wondering if you had a moment." },
          { t: "Would it be possible to \u2026", d: "formal request.", ex: "Would it be possible to move the meeting?" },
          { t: "I'm afraid \u2026", d: "introduces bad news gently.", ex: "I'm afraid we can't make that deadline." },
          { t: "That's a fair point, but \u2026", d: "disagreeing respectfully.", ex: "That's a fair point, but the cost worries me." },
          { t: "It might be worth \u2026", d: "a suggestion without pressure.", ex: "It might be worth checking the logs first." },
          { t: "Just to clarify \u2026", d: "asking again without blaming.", ex: "Just to clarify, do you need this by Friday?" }
        ]
      },

      {
        section: "vocabulary", group: "Expression", eyebrow: "Set 05", title: "Feelings beyond good and bad",
        use: "Replace <i>very happy</i> and <i>very tired</i> with one precise word.",
        terms: [
          { t: "delighted", d: "very pleased.", ex: "I'm delighted to hear that." },
          { t: "relieved", d: "glad a worry has ended.", ex: "I was relieved when the tests passed." },
          { t: "frustrated", d: "annoyed at being blocked.", ex: "I'm frustrated with this bug." },
          { t: "overwhelmed", d: "too much to handle.", ex: "I feel overwhelmed by the workload." },
          { t: "exhausted", d: "extremely tired.", ex: "I'm exhausted after that deploy." },
          { t: "anxious", d: "worried about something ahead.", ex: "She's anxious about the interview." },
          { t: "grateful", d: "thankful.", ex: "I'm grateful for your help." },
          { t: "confident", d: "sure of yourself.", ex: "He's confident about the launch." }
        ]
      },

      {
        section: "vocabulary", group: "Expression", eyebrow: "Set 06", title: "Phrasal verbs, high frequency",
        use: "Verb + particle, meaning something new. Some can split around the object; some can't.",
        terms: [
          { t: "look up", d: "search for information. <i>separable</i>", ex: "Look it up in the docs." },
          { t: "figure out", d: "solve or understand. <i>separable</i>", ex: "I figured out the problem." },
          { t: "give up", d: "quit.", ex: "Don't give up now." },
          { t: "put off", d: "postpone. <i>separable</i>", ex: "They put the meeting off again." },
          { t: "run into", d: "meet by chance / encounter a problem.", ex: "I ran into an error." },
          { t: "come up with", d: "invent, think of.", ex: "She came up with a better approach." },
          { t: "turn down", d: "refuse, or lower. <i>separable</i>", ex: "He turned down the offer." },
          { t: "get along with", d: "have a good relationship.", ex: "I get along with my team." },
          { t: "sort out", d: "fix or organise. <i>separable</i>", ex: "I'll sort it out this afternoon." }
        ],
        fixes: [{ bad: "I looked up it.", good: "I looked it up. (pronouns go in the middle)" }]
      },

      /* ----------------------------- SLANG ---------------------------- */
      {
        section: "slang", eyebrow: "Register guide", title: "How to read the tags",
        use: "Slang is fast, friendly, and easy to get wrong. Use the tag to decide where a phrase is safe.",
        terms: [
          { t: "CASUAL", d: "friends, group chats, games. Not in an email to a client." },
          { t: "WORK-OK", d: "common in informal offices and Slack. Safe with colleagues." },
          { t: "CAREFUL", d: "can sound rude, sarcastic, or too familiar depending on tone." }
        ],
        examples: ["Rule of thumb: understand all slang, but only produce what you've heard a colleague use first."]
      },

      {
        section: "slang", eyebrow: "Everyday", title: "Daily conversation slang",
        terms: [
          { t: "hang out", reg: "work-ok", d: "spend time casually.", ex: "We hung out at the beach." },
          { t: "grab a bite", reg: "work-ok", d: "eat something quick.", ex: "Want to grab a bite?" },
          { t: "my bad", reg: "casual", d: "my mistake.", ex: "My bad, I sent the wrong file." },
          { t: "no worries", reg: "work-ok", d: "it's fine / you're welcome.", ex: "No worries, take your time." },
          { t: "I'm beat", reg: "casual", d: "I'm exhausted.", ex: "I'm beat — see you tomorrow." },
          { t: "hit me up", reg: "casual", d: "contact me.", ex: "Hit me up when you land." },
          { t: "a heads-up", reg: "work-ok", d: "a warning in advance.", ex: "Quick heads-up: the site is down." },
          { t: "catch up", reg: "work-ok", d: "talk to update each other.", ex: "Let's catch up next week." }
        ]
      },

      {
        section: "slang", eyebrow: "Reactions", title: "Reacting like a native",
        terms: [
          { t: "No way!", reg: "casual", d: "disbelief or excitement.", ex: "No way, you got the job?" },
          { t: "For real?", reg: "casual", d: "are you serious?", ex: "For real? That fast?" },
          { t: "Fair enough.", reg: "work-ok", d: "I accept your reason.", ex: "Fair enough, let's do it your way." },
          { t: "Makes sense.", reg: "work-ok", d: "I understand and agree.", ex: "Ah, makes sense." },
          { t: "I'm not gonna lie \u2026", reg: "casual", d: "honestly.", ex: "Not gonna lie, that was hard." },
          { t: "It is what it is.", reg: "casual", d: "accepting something you can't change.", ex: "We lost the client. It is what it is." },
          { t: "That's rough.", reg: "casual", d: "sympathy.", ex: "Your flight got cancelled? That's rough." },
          { t: "Good call.", reg: "work-ok", d: "a good decision.", ex: "Good call on rolling back." }
        ]
      },

      {
        section: "slang", eyebrow: "Idioms", title: "Idioms worth knowing",
        use: "The meaning is not the sum of the words. Learn them whole.",
        terms: [
          { t: "a piece of cake", d: "very easy.", ex: "The exam was a piece of cake." },
          { t: "hit the nail on the head", d: "be exactly right.", ex: "You hit the nail on the head." },
          { t: "under the weather", d: "slightly ill.", ex: "I'm a bit under the weather today." },
          { t: "call it a day", reg: "work-ok", d: "stop working.", ex: "It's late — let's call it a day." },
          { t: "on the same page", reg: "work-ok", d: "in agreement.", ex: "Are we on the same page?" },
          { t: "bite off more than you can chew", d: "take on too much.", ex: "I bit off more than I could chew this sprint." },
          { t: "the ball is in your court", reg: "work-ok", d: "it's your turn to act.", ex: "I've replied — the ball's in their court." },
          { t: "cut corners", d: "do something cheaply or carelessly.", ex: "Don't cut corners on testing." }
        ]
      },

      {
        section: "slang", eyebrow: "Texting", title: "Chat and internet shorthand",
        use: "Read-only for most situations — recognise them, use them only with friends.",
        terms: [
          { t: "btw", d: "by the way" },
          { t: "idk", d: "I don't know" },
          { t: "imo / imho", d: "in my (humble) opinion" },
          { t: "tbh", d: "to be honest" },
          { t: "asap", reg: "work-ok", d: "as soon as possible" },
          { t: "fyi", reg: "work-ok", d: "for your information" },
          { t: "lmk", reg: "work-ok", d: "let me know" },
          { t: "nvm", d: "never mind" },
          { t: "ttyl", d: "talk to you later" },
          { t: "wanna / gonna / gotta", reg: "careful", d: "want to / going to / have got to \u2014 spoken forms; don't write them formally." }
        ]
      },

      /* -------------------------- PRONUNCIATION ------------------------ */
      {
        section: "sounds", group: "Rules", eyebrow: "Ending", title: "The -ed ending: three sounds",
        ipa: "/t/ /d/ /\u026ad/",
        use: "Past tense -ed is written one way and pronounced three ways. The sound before it decides.",
        patterns: [
          { sign: "/t/", f: "after voiceless sounds: p, k, f, s, \u0283, t\u0283 &nbsp;\u2014 <b>worked, stopped, watched</b>" },
          { sign: "/d/", f: "after voiced sounds and vowels &nbsp;\u2014 <b>played, called, opened</b>" },
          { sign: "/\u026ad/", f: "only after <b>t</b> or <b>d</b> &nbsp;\u2014 <b>wanted, needed, started</b> (extra syllable)" }
        ],
        examples: ["asked = /\u0251\u02d0skt/ \u2014 one syllable, not two.", "decided = /d\u026a\u02c8sa\u026ad\u026ad/ \u2014 three syllables."]
      },

      {
        section: "sounds", group: "Rules", eyebrow: "Ending", title: "The -s ending: three sounds",
        ipa: "/s/ /z/ /\u026az/",
        use: "Plurals and third-person verbs follow the same voicing logic as -ed.",
        patterns: [
          { sign: "/s/", f: "after voiceless: p, t, k, f &nbsp;\u2014 <b>books, cats, laughs</b>" },
          { sign: "/z/", f: "after voiced and vowels &nbsp;\u2014 <b>dogs, plays, runs</b>" },
          { sign: "/\u026az/", f: "after s, z, \u0283, t\u0283, d\u0292 &nbsp;\u2014 <b>buses, watches, pages</b> (extra syllable)" }
        ],
        examples: ["works = /w\u025c\u02d0ks/ but plays = /ple\u026az/", "boxes = /\u02c8b\u0252ks\u026az/ \u2014 two syllables."]
      },

      {
        section: "sounds", group: "Rules", eyebrow: "Stress", title: "Word stress",
        use: "English is a stress-timed language. Put the stress in the wrong place and you may not be understood, even with perfect sounds.",
        patterns: [
          { sign: "N/V", f: "noun stresses the <b>first</b> syllable, verb the <b>second</b>" },
          { sign: "-ion", f: "stress the syllable <b>before</b> -tion, -sion, -ic, -ity" },
          { sign: "\u25B8", f: "unstressed vowels collapse into the schwa /\u0259/" }
        ],
        examples: ["<b>RE</b>cord (noun) / re<b>CORD</b> (verb)", "<b>PRE</b>sent (gift) / pre<b>SENT</b> (to show)", "infor<b>MA</b>tion, pho<b>TO</b>graphy, respons<b>i</b><b>BIL</b>ity"]
      },

      {
        section: "sounds", group: "Rules", eyebrow: "Reduction", title: "The schwa",
        ipa: "/\u0259/",
        use: "The most common sound in English. Any unstressed vowel can become it, whatever the spelling.",
        examples: ["about = /\u0259\u02c8ba\u028at/", "teacher = /\u02c8ti\u02d0t\u0283\u0259/", "banana = /b\u0259\u02c8n\u0251\u02d0n\u0259/ \u2014 three different letters, two identical sounds.", "Function words reduce in speech: <i>to</i> \u2192 /t\u0259/, <i>of</i> \u2192 /\u0259v/, <i>and</i> \u2192 /\u0259n/."]
      },

      {
        section: "sounds", group: "Rules", eyebrow: "Connected speech", title: "Linking and contractions",
        use: "Native speech joins words together. Recognising this is most of listening comprehension.",
        patterns: [
          { sign: "C+V", f: "consonant to vowel links: <i>an apple</i> \u2192 /\u0259\u02c8n\u00e6p\u0259l/" },
          { sign: "=", f: "<i>want to</i> \u2192 wanna, <i>going to</i> \u2192 gonna, <i>got to</i> \u2192 gotta (speech only)" },
          { sign: "'", f: "contractions are normal in speech and informal writing: I'm, don't, we'll, she'd" }
        ],
        examples: ["\u201cWhat do you want?\u201d often sounds like /w\u0259\u02c8d\u0292\u0259 w\u0252nt/.", "\u201cDid you eat?\u201d \u2192 /\u02c8d\u026ad\u0292\u0259 i\u02d0t/"]
      },

      {
        section: "sounds", group: "Sounds", eyebrow: "Consonants", title: "The two TH sounds",
        ipa: "/\u03b8/ and /\u00f0/",
        use: "Tongue lightly between the teeth. One is voiceless, one is voiced. Many languages have neither.",
        terms: [
          { t: "/\u03b8/ voiceless", d: "think, three, month, healthy, both" },
          { t: "/\u00f0/ voiced", d: "this, that, mother, breathe, with" },
          { t: "minimal pairs", d: "think / sink \u2022 three / tree \u2022 they / day \u2022 breath / breathe" }
        ]
      },

      {
        section: "sounds", group: "Sounds", eyebrow: "Consonants", title: "Final consonants and clusters",
        use: "English keeps its endings. Dropping them changes the word and hides your grammar.",
        examples: ["Compare: <i>car</i> / <i>card</i> / <i>cart</i> / <i>cards</i>", "<i>walk</i> \u2192 <i>walked</i> \u2192 /w\u0254\u02d0kt/ \u2014 the /t/ must be audible or the past tense disappears.", "Clusters to drill: <i>texts</i> /teksts/, <i>asked</i> /\u0251\u02d0skt/, <i>strengths</i> /stre\u014b\u03b8s/"]
      },

      {
        section: "sounds", group: "Sounds", eyebrow: "Vowels", title: "Long and short vowel pairs",
        use: "Length and tension separate these — get them wrong and you say a different word.",
        terms: [
          { t: "/i\u02d0/ vs /\u026a/", d: "sheep / ship \u2022 leave / live \u2022 feel / fill" },
          { t: "/u\u02d0/ vs /\u028a/", d: "fool / full \u2022 pool / pull" },
          { t: "/\u0251\u02d0/ vs /\u028c/", d: "cart / cut \u2022 heart / hut" },
          { t: "/\u00e6/ vs /e/", d: "bad / bed \u2022 man / men \u2022 sat / set" }
        ]
      },

      {
        section: "sounds", group: "Sounds", eyebrow: "Consonants", title: "L, R, V, W",
        use: "Four consonants that get swapped by learners from many language backgrounds.",
        terms: [
          { t: "/l/ vs /r/", d: "light / right \u2022 collect / correct \u2022 play / pray" },
          { t: "/v/ vs /w/", d: "vest / west \u2022 vine / wine \u2014 /v/ touches teeth to lip" },
          { t: "/v/ vs /b/", d: "very / berry \u2022 vote / boat" },
          { t: "dark L", d: "at the end of words the L is heavy: <i>full, well, people</i>" }
        ]
      },

      {
        section: "sounds", group: "Rules", eyebrow: "Intonation", title: "Intonation patterns",
        use: "The melody carries meaning that words don't. Same sentence, different message.",
        patterns: [
          { sign: "\u2197", f: "rising \u2014 yes/no questions, uncertainty, politeness" },
          { sign: "\u2198", f: "falling \u2014 statements, wh-questions, finality" },
          { sign: "\u2197\u2198", f: "rise-fall \u2014 lists, contrast, strong feeling" }
        ],
        examples: ["\u201cYou're coming?\u201d \u2197 = a question. \u201cYou're coming.\u201d \u2198 = a statement.", "\u201cI didn't say <b>he</b> stole it.\u201d \u2014 stress any word and the meaning changes."]
      }

    ];
