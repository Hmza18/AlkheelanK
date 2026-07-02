/** Marc Lou-style landing popup pool — 50+ rotating messages. */

const CTA_HOST = "Host free →";
const CTA_SHOW = "Show me →";
const CTA_MINE = "Host mine →";
const CTA_TRY = "Try it free →";
const CTA_PIN = "Get my PIN →";

export const ATTENTION_POPUP_POOL = [
  { id: "phones-down", type: "toast", tone: "reality", emoji: "📱", eyebrow: "Real talk", headline: "You're still talking. They're still scrolling.", body: "A live game fixes that in 60 seconds. Host free — no signup.", cta: CTA_HOST },
  { id: "icebreaker-pain", type: "toast", tone: "reality", emoji: "⏳", eyebrow: "Honest question", headline: "That icebreaker took 45 minutes.", body: "Hosts here go live in under a minute. No prep montage.", cta: CTA_SHOW },
  { id: "live-manama", type: "toast", tone: "social", live: true, eyebrow: "Happening now", headline: "Ahmed just went live", body: "Manama · 28 students joined before he finished the intro", cta: CTA_MINE },
  { id: "not-bored", type: "toast", tone: "reality", emoji: "👀", eyebrow: "Uncomfortable truth", headline: "They're not shy. Your format is boring.", body: "Give them a reason to look up. One PIN. Zero installs.", cta: CTA_HOST },
  { id: "honest-question", type: "modal", tone: "urgency", emoji: "🎯", eyebrow: "Before you bounce", headline: "How many people were actually paying attention?", body: "Last meeting. Be honest. Host free — players join with a PIN in seconds.", cta: CTA_HOST, dismissLabel: "I'll keep losing the room" },
  { id: "zoom-fatigue", type: "toast", tone: "reality", emoji: "😴", eyebrow: "You know it", headline: "Another slide deck won't save this.", body: "Competition wakes people up. You host. They play on their phones.", cta: CTA_TRY },
  { id: "live-dubai", type: "toast", tone: "social", live: true, eyebrow: "Live now", headline: "Mohamed's family quiz just started", body: "Dubai · 14 cousins joined from 3 countries", cta: CTA_MINE },
  { id: "kahoot-paywall", type: "toast", tone: "reality", emoji: "💸", eyebrow: "No lecture", headline: "You don't need a $500/year plan for Friday night.", body: "Host free. PIN in. Play. Done.", cta: CTA_HOST },
  { id: "signup-friction", type: "toast", tone: "urgency", emoji: "🚀", eyebrow: "Ship it", headline: "Your players won't make an account.", body: "They shouldn't have to. PIN only. You're live in one click.", cta: CTA_PIN },
  { id: "live-riffa", type: "toast", tone: "social", live: true, eyebrow: "Just now", headline: "Hasan just started a team quiz", body: "Riffa · 19 coworkers · the manager lost on purpose", cta: CTA_SHOW },
  { id: "teacher-tuesday", type: "toast", tone: "reality", emoji: "📚", eyebrow: "For teachers", headline: "Attendance ≠ engagement.", body: "Bodies in seats. Minds on TikTok. Fix it before the bell.", cta: CTA_HOST },
  { id: "founder-note", type: "modal", tone: "urgency", emoji: "✍️", eyebrow: "From the builder", headline: "I built this because Kahoot got expensive and boring.", body: "Same rush. No player signup. Host free while we're in beta.", cta: CTA_TRY, dismissLabel: "I'll overpay somewhere else" },
  { id: "live-doha", type: "toast", tone: "social", live: true, eyebrow: "Live", headline: "Ali's family gathering quiz is live", body: "Doha · 22 players · uncle already winning", cta: CTA_MINE },
  { id: "ppt-again", type: "toast", tone: "reality", emoji: "📊", eyebrow: "Stop it", headline: "Nobody wants slide #47.", body: "They want to win something stupid and laugh. Give them that.", cta: CTA_HOST },
  { id: "one-minute", type: "toast", tone: "urgency", emoji: "⚡", eyebrow: "Speed run", headline: "60 seconds to a live game.", body: "Not 60 minutes of 'can everyone see my screen?'", cta: CTA_PIN },
  { id: "live-kuwait", type: "toast", tone: "social", live: true, eyebrow: "Happening now", headline: "Omar's onboarding quiz just kicked off", body: "Kuwait City · 31 new hires · HR is sweating", cta: CTA_SHOW },
  { id: "family-dinner", type: "toast", tone: "reality", emoji: "🍽️", eyebrow: "Weekend energy", headline: "Uncle's stories aren't getting shorter.", body: "Redirect the chaos into a quiz. Everyone wins except uncle.", cta: CTA_TRY },
  { id: "no-app", type: "toast", tone: "urgency", emoji: "📲", eyebrow: "Zero friction", headline: "Your cousin won't download an app.", body: "Good. They don't need to. Browser + PIN. That's the whole stack.", cta: CTA_HOST },
  { id: "live-jeddah", type: "toast", tone: "social", live: true, eyebrow: "Live now", headline: "Khalid's trivia night just went live", body: "Jeddah · 40 players · he's hosting from the café", cta: CTA_MINE },
  { id: "meeting-vampire", type: "toast", tone: "reality", emoji: "🧛", eyebrow: "Pain point", headline: "This meeting could've been a 5-question game.", body: "Same info. 10× the energy. Try it once.", cta: CTA_SHOW },
  { id: "scroll-trap", type: "modal", tone: "reality", emoji: "🪤", eyebrow: "Still here?", headline: "You've read this far but haven't hosted yet.", body: "Curiosity is free. So is hosting. Worst case: your friends roast you.", cta: CTA_HOST, dismissLabel: "I'll keep scrolling" },
  { id: "live-muscat", type: "toast", tone: "social", live: true, eyebrow: "Just started", headline: "Youssef's class revision is live", body: "Muscat · 26 students · phones actually down", cta: CTA_MINE },
  { id: "host-anxiety", type: "toast", tone: "urgency", emoji: "🎤", eyebrow: "You got this", headline: "Hosting isn't public speaking.", body: "You click Next. The game does the work. Players do the yelling.", cta: CTA_PIN },
  { id: "boring-retro", type: "toast", tone: "reality", emoji: "🔄", eyebrow: "Hot take", headline: "Your retro has the same 3 people talking.", body: "Randomize who wins. Watch the quiet ones wake up.", cta: CTA_TRY },
  { id: "live-cairo", type: "toast", tone: "social", live: true, eyebrow: "Live", headline: "Abdullah's Friday family quiz is on", body: "Cairo · 18 players · grandpa is crushing it", cta: CTA_MINE },
  { id: "student-phones", type: "toast", tone: "reality", emoji: "🎓", eyebrow: "Classroom hack", headline: "If you can't beat the phones, game-ify them.", body: "They're already staring at screens. Aim that energy.", cta: CTA_HOST },
  { id: "pricing-modal", type: "modal", tone: "urgency", emoji: "🆓", eyebrow: "Beta perk", headline: "Hosting is free right now.", body: "No credit card. No 'contact sales.' Just host and see if your room wakes up.", cta: CTA_HOST, dismissLabel: "I'll pay for less" },
  { id: "live-abu-dhabi", type: "toast", tone: "social", live: true, eyebrow: "Now live", headline: "Hamza just started an office quiz", body: "Abu Dhabi · 24 coworkers · the intern is on a streak", cta: CTA_SHOW },
  { id: "prep-zero", type: "toast", tone: "urgency", emoji: "0️⃣", eyebrow: "No prep", headline: "Zero slides. Zero worksheets.", body: "Pick a quiz or write 3 questions. PIN on screen. Go.", cta: CTA_PIN },
  { id: "engagement-lie", type: "toast", tone: "reality", emoji: "📉", eyebrow: "Metrics lie", headline: "'Everyone nodded' is not engagement.", body: "Scores don't lie. Neither do victory screams.", cta: CTA_HOST },
  { id: "live-muharraq", type: "toast", tone: "social", live: true, eyebrow: "Live", headline: "Ibrahim's friends night turned into trivia", body: "Muharraq · 12 friends · someone definitely googling", cta: CTA_MINE },
  { id: "remote-team", type: "toast", tone: "reality", emoji: "🌍", eyebrow: "Remote teams", headline: "Zoom can't carry your culture alone.", body: "Shared wins beat another async update. Host something dumb tonight.", cta: CTA_TRY },
  { id: "last-chance", type: "modal", tone: "urgency", emoji: "⏰", eyebrow: "Quick one", headline: "Your next all-hands doesn't have to suck.", body: "Open with 2 minutes of chaos. People remember chaos.", cta: CTA_HOST, dismissLabel: "Another deck it is" },
  { id: "live-dubai-office", type: "toast", tone: "social", live: true, eyebrow: "Happening now", headline: "Ahmed's team all-hands quiz is live", body: "Dubai · 52 people · the founder lost to an intern", cta: CTA_SHOW },
  { id: "quiz-not-test", type: "toast", tone: "urgency", emoji: "🎉", eyebrow: "Vibe check", headline: "This isn't a test. It's a party with points.", body: "Wrong answers are funny. Right answers are loud. Host free.", cta: CTA_HOST },
  { id: "wifi-works", type: "toast", tone: "reality", emoji: "📶", eyebrow: "It works", headline: "Yes, it works on school WiFi.", body: "Browser tab. PIN. No IT ticket required.", cta: CTA_TRY },
  { id: "live-sharjah", type: "toast", tone: "social", live: true, eyebrow: "Live now", headline: "Hasan's youth group quiz is on", body: "Sharjah · 35 players · energy is unreal", cta: CTA_MINE },
  { id: "death-by-agenda", type: "toast", tone: "reality", emoji: "☠️", eyebrow: "Brutal honesty", headline: "Your agenda is killing the room.", body: "Swap 5 minutes of agenda for 5 minutes of competition.", cta: CTA_HOST },
  { id: "pin-magic", type: "toast", tone: "urgency", emoji: "🔢", eyebrow: "The whole trick", headline: "6 digits. That's the onboarding.", body: "Players type a PIN. You look like a genius. Host free.", cta: CTA_PIN },
  { id: "live-doha-launch", type: "toast", tone: "social", live: true, eyebrow: "Just now", headline: "Mohamed's product launch quiz is live", body: "Doha · 44 attendees · the room actually woke up", cta: CTA_SHOW },
  { id: "shy-not-shy", type: "toast", tone: "reality", emoji: "🙋", eyebrow: "Introverts", headline: "Quiet people compete when it's anonymous-ish.", body: "Nickname + phone. No hand-raising required.", cta: CTA_TRY },
  { id: "builder-bias", type: "modal", tone: "urgency", emoji: "🛠️", eyebrow: "Why this exists", headline: "I got tired of paying to entertain my own family.", body: "So I built the fastest live quiz I could. Host free — tell me what's broken.", cta: CTA_HOST, dismissLabel: "Back to Netflix" },
  { id: "live-manama-family", type: "toast", tone: "social", live: true, eyebrow: "Live", headline: "Ali's family trivia just started", body: "Manama · 30 cousins · uncle already cheating", cta: CTA_MINE },
  { id: "workshop-graveyard", type: "toast", tone: "reality", emoji: "⚰️", eyebrow: "Workshops", headline: "Breakout rooms are where souls go to die.", body: "One screen. One game. Actual shared moment.", cta: CTA_HOST },
  { id: "two-clicks", type: "toast", tone: "urgency", emoji: "👆", eyebrow: "Simple", headline: "Two clicks to live. Seriously.", body: "Pick quiz → Host. PIN appears. Stop overthinking.", cta: CTA_PIN },
  { id: "live-riyadh-office", type: "toast", tone: "social", live: true, eyebrow: "Now live", headline: "Omar turned a meeting into a game show", body: "Riyadh · 12 teammates · the PM is in last place", cta: CTA_SHOW },
  { id: "lecture-mode", type: "toast", tone: "reality", emoji: "🎙️", eyebrow: "Facilitators", headline: "You're not a lecturer. You're a host.", body: "Let the game carry the energy. You just drive.", cta: CTA_TRY },
  { id: "fomo-real", type: "toast", tone: "urgency", emoji: "🔥", eyebrow: "While you wait", headline: "Someone nearby is hosting right now.", body: "Could be you. Host free. Takes less than a minute.", cta: CTA_HOST },
  { id: "live-riyadh", type: "toast", tone: "social", live: true, eyebrow: "Live", headline: "Ahmed's Eid family quiz is live", body: "Riyadh · 21 family members · chaos enabled", cta: CTA_MINE },
  { id: "slide-deck-funeral", type: "toast", tone: "reality", emoji: "🪦", eyebrow: "RIP", headline: "Pour one out for the slide deck.", body: "Live games get the laughs slides never will.", cta: CTA_SHOW },
  { id: "honest-close", type: "modal", tone: "urgency", emoji: "💬", eyebrow: "Last nudge", headline: "You wouldn't still be here if you weren't curious.", body: "Host free. One game. See if your people show up differently.", cta: CTA_HOST, dismissLabel: "Maybe later" },
  { id: "live-bahrain-sales", type: "toast", tone: "social", live: true, eyebrow: "Happening now", headline: "Hasan's sales kickoff quiz is live", body: "Bahrain · 38 reps · leaderboard is savage", cta: CTA_MINE },
  { id: "no-demo", type: "toast", tone: "urgency", emoji: "▶️", eyebrow: "Skip the tour", headline: "Don't watch a demo. Host one.", body: "You'll know in 60 seconds if this is your thing.", cta: CTA_PIN },
  { id: "energy-transfer", type: "toast", tone: "reality", emoji: "⚡", eyebrow: "Host secret", headline: "Your energy sets the room.", body: "A game multiplies it. Stop solo-performing.", cta: CTA_TRY },
  { id: "live-amman", type: "toast", tone: "social", live: true, eyebrow: "Live now", headline: "Mohamed's lecture break quiz just started", body: "Amman · 80 students · professor actually smiling", cta: CTA_SHOW },
  { id: "beta-free", type: "toast", tone: "urgency", emoji: "🎁", eyebrow: "Beta", headline: "Free hosting won't last forever.", body: "It is free today. Use it while you can.", cta: CTA_HOST },
];

export const POPUPS_PER_CYCLE = 5;
export const ATTENTION_CYCLE_BASE_MS = 4000;
export const ATTENTION_CYCLE_STAGGER_MS = 10500;
export const ATTENTION_LOOP_GAP_MS = 22000;

const DEFAULT_TOAST_MS = 8500;
const SOCIAL_TOAST_MS = 9000;

/** Pick the next batch of popups for a landing cycle (rotates through the full pool). */
export function getAttentionPopupsForCycle(cycleIndex) {
  return Array.from({ length: POPUPS_PER_CYCLE }, (_, i) => {
    const src = ATTENTION_POPUP_POOL[(cycleIndex * POPUPS_PER_CYCLE + i) % ATTENTION_POPUP_POOL.length];
    const isModal = src.type === "modal";
    return {
      ...src,
      delayMs: ATTENTION_CYCLE_BASE_MS + i * ATTENTION_CYCLE_STAGGER_MS,
      displayMs: isModal ? undefined : src.tone === "social" ? SOCIAL_TOAST_MS : DEFAULT_TOAST_MS,
    };
  });
}

/** @deprecated Use getAttentionPopupsForCycle — kept for imports that expect a static list. */
export const ATTENTION_POPUPS = getAttentionPopupsForCycle(0);
