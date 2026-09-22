# tone-score

Score a text message on **neediness, warmth, confidence, clarity and length fit** — five dimensions, one composite score, zero dependencies.

```js
import { scoreTone, buildTips, analyze } from 'tone-score';

const r = scoreTone("Still thinking about that ramen place you mentioned. Thursday?");

r.composite;     // 82
r.neediness;     // 0   (lower is better)
r.warmth;        // 90
r.confidence;    // 68
r.clarity;       // 90
r.lengthFit;     // 100
r.verdict;       // 'green'

buildTips(r);    // ["Drop the hedges ('maybe', 'if you want'). State it plainly."]
analyze(text);   // score + tips in one call
```

## Why this exists

Most tone or sentiment libraries answer "is this positive or negative?". That is the wrong question for a text message between two people who like each other. The failure mode is not negativity — it is **neediness**: reassurance-seeking, hedging, and pressure that makes a message feel like a bill the other person has to pay.

This library scores that failure mode directly, alongside the three qualities that make a message easy to answer.

## The five dimensions

| Dimension | 0 means | 100 means | Weight |
|---|---|---|---|
| `neediness` | No pressure at all | Reassurance-seeking, hedging, time pressure | 15% (inverted) |
| `warmth` | Cold and generic | Specific, personal, easy to answer | 25% |
| `confidence` | Hedged into mush (`just`, `maybe`, `i guess`) | Declarative and unhurried | 25% |
| `clarity` | Four questions and filler | One question, plainly put | 20% |
| `lengthFit` | A three-word reply or a wall of text | 8–40 words | 15% |

`composite` = `warmth×0.25 + confidence×0.25 + clarity×0.2 + lengthFit×0.15 + (100−neediness)×0.15`

Verdicts: `green` (≥75), `yellow` (50–74), `red` (<50).

## Signals it looks for

- **Neediness**: `please reply`, `are you ignoring me`, `are you mad`, `just checking in`, `just wondering if`, `sorry to bother`, `no pressure`, `let me know when`, doubled question marks (`??`), and ALL-CAPS shouting (>40% capitals).
- **Warmth**: `thinking of you`, `hope you`, `you mentioned`, asking about *their* day, and positive emoji.
- **Confidence**: penalises hedges (`maybe`, `perhaps`, `if you want`, `just`, `i guess`, `i suppose`, `i think`, `i feel like`) and rewards a declarative full stop.
- **Clarity**: penalises more than three questions, filler (`um`, `like`, `idk`, `you know`) and sentences averaging outside 5–20 words.
- **Length**: 8–40 words scores 100; under 4 words and over 70 words degrade.

## Install

No package registry needed — install straight from GitHub:

```bash
npm install github:zhp910318/tone-score
```

Or copy [`src/tone-score.mjs`](src/tone-score.mjs) into your project. It is one file, ~180 lines, no imports.

## Runtime support

Pure ES modules, no Node APIs used, so it runs in Node 18+, browsers, and edge/serverless runtimes. The functions are synchronous and allocation-light; a score is a few regex passes.

```bash
npm test   # node --test-less assertions, prints "all tone-score tests passed"
```

## Honest limits

- It is **heuristic, not a model**. It scores *patterns*, not meaning: a well-written message can be misread, and sarcasm is invisible to it.
- The word lists are **English-specific**.
- It measures one message in isolation. A single dry reply is not a signal; a pattern over weeks is. Do not use it to police a relationship.
- It is **not a manipulation tool**, and it was not built as one. The point is to notice when *your own* anxiety is doing the writing.

## Provenance

Extracted from the free, browser-only [Text Tone Checker](https://love-strategist.yixingnet.online/tools/tone-checker) at **[Love Strategist](https://love-strategist.yixingnet.online)** — an AI dating and relationship coach. The web version runs entirely client-side: nothing you paste leaves your device.

MIT licensed. PRs welcome, especially non-English signal lists and additional test cases.
