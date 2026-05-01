# Thai Taste-App

Zero-typing, swipe-based AI recommender that matches foreign tourists with hyper-local Thai street food vendors.

Built for **Super AI Engineer Season 6 Hackathon**.

## How It Works

1. Tourist swipes on familiar global foods (pizza, ramen, tacos...)
2. App embeds liked foods into a taste fingerprint using `fastembed`
3. Cosine similarity matches fingerprint against Thai dish embeddings
4. Gemini API generates a personalised explanation
5. Result shows the dish, nearest vendor, Google Maps link, and a Thai ordering flashcard

## Stack

| Layer | Technology |
|---|---|
| Frontend | Streamlit |
| Backend | FastAPI + Python 3.11 |
| Embeddings | fastembed (ONNX, no torch) |
| LLM | Gemini API (Google AI Studio) |
| Database | MongoDB Atlas Local |
| Local LLM (optional) | Ollama + gemma4 |
| Infra | Docker Compose |

## Repo Layout

```
thai-taste-app/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── config.py         # pydantic-settings
│   │   ├── api/routes.py     # /health, /global-foods, /recommend
│   │   ├── services/
│   │   │   ├── recommender.py  # fastembed + cosine similarity
│   │   │   └── llm.py          # Gemini explanation + fallback
│   │   ├── models/schemas.py   # Pydantic request/response models
│   │   └── data/               # JSON datasets + food images
│   └── pyproject.toml
├── frontend/
│   ├── app.py                # Streamlit swipe → result flow
│   ├── components/           # Reusable UI blocks
│   └── utils/api_client.py   # httpx wrapper for backend
├── docker-compose.yml
└── TASKS.md
```

## Quick Start (Docker — recommended)

```bash
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Run without Ollama (uses Gemini only)
docker compose up --build backend frontend mongo

# Run with local Ollama model (downloads ~7 GB on first run)
docker compose up --build
```

- Frontend: http://localhost:8501
- Backend API: http://localhost:8000
- MongoDB: `mongodb://localhost:27017/?directConnection=true`

## Quick Start (local dev)

```bash
# Backend
cd backend
uv sync
cp .env.example .env   # fill in GEMINI_API_KEY
uv run uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
uv sync
uv run streamlit run app.py
```

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Get free key at Google AI Studio |
| `MONGO_URL` | MongoDB connection string (default: `mongodb://mongo:27017`) |
| `CORS_ORIGINS` | Allowed frontend origins (default: `http://localhost:8501`) |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/global-foods` | Returns swipe deck for frontend |
| POST | `/recommend` | Runs recommender + LLM, returns dish + vendor |
