# Thai Taste-App

Zero-typing, swipe-based AI recommender that matches foreign tourists with hyper-local Thai street food vendors.

Built for **Super AI Engineer Season 6 Hackathon**.

## Repo Layout

```
thai-taste-app/
├── backend/      # FastAPI service: recommender, LLM, data
├── frontend/     # Streamlit UI: swipe flow, result screen
└── README.md
```

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for setup.

## Quick Start

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
uv sync
uv run streamlit run app.py
```
