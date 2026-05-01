# Task Board — Thai Taste-App

Hackathon timeline: **< 14 hours**. Three parallel tracks. Each owner ticks boxes as they go.

---

## Track A — Data Engineering

**Owner:** Payachai  
**Files:** [backend/app/data/](backend/app/data/)

- [x] Fill [global_foods.json](backend/app/data/global_foods.json) with **20** items
  - Fields: `id`, `name`, `image_url`, `image_source_url`, `sensory_string`, `remote_image_url`, `local_image_path`, `asset_status`
  - Dense sensory strings (flavor, texture, ingredient, cooking style)
  - **Do NOT** put country names in `sensory_string`
- [x] Fill [thai_dishes.json](backend/app/data/thai_dishes.json) with **50** items
  - Fields: `dish_id`, `name`, `thai_name`, `english_name`, `image_url`, `image_source_url`, `sensory_string`, `match_reason_keywords`, `spice_level`, `tags`, `remote_image_url`, `local_image_path`, `asset_status`
  - `match_reason_keywords` is the offline LLM fallback — keep it short (3 adjectives)
- [x] Fill [vendors.json](backend/app/data/vendors.json) with **50** items
  - Fields: `vendor_id`, `dish_id`, `vendor_name`, `distance`, `google_maps_url`, `flashcard_thai`, `flashcard_phonetic`
  - Every `dish_id` in vendors.json **must exist** in thai_dishes.json
- [x] Scope vendors to demo areas: Banthat Thong, Song Wat, and Chatuchak
- [x] Fix image mapping so `local_image_path` points to existing files under `backend/app/data/images/...`
- [x] Sanity check: all 3 JSON files parse, every vendor maps to a real dish, and all local image paths resolve

**Definition of done:** all three files validate as JSON, every vendor maps to a real dish, and every local image path points to an existing downloaded asset.

---

## Track B — ML & Generative Explanation (Backend)

**Owner:** _________  
**Files:** [backend/app/services/](backend/app/services/), [backend/app/api/](backend/app/api/), [backend/app/config.py](backend/app/config.py), [backend/app/main.py](backend/app/main.py)

- [x] [config.py](backend/app/config.py) — load `OLLAMA_URL`, `OLLAMA_MODEL`, `DATA_DIR`, `CORS_ORIGINS`, `MONGO_URL` via `pydantic-settings` *(switched from Gemini to local Ollama/gemma4:e4b)*
- [x] [services/recommender.py](backend/app/services/recommender.py)
  - [x] Load `SentenceTransformer('Qwen/Qwen3-Embedding-4B')` once via `lru_cache`
  - [x] Pre-compute Thai dish embedding matrix on startup, cached in MongoDB `dish_embeddings` collection
  - [x] `def recommend(liked_food_ids: list[str]) -> tuple[dish, vendor]`
    - Embed liked global foods → average → user fingerprint
    - Cosine similarity vs Thai matrix → argmax
    - Look up vendor by `dish_id`
- [x] [services/llm.py](backend/app/services/llm.py)
  - [x] `def get_match_explanation(liked_names, dish_name, fallback_keywords) -> str`
  - [x] Wraps Ollama call in `try/except` → returns keyword fallback string on any failure
  - [x] Uses prompt ("We matched you with this because...") via local `ollama.Client`
- [x] [models/schemas.py](backend/app/models/schemas.py) — Pydantic request/response models
  - `RecommendRequest { liked_food_ids: list[str] }`
  - `RecommendResponse { dish, vendor, explanation }`
- [x] [api/routes.py](backend/app/api/routes.py)
  - [x] `GET /health`
  - [x] `GET /global-foods` — returns the swipe deck for the frontend
  - [x] `POST /recommend` — runs recommender + LLM, returns full result
- [x] [main.py](backend/app/main.py) — FastAPI app, CORS middleware, mount routes
- [x] Docker Compose — Mongo + Ollama services with healthchecks; `ollama-init` pulls `gemma4:e4b`
- [x] E2E tests — 18 tests in [tests/test_journey.py](backend/tests/test_journey.py), all passing (27s)
  - Verified: embedding cache (Mongo), semantic correctness, Ollama explanation, error handling

**Definition of done:** `POST /recommend` returns a valid result with both Ollama and offline-fallback paths verified. ✅

---

## Track C — Streamlit Frontend

**Owner:** _________  
**Files:** [frontend/](frontend/)

- [ ] [utils/api_client.py](frontend/utils/api_client.py) — thin `httpx` wrapper around `BACKEND_URL`
  - `get_global_foods()`, `post_recommend(liked_ids)`
- [ ] [app.py](frontend/app.py) — main entrypoint, owns session state
  - Session keys: `current_swipe_index`, `liked_foods`, `app_stage`, `result`
- [ ] **Screen 1 — Welcome** (`app_stage == "welcome"`)
  - Title, short pitch, "Start" button → flips stage to `swiping`
- [ ] **Screen 2 — Swiping** (`app_stage == "swiping"`)
  - Show food image + name from current index
  - Two big buttons: ❌ Nah / ❤️ Love it
  - On Love: append to `liked_foods`. Always: increment index
  - After 5 swipes → flip to `matching`
- [ ] **Screen 3 — Matching** (`app_stage == "matching"`)
  - `st.spinner("Vectorizing your palate...")`
  - Call `POST /recommend`, save response, flip to `result`
- [ ] **Screen 4 — Result** (`app_stage == "result"`)
  - [ ] Dish image + Thai name + English name + explanation
  - [ ] Vendor name + distance + `st.link_button("📍 Take me there", maps_url)`
  - [ ] Thai ordering flashcard (Thai script + phonetic)
  - [ ] "Try again" button → reset session state
- [ ] [components/](frontend/components/) — extract repeated UI blocks (food card, flashcard) once they appear twice

**Definition of done:** end-to-end flow works in browser against the running backend.

---

## Shared / Glue

- [ ] Each dev: `cp .env.example .env` in their folder, fill in real values
- [x] LLM runs locally via Ollama — no API key needed (`gemma4:e4b` pulled via Docker)
- [ ] First green run: backend on `:8000`, frontend on `:8501`, full demo flow works
- [ ] Final: commit `uv.lock` files from both `backend/` and `frontend/`

## Demo Day Checklist

- [ ] Phone hotspot ready in case venue Wi-Fi blocks Gemini
- [ ] Verified fallback explanation path (kill Wi-Fi, swipe, see fallback text)
- [ ] All Google Maps links open correctly on a phone
- [ ] One dry-run of the full demo script (README §"Demo Script")

---

## Branching

```bash
# create a branch per track
git checkout -b track-a-data
git checkout -b track-b-ml
git checkout -b track-c-ui
```

Open PRs back into `main`. Quick reviews — no nitpicks under hackathon time pressure.
