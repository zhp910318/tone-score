/**
 * tone-score — score a text message on five dimensions.
 *
 * Zero dependencies. Pure functions. Works in Node, the browser, and edge runtimes.
 *
 * Dimensions (each 0–100):
 *   neediness   lower is better — reassurance-seeking, hedging, pressure
 *   warmth      higher is better — specific, personal, easy to answer
 *   confidence  higher is better — declarative, unhurried
 *   clarity     higher is better — one question at a time, no filler
 *   lengthFit   higher is better — 8–40 words is the sweet spot for texting
 *
 * `composite` weights them into a single 0–100 score.
 *
 * Extracted from the free Text Tone Checker at
 * https://love-strategist.yixingnet.online/tools/tone-checker
 * MIT licensed.
 */

export const POSITIVE_EMOJI = ['🙂', '😊', '❤️', '😄'];

const NEED_SIGNALS = [
  ['please reply', 25], ['please respond', 25],
  ["why aren't you", 25], ['why are you ignoring', 25],
  ['are you ignoring me', 25], ['are you mad', 25],
  ['i miss you', 15],
  ['just checking in', 12], ['checking in', 12], ['just wondering if', 12],
  ['no pressure', 8],
  ['sorry to bother', 10], ['sorry if this is', 10], ['sorry', 10],
  ['when are you free', 5], ['let me know when', 5],
];

const WEAK_WORDS = ['maybe', 'perhaps', 'if you want', "if that's ok", 'no pressure', 'just', 'i guess', 'i suppose'];
const HEDGE_WORDS = ['i think', 'i feel like'];
const FILLER = ['\\bum\\b', '\\blike\\b', '\\bidk\\b', '\\byou know\\b'];

/** Count whitespace-separated words. */
export function countWords(text) {
  const t = String(text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Score a message. Returns the five dimensions plus a composite and a verdict. */
export function scoreTone(text) {
  const input = String(text || '');
  const lower = input.toLowerCase();
  const wordCount = countWords(input);
  const sentences = input.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  const avgWords = sentences.length ? wordCount / sentences.length : 0;

  // 1) Neediness (lower is better)
  let neediness = 0;
  for (const [sig, w] of NEED_SIGNALS) {
    if (lower.includes(sig)) neediness += w;
  }
  if (input.includes('??')) neediness += 10;
  const letters = input.match(/[a-zA-Z]/g) || [];
  const caps = input.match(/[A-Z]/g) || [];
  if (letters.length >= 4 && caps.length / letters.length > 0.4) neediness += 8;
  neediness = Math.min(neediness, 100);

  // 2) Warmth
  let warmth = 40;
  if (/thinking of you|was just thinking/.test(lower)) warmth += 20;
  if (/hope you|hope your/.test(lower)) warmth += 15;
  if (/love your|you're great|you seemed|you looked/.test(lower)) warmth += 15;
  if (/what did you|how was your|how are you/.test(lower)) warmth += 15;
  if (/you mentioned/.test(lower)) warmth += 10;
  if (POSITIVE_EMOJI.some((e) => input.includes(e))) warmth += 8;
  warmth = Math.min(Math.max(warmth, 0), 100);

  // 3) Confidence
  let confidence = 60;
  for (const w of WEAK_WORDS) {
    const m = lower.match(new RegExp('\\b' + w.replace(/'/g, "\\'") + '\\b', 'g'));
    if (m) confidence -= 8 * m.length;
  }
  for (const w of HEDGE_WORDS) {
    const m = lower.match(new RegExp('\\b' + w.replace(/'/g, "\\'") + '\\b', 'g'));
    if (m) confidence -= 3 * m.length;
  }
  const trimmed = input.trim();
  if (trimmed.endsWith('.') && !trimmed.endsWith('?')) confidence += 10;
  confidence = Math.min(Math.max(confidence, 0), 100);

  // 4) Clarity
  let clarity = 80;
  const qCount = (input.match(/\?/g) || []).length;
  if (qCount > 3) clarity -= 20;
  if (avgWords >= 5 && avgWords <= 20) clarity += 10;
  let fillerCount = 0;
  for (const f of FILLER) {
    const m = lower.match(new RegExp(f, 'g'));
    if (m) fillerCount += m.length;
  }
  if (fillerCount > 2) clarity -= 15;
  clarity = Math.min(Math.max(clarity, 0), 100);

  // 5) Length fit
  let lengthFit;
  if (wordCount >= 8 && wordCount <= 40) lengthFit = 100;
  else if (wordCount >= 41 && wordCount <= 70) lengthFit = 70;
  else if (wordCount >= 4 && wordCount <= 7) lengthFit = 60;
  else if (wordCount >= 71 && wordCount <= 120) lengthFit = 50;
  else if (wordCount >= 1 && wordCount <= 3) lengthFit = 30;
  else lengthFit = 25;

  const composite = Math.round(
    warmth * 0.25 +
      confidence * 0.25 +
      clarity * 0.2 +
      lengthFit * 0.15 +
      (100 - neediness) * 0.15
  );
  const clamped = Math.min(Math.max(composite, 0), 100);

  let verdict = 'yellow';
  let verdictEmoji = '🟡';
  let verdictText = 'Solid. One small tweak and it lands better.';
  if (clamped >= 75) {
    verdict = 'green';
    verdictEmoji = '🟢';
    verdictText = 'Confident, warm, and easy to reply to.';
  } else if (clamped < 50) {
    verdict = 'red';
    verdictEmoji = '🔴';
    verdictText = 'Reads as needy or pressured. Try a calmer rewrite.';
  }

  return { neediness, warmth, confidence, clarity, lengthFit, composite: clamped, verdict, verdictEmoji, verdictText, wordCount };
}

/**
 * Up to two tips for the dimensions that most need work.
 * Neediness is inverted (high = bad), so 100 - neediness is its quality.
 */
export function buildTips(r) {
  const dims = [
    { quality: 100 - r.neediness, flag: r.neediness > 55, tip: "Avoid 'just checking in' or double-questioning. Give them room to breathe." },
    { quality: r.warmth, flag: r.warmth < 55, tip: 'Add one genuine, specific detail about them.' },
    { quality: r.confidence, flag: r.confidence < 55, tip: "Drop the hedges ('maybe', 'if you want'). State it plainly." },
    { quality: r.clarity, flag: r.clarity < 62, tip: 'One question per text. Let them answer.' },
    { quality: r.lengthFit, flag: r.lengthFit < 70, tip: r.wordCount > 40 ? 'Shorter lands better — under 40 words.' : 'Give a little more — a sentence or two.' },
  ];
  return dims
    .filter((d) => d.flag)
    .sort((a, b) => a.quality - b.quality)
    .slice(0, 2)
    .map((d) => d.tip);
}

/** Convenience: score + tips in one call. */
export function analyze(text) {
  const result = scoreTone(text);
  return { ...result, tips: buildTips(result) };
}
