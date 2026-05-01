# Backend — Thai Taste-App

FastAPI service handling vector recommendation and Gemini LLM explanation.

## Stack

- **FastAPI** — HTTP API
- **fastembed** — text embeddings via ONNX (no PyTorch)
- **scikit-learn / numpy** — cosine similarity
- **Google Generative AI** — Gemini explanation
- **pydantic-settings** — config from `.env`
- **MongoDB** — optional persistence

## Setup

```bash
uv sync
cp .env.example .env   # fill in GEMINI_API_KEY
uv run uvicorn app.main:app --reload
```

Server runs at http://localhost:8000

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | Get free key at Google AI Studio |
| `MONGO_URL` | `mongodb://mongo:27017` | MongoDB connection |
| `CORS_ORIGINS` | `http://localhost:8501` | Allowed frontend origins |
| `DATA_DIR` | `/app/app/data` | Path to JSON data files |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{"status": "ok"}` |
| GET | `/global-foods` | Returns swipe deck (global foods list) |
| POST | `/recommend` | Body: `{"liked_food_ids": [...]}` → dish + vendor + explanation |

## Layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, route registration
│   ├── config.py            # Settings via pydantic-settings
│   ├── api/
│   │   └── routes.py        # All HTTP routes
│   ├── services/
│   │   ├── recommender.py   # fastembed + cosine similarity
│   │   └── llm.py           # Gemini explanation with fallback
│   ├── models/
│   │   └── schemas.py       # Pydantic request/response models
│   ├── database/
│   │   └── db.py            # MongoDB connection
│   └── data/
│       ├── global_foods.json
│       ├── thai_dishes.json
│       ├── vendors.json
│       └── images/
├── tests/
├── .env.example
└── pyproject.toml
```

## Running Tests

```bash
uv run pytest
```
