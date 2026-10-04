# ScamLens — TC059 Scam Message Explainer

> Don't just wonder if it's a scam. **Know why.**

ScamLens is an explainable AI-powered scam analysis platform. Paste a message, upload a
screenshot, or check a URL — and get a risk score, detected signals, the exact evidence,
a plain-language explanation, and concrete next steps.

The core principle: **don't just tell the user something may be a scam — explain WHY and
tell them WHAT TO DO NEXT.**

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: add GEMINI_API_KEY for AI explanations
npm run warmup:ocr           # optional: pre-download OCR data (first screenshot is faster)
npm run dev
```

Open http://localhost:3000

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` | Test suite (vitest) |
| `npm run warmup:ocr` | Pre-download OCR language data |

**No API key? No problem.** The app is fully functional without one: deterministic signals,
risk scoring, evidence, explanations, and actions all run without any AI provider. The header
pill shows `Rules only` when AI is unavailable.

---

## Architecture

```
USER INPUT (text / screenshot / URL)
   ↓
CONTENT EXTRACTION        OCR (tesseract.js, local) · URL parsing (no fetching)
   ↓
DETERMINISTIC SIGNALS     src/lib/signals — pattern engine, evidence capture
   ↓
RISK ASSESSMENT           src/lib/risk — transparent weighted scoring (0–100 + level)
   ↓
AI CONTEXT ANALYSIS       src/lib/ai — provider abstraction, structured JSON, validated
   ↓
EVIDENCE CORRELATION      excerpt → signal mapping
   ↓
EXPLANATION + ACTIONS     AI text when available, deterministic fallback otherwise
   ↓
ONE AnalysisResult        rendered by a single results dashboard
```

Key design rules:

- **The AI never decides the score.** Scores come only from deterministic, configurable
  weights (`src/lib/risk/config.ts`).
- **The app degrades gracefully.** AI timeouts/invalid JSON/rate limits → rule-only mode,
  never a crash.
- **SSRF-safe URL mode.** URLs are statically inspected only — never fetched. Private,
  loopback, link-local, metadata, and `.local`/`.internal` hosts are rejected.
- **Privacy by default.** Messages stay in memory; screenshots are discarded after OCR;
  history is opt-in and stored only in the browser (never raw content).

### Module map

| Path | Responsibility |
|---|---|
| `src/lib/signals/` | Deterministic pattern detection + evidence extraction |
| `src/lib/risk/` | Configurable weights, thresholds, scoring |
| `src/lib/actions.ts` | Deterministic recommended actions + explanation fallback |
| `src/lib/ai/` | `AIProvider` contract, Gemini provider, stubs, JSON validation |
| `src/lib/pipeline/analyze.ts` | Orchestrates every step into one `AnalysisResult` |
| `src/lib/url/` | SSRF guard + static URL inspection |
| `src/lib/ocr/tesseract.ts` | Cached OCR worker |
| `src/lib/server/` | HTTP helpers, validation, rate limiting |
| `src/lib/history.ts` | Opt-in localStorage history (summaries only) |
| `src/components/` | UI (analyzer, result dashboard, history, layout) |

---

## API contracts

All errors: `{ "error": "human-readable message", "code": "machine_code" }` with proper HTTP
status. Stack traces are never returned; logs contain error codes only, never user content.

### `GET /api/health`
```json
{ "status": "ok | degraded", "ai": true, "ocr": true, "version": "0.1.0" }
```

### `POST /api/analyze/text`
Request: `{ "text": "..." }` (3–4000 chars) → **200** `AnalysisResult`

### `POST /api/analyze/image`
Request: `multipart/form-data` with `image` (PNG/JPG/WEBP, ≤ 5 MB) → **200** `AnalysisResult`
(`extracted_text` contains the OCR output so the user can verify it)

### `POST /api/analyze/url`
Request: `{ "url": "https://..." }` → **200** `AnalysisResult`

Error codes: `empty_input`, `too_short`, `too_long`, `invalid_url`, `blocked_host`,
`unsupported_protocol`, `credentials_in_url`, `missing_image`, `unsupported_image`,
`image_too_large`, `empty_image`, `ocr_unavailable`, `ocr_no_text`, `ocr_failed`,
`bad_json`, `rate_limited`, `internal_error`.

### `AnalysisResult` (one format for all input types)
```json
{
  "id": "uuid",
  "input_type": "text | image | url",
  "risk_score": 55,
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "summary": "…",
  "signals": [{ "id", "category", "severity", "title", "evidence", "explanation" }],
  "evidence": [{ "excerpt", "signalIds", "note" }],
  "explanation": "…",
  "recommended_actions": [{ "priority": "critical|high|medium", "action": "…" }],
  "extracted_text": "…",
  "language": "en",
  "ai_available": false,
  "confidence_note": "…",
  "created_at": "ISO timestamp"
}
```

### Risk scoring (transparent heuristic — not a validated probability)
Weights per **distinct** category, capped at 100
(`credential_request` 20 · `financial_request` 20 · `suspicious_url` 20 ·
`impersonation` 15 · `urgency` 10 · `threat` 10 · `reward_lure` 10):
0–24 LOW · 25–49 MEDIUM · 50–74 HIGH · 75–100 CRITICAL

---

## Testing

```bash
npm test
```

77 tests cover: signal detection & evidence, risk weights/levels, URL safety (SSRF) and
findings, AI response validation (malformed JSON, wrong types, action coercion), input
validation, the text pipeline (including the local scam/legit dataset), and the API
endpoints (happy paths + error statuses).

Test fixtures live in `src/lib/testdata/dataset.ts` — 9 scam examples (fake bank, KYC,
OTP, job, lottery, investment, UPI, delivery, support) and 5 legitimate ones.

---

## Privacy

- No accounts, no tracking, no cookies.
- Messages are analyzed in memory and never stored server-side.
- Screenshots are processed transiently for OCR and discarded.
- AI is optional; when enabled, message text is sent to the configured provider (Gemini)
  for contextual explanation only.
- History is **opt-in per analysis**, stored in this browser's localStorage, and contains
  only summary + metadata — never raw messages, screenshots, or evidence.
- API keys live only in server environment variables.

---

## Demo script (~60–90 seconds)

1. Open **Analyze → Screenshot**, drag in a screenshot containing:
   *"Your bank account will be blocked today. Send your OTP immediately to verify your account."*
2. Click **Analyze screenshot** → OCR extracts the text (shown for verification).
3. Result: **HIGH RISK, 55/100** with signals: credential request, urgency, impersonation,
   threat.
4. Scroll: **Why was this flagged?** with the evidence map
   (*"…blocked today"* → urgency + threat, *"…send your OTP"* → credential request).
5. **What should I do?** — prioritized actions (do not share OTP → verify officially →
   block/report).
6. Architecture line: *"Deterministic signals first, AI adds context, the score comes from
   transparent weights — so it still works when the AI provider is down."*

Tip: run `npm run warmup:ocr` before the demo.

---

## Deployment

**Any Node host (VPS, Render, Railway):**
```bash
npm ci && npm run build && npm start   # set GEMINI_API_KEY in the environment
```

**Vercel:**
```bash
npx vercel
```
Set `GEMINI_API_KEY` in project environment variables. OCR downloads language data on first
use (runtime), so `npm run warmup:ocr` is not applicable there.

Environment variables: `GEMINI_API_KEY` (optional), `GEMINI_MODEL` (optional).

---

## Known limitations (prototype honesty)

- English OCR only (`eng`) — other languages are detected by the AI layer when enabled.
- Pattern-based detection covers common scam phrasing; novel wording can score lower.
- The Risk Score is a heuristic, **not** a scientifically validated probability.
- Rate limiting is per server instance (in-memory), prototype-grade.
- History lives in one browser's localStorage (no sync across devices).
