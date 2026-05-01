# Frontend — Thai Taste-App

Streamlit UI: swipe flow → matching → result screen.

## Setup

```bash
uv sync
cp .env.example .env
uv run streamlit run app.py
```

## Layout

```
frontend/
├── app.py                # Streamlit entrypoint
├── pages/                # Multi-page screens (swipe, result)
├── components/           # Reusable UI blocks
├── utils/                # API client, session helpers
├── assets/               # Images, css
├── .env.example
└── pyproject.toml
```
