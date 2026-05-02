# Thai Taste

Zero-typing, swipe-based AI recommender that matches foreign tourists with hyper-local Thai street food vendors.

Built for **Super AI Engineer Season 6 Hackathon**.

## How It Works

1. Tourist selects their country and dietary preferences (Halal / Vegan)
2. Tourist swipes on familiar global foods (BBQ brisket, ramen, pizza...)
3. App builds a taste fingerprint by averaging `Qwen3-Embedding-4B` vectors of liked foods
4. Cosine similarity matches the fingerprint against 50 Thai dish embeddings
5. Local Ollama (`gemma4:e4b`) generates a personalised explanation for the top match
6. Results show the top 5 dishes, nearest vendor, Google Maps link, and a Thai ordering flashcard

## Stack

| Layer | Technology |
|---|---|
| Frontend | Streamlit |
| Backend | FastAPI + Python 3.11 |
| Embeddings | sentence-transformers (`Qwen/Qwen3-Embedding-4B`, GPU-accelerated) |
| LLM | Ollama (`gemma4:e4b`, local) |
| Embedding Cache | MongoDB Atlas Local |
| Infra | Docker Compose (5 services) |

## Repo Layout

```
thai-taste-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + background warmup lifespan
│   │   ├── config.py            # Pydantic Settings
│   │   ├── api/routes.py        # /health /ready /global-foods /recommend /next-card
│   │   ├── services/
│   │   │   ├── recommender.py   # Qwen3 embeddings + cosine similarity + dietary filters
│   │   │   └── llm.py           # Ollama async explanation + keyword fallback
│   │   ├── models/schemas.py    # Pydantic request/response models
│   │   ├── database/db.py       # MongoDB singleton (embedding cache)
│   │   └── data/                # JSON datasets (20 global foods, 50 dishes, 50 vendors) + images
│   ├── tests/                   # 18 E2E tests (pytest)
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── app.py                   # Streamlit 4-page flow (welcome → onboarding → swipe → results)
│   ├── components/__init__.py   # HTML/CSS helper functions
│   ├── utils/api_client.py      # httpx wrapper for backend
│   ├── Dockerfile
│   └── pyproject.toml
├── docs/
│   └── recommend-flowchart.md   # Mermaid flowcharts
├── docker-compose.yml           # backend, frontend, mongo, ollama, ollama-init
└── TASKS.md
```

## Quick Start (Docker — recommended)

```bash
# Run core stack (backend, frontend, MongoDB, Ollama)
docker compose up --build backend frontend mongo ollama

# ollama-init pulls gemma4:e4b automatically (~7 GB on first run)
```

| Service | URL |
|---|---|
| Web frontend | http://localhost:8501 |
| Backend API | http://localhost:8000 |
| MongoDB | `mongodb://localhost:27017/?directConnection=true` |
| Ollama | http://localhost:11434 |

## Quick Start (local dev)

```bash
# Backend
cd backend
uv sync
cp .env.example .env   # set OLLAMA_URL if Ollama isn't on localhost
uv run uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
uv sync
uv run streamlit run app.py
```

> **Note:** The backend loads `Qwen/Qwen3-Embedding-4B` on startup. It automatically uses CUDA if available, otherwise falls back to CPU. Pre-warm is complete when `GET /ready` returns `200`.

## Environment Variables

### Backend (`.env.example`)

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `gemma4:e4b` | Model for explanations |
| `MONGO_URL` | `mongodb://mongo:27017` | Embedding cache database |
| `CORS_ORIGINS` | `http://localhost:8501,...` | Allowed frontend origins |
| `APP_ENV` | `development` | Environment tag |
| `LOG_LEVEL` | `INFO` | Log verbosity |

### Frontend (`.env.example`)

| Variable | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8000` | Backend API URL |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check — always returns `{"status":"ok"}` |
| GET | `/ready` | Readiness check — `200` when embedding model is warm, `503` while loading |
| GET | `/global-foods` | Returns the 20-card swipe deck |
| POST | `/recommend` | Runs embedding match + Ollama explanation, returns top-5 dish+vendor results |
| POST | `/next-card` | Adaptive card selection (random until 5 likes, then embedding-driven) |

### POST /recommend

```json
// Request
{
  "liked_food_ids": ["g_01", "g_08"],
  "dietary_restrictions": ["no_pork"]   // [] | ["no_pork"] | ["vegan"]
}

// Response
{
  "results": [
    {
      "dish": {
        "dish_id": "t_01",
        "name": "Khao Soi Kai",
        "thai_name": "ข้าวซอยไก่",
        "english_name": "Northern Curry Noodles",
        "description": "...",
        "image_url": "/images/thai_dishes/t_01-khao-soi-kai.jpg",
        "sensory_string": "Creamy coconut curry, warm dried spice...",
        "spice_level": 2,
        "tags": ["noodles", "curry", "chicken", "comfort"]
      },
      "vendor": {
        "vendor_id": "v_01",
        "vendor_name": "Khao Soi Stand",
        "distance": "250m",
        "google_maps_url": "https://maps.google.com/...",
        "flashcard_thai": "ข้าวซอยไก่",
        "flashcard_phonetic": "khao soi gai"
      },
      "explanation": "You'll love this — the creamy coconut base mirrors the richness you love in ramen..."
    }
    // ... 4 more results
  ]
}
```

### POST /next-card

```json
// Request
{
  "liked_ids": ["g_01"],
  "seen_ids": ["g_01", "g_02"],
  "dietary_restrictions": []
}

// Response — single global food card dict, or 404 when all cards exhausted
```

## Dietary Filters

Both `no_pork` (Halal) and `vegan` restrictions flow end-to-end:

- Onboarding auto-detects Muslim-majority countries and pre-selects Halal mode
- Filters propagate through `/next-card` (swipe deck) and `/recommend` (results)
- Implemented via regex matching on dish name, sensory string, and tags in the recommender

## Datasets

| Dataset | Count | Notes |
|---|---|---|
| Global foods (swipe deck) | 20 | Diverse cuisines; sensory strings have no country names |
| Thai dishes | 50 | Bangkok street food; spice levels 0–5; full Thai/English names |
| Vendors | 50 | 1:1 with dishes; includes Google Maps links and Thai flashcards |

## Running Tests

```bash
cd backend
uv run pytest tests/ -v   # 18 E2E tests (~27s)
```

Tests cover: health checks, recommendation semantics, dietary filtering, adaptive card selection, MongoDB cache consistency, error handling (400/422), and Ollama fallback paths.
