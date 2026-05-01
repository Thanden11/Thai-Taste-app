# Backend — Thai Taste-App

FastAPI service handling recommendation, vector matching, and LLM explanation.

## Setup

```bash
uv sync
cp .env.example .env   # then fill in GEMINI_API_KEY
uv run uvicorn app.main:app --reload
```

## Layout

```
backend/
├── app/
│   ├── main.py           # FastAPI app entrypoint
│   ├── config.py         # settings via pydantic-settings
│   ├── api/              # HTTP routes
│   ├── services/         # recommender, llm
│   ├── database/         # db connection / session
│   ├── models/           # pydantic schemas / ORM models
│   └── data/             # mock JSON datasets
├── tests/
├── .env.example
└── pyproject.toml
```
