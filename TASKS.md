# Task Board — Thai Taste

Hackathon timeline: **< 14 hours**. Three tracks. Each owner ticks boxes as they go.

---

## Track A — Data Engineering

**Owner:** Payachai  
**Files:** [backend/app/data/](backend/app/data/)

- [x] Fill [global_foods.json](backend/app/data/global_foods.json) with **20** items
  - Fields: `id`, `name`, `image_url`, `remote_image_url`, `sensory_string`, `local_image_path`, `asset_status`
  - Dense sensory strings (flavor, texture, ingredient, cooking style)
  - **Do NOT** put country names in `sensory_string`
- [x] Fill [thai_dishes.json](backend/app/data/thai_dishes.json) with **50** items
  - Fields: `dish_id`, `name`, `thai_name`, `english_name`, `image_url`, `sensory_string`, `match_reason_keywords`, `spice_level`, `tags`, `remote_image_url`, `local_image_path`, `asset_status`
  - `match_reason_keywords` is the offline LLM fallback — keep it short (3 adjectives)
- [x] Fill [vendors.json](backend/app/data/vendors.json) with **50** items
  - Fields: `vendor_id`, `dish_id`, `vendor_name`, `distance`, `google_maps_url`, `flashcard_thai`, `flashcard_phonetic`
  - Every `dish_id` in vendors.json **must exist** in thai_dishes.json
- [x] Scope vendors to demo areas: Banthat Thong, Song Wat, and Chatuchak
- [x] Fix image mapping so `local_image_path` points to existing files under `backend/app/data/images/...`
- [x] Sanity check: all 3 JSON files parse, every vendor maps to a real dish, and all local image paths resolve

**Definition of done:** all three files validate as JSON, every vendor maps to a real dish, and every local image path points to an existing downloaded asset. ✅

---

## Track B — ML & Generative Explanation (Backend)

**Owner:** _________  
**Files:** [backend/app/services/](backend/app/services/), [backend/app/api/](backend/app/api/), [backend/app/config.py](backend/app/config.py), [backend/app/main.py](backend/app/main.py)

- [x] [config.py](backend/app/config.py) — load `OLLAMA_URL`, `OLLAMA_MODEL`, `DATA_DIR`, `CORS_ORIGINS`, `MONGO_URL` via `pydantic-settings`
- [x] [database/db.py](backend/app/database/db.py) — MongoDB singleton (`thai_taste` DB, `lru_cache`)
- [x] [services/recommender.py](backend/app/services/recommender.py)
  - [x] Load `SentenceTransformer('Qwen/Qwen3-Embedding-4B')` once via `lru_cache`; auto GPU via `torch.cuda.is_available()`
  - [x] Pre-compute dish + global food embedding matrices on startup; cached in MongoDB (`dish_embeddings`, `global_food_embeddings` collections)
  - [x] `recommend(liked_food_ids, top_k=5, dietary_restrictions) -> list[tuple[dish, vendor]]`
    - Embed liked global foods → average → user fingerprint
    - Cosine similarity vs Thai matrix → top-5
    - Look up vendor by `dish_id`
  - [x] Dietary filters: `no_pork` (Halal) and `vegan` via regex on name/sensory/tags; falls back to full set if all filtered out
  - [x] `next_card(liked_ids, seen_ids, dietary_restrictions) -> dict | None`
    - Phase 1 (cold start, < 5 likes): random unseen card
    - Phase 2: most dissimilar unseen card using cached fingerprint
  - [x] `warmup()` / `is_ready()` — background thread loads model at startup, signals readiness
- [x] [services/llm.py](backend/app/services/llm.py)
  - [x] `async get_match_explanation(liked_names, dish_name, fallback_keywords) -> str`
  - [x] Async `ollama.AsyncClient`; `keep_alive=-1` pins model in VRAM between calls
  - [x] `try/except` → returns `match_reason_keywords` fallback on any failure
- [x] [models/schemas.py](backend/app/models/schemas.py) — Pydantic models
  - `RecommendRequest { liked_food_ids: list[str], dietary_restrictions: list[str] = [] }`
  - `RecommendResponse { results: list[{ dish: DishOut, vendor: VendorOut, explanation: str }] }`
  - `NextCardRequest { liked_ids, seen_ids, dietary_restrictions }`
  - `DishOut`, `VendorOut`
- [x] [api/routes.py](backend/app/api/routes.py)
  - [x] `GET /health` — liveness
  - [x] `GET /ready` — 200 when model warm, 503 while loading
  - [x] `GET /global-foods` — returns swipe deck
  - [x] `POST /recommend` — top-5 results; Ollama explanation for rank-1, keyword fallback for ranks 2-5
  - [x] `POST /next-card` — adaptive card selection
- [x] [main.py](backend/app/main.py) — FastAPI app, CORS middleware, static image mount, background warmup thread
- [x] Docker Compose — `mongo` + `ollama` services with healthchecks; `ollama-init` pulls `gemma4:e4b`
- [x] E2E tests — 18 tests in [tests/test_journey.py](backend/tests/test_journey.py), all passing (~27s)
  - Covers: embedding cache, semantic correctness, multi-food input, dietary filtering, adaptive `next_card`, Ollama + fallback paths, error handling (400/422)

**Definition of done:** `POST /recommend` returns 5 valid results with Ollama and offline-fallback paths verified. ✅

---

## Track C — Web Frontend (Streamlit)

**Owner:** _________  
**Files:** [frontend/](frontend/)

- [x] [utils/api_client.py](frontend/utils/api_client.py) — `httpx` wrapper
  - `check_ready()`, `fetch_next_card(liked_ids, seen_ids, dietary_restrictions)`, `get_recommendation(liked_food_ids, dietary_restrictions)`, `dish_image_url(path)`
- [x] [app.py](frontend/app.py) — 4-page flow with session state
  - Session keys: `page`, `liked_ids`, `seen_ids`, `current_card`, `swipe_done`, `results`, `dietary_restrictions`, `model_ready`, `error`
- [x] **Page 1 — Welcome**
  - Hero title, 3-step description, "Start Exploring" button
- [x] **Page 2 — Onboarding**
  - Country dropdown (26+ countries)
  - Auto-detects Muslim-majority countries → pre-selects Halal mode
  - Checkboxes: `☪️ Halal friendly` + `🌱 Vegan`; active filter badges
  - "Start Swiping" button
- [x] **Page 3 — Swipe**
  - Model readiness gate: polls `/ready`, shows loading bar until warm
  - Card display: image + name + 72-char sensory preview
  - `✕ Pass` / `♥ Like` buttons; progress bar (`seen / 20`)
  - "See My Thai Matches" unlocks after 3 likes
  - Done state when all 20 cards exhausted
  - Adaptive card order via `POST /next-card`
- [x] **Page 4 — Results**
  - Tabs: "★ Best Match" + "Match #2–5"
  - Per result: dish image, rank badge, Thai + English name, spice level (`🌶️` scale), tag pills, description, AI explanation, vendor card with Google Maps link, Thai flashcard
  - "↩ Try Again" resets session state
- [x] [components/\_\_init\_\_.py](frontend/components/__init__.py) — HTML/CSS helpers: `inject_css`, `swipe_card_html`, `spice_html`, `tags_html`, `explanation_html`, `rank_badge_html`, `vendor_html`, `flashcard_html`, `done_box_html`

**Definition of done:** end-to-end flow works in browser against the running backend. ✅

---

## Shared / Glue

- [x] Each dev: `cp .env.example .env` in their folder, fill in real values
- [x] LLM runs locally via Ollama — no API key needed (`gemma4:e4b` pulled via Docker)
- [x] First green run: backend on `:8000`, frontend on `:8501`, full demo flow works
- [x] Commit `uv.lock` files from both `backend/` and `frontend/`

## Demo Day Checklist

- [ ] Verify `docker compose up` brings all 5 services healthy from a cold start
- [ ] Confirm Ollama `gemma4:e4b` explanation fires for rank-1 result
- [ ] Verify fallback explanation path (stop Ollama, swipe, confirm keyword fallback text appears)
- [ ] All Google Maps links open correctly on a phone
- [ ] Test Halal auto-detect: select a Muslim-majority country → `no_pork` pre-selected
- [ ] Test Vegan filter: enable vegan → results contain no meat/seafood dishes
- [ ] One dry-run of the full demo script

---

## Branching

```bash
git checkout -b track-a-data
git checkout -b track-b-ml
git checkout -b track-c-ui
```

Open PRs back into `main`. Quick reviews — no nitpicks under hackathon time pressure.
