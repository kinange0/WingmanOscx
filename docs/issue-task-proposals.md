# Issue Task Proposals

## 1) Typo fix task
**Title:** Correct "complement" to "compliment" in seeded reminder copy

- **Issue:** The seeded reminder text currently says "Don't complement her looks more than once a week", where "complement" is the wrong word for praise in this context.
- **Why it matters:** This is user-facing copy and looks unpolished.
- **Proposed change:** Replace "complement" with "compliment" in the initial contact reminder string.
- **Location:** `constants.ts`.

## 2) Bug fix task
**Title:** Fix Gemini API key lookup for Vite runtime

- **Issue:** `GeminiService` initializes `GoogleGenAI` with `process.env.API_KEY`, which is not the normal client-side env path in Vite apps.
- **Impact:** API calls can fail at runtime because the key resolves as `undefined` in the browser build.
- **Proposed change:** Read from `import.meta.env` (for example `import.meta.env.VITE_GEMINI_API_KEY`) and add a clear guard/error if missing.
- **Location:** `services/geminiService.ts`.

## 3) Code comment/documentation discrepancy task
**Title:** Remove stale "Fix:" comments that describe historical clipboard changes

- **Issue:** `AdviceOutput` contains comments like "Fix: Changed readText(text) to writeText(text)..." even though the implementation is already correct.
- **Why it matters:** The comment is historical/changelog-style rather than code intent and can confuse maintainers.
- **Proposed change:** Replace with concise intent-based comments (or remove entirely) so comments describe *why* code exists, not old diffs.
- **Location:** `components/AdviceOutput.tsx`.

## 4) Test improvement task
**Title:** Add unit tests for JSON cleanup/repair and fallback parsing in `GeminiService`

- **Issue:** Core parsing reliability paths (`cleanJsonResponse`, `tryRepairJson`, parse fallback flow) have no tests.
- **Risk:** Future edits can silently break recovery behavior for malformed model output.
- **Proposed change:** Add tests that cover:
  - JSON wrapped in markdown fences.
  - Extra prose before/after JSON.
  - Unbalanced quotes/brackets repaired by fallback.
  - Final parse failure path surfaces a controlled error.
- **Location:** New test file under project test conventions (e.g. `services/geminiService.test.ts`).
