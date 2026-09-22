import assert from 'node:assert/strict';
import { analyze, countWords, scoreTone } from './src/tone-score.mjs';

// word counting
assert.equal(countWords(''), 0);
assert.equal(countWords('hey there'), 2);

// a warm, specific, confident message should score well
const good = scoreTone('Was just thinking about you — hope your week is going well. How was your day?');
assert.ok(good.warmth >= 70, `warmth should be high, got ${good.warmth}`);
assert.ok(good.neediness <= 20, `neediness should be low, got ${good.neediness}`);
assert.ok(good.composite >= 70, `composite should be high, got ${good.composite}`);
assert.equal(good.verdict, 'green');

// a reassurance-seeking message should be flagged
const needy = scoreTone('hey?? are you ignoring me? sorry to bother you, just checking in');
assert.ok(needy.neediness >= 40, `neediness should be high, got ${needy.neediness}`);
assert.ok(needy.composite < good.composite, 'needy message must score below the warm one');
assert.ok(['yellow', 'red'].includes(needy.verdict), `verdict should be yellow or red, got ${needy.verdict}`);

// the reality check: a plain, specific message with no warmth phrases still should not be flagged needy
const plain = scoreTone('Still thinking about that ramen place you mentioned. Thursday?');
assert.ok(plain.neediness <= 20, `plain message should not be needy, got ${plain.neediness}`);
assert.ok(plain.composite >= 60, `plain message should still score decently, got ${plain.composite}`);

// hedges cost confidence
const hedged = scoreTone('i guess maybe we could hang out if you want, no pressure');
assert.ok(hedged.confidence < 60, `hedged confidence should drop, got ${hedged.confidence}`);

// one question is clearer than four
const clear = scoreTone('Are you free Saturday?');
const cluttered = scoreTone('Are you free Saturday? Or Sunday? Or maybe Friday? What about next week?');
assert.ok(clear.clarity > cluttered.clarity, 'fewer questions must score higher on clarity');

// tips are capped at two and always strings
const tips = analyze('hey?? are you ignoring me? sorry, just checking in').tips;
assert.ok(Array.isArray(tips) && tips.length <= 2);
for (const t of tips) assert.equal(typeof t, 'string');

// extremes don't break the clamp
assert.ok(scoreTone('').composite >= 0);
assert.ok(scoreTone('A'.repeat(2000)).composite <= 100);

console.log('all tone-score tests passed');
