# Frontend — Thai Taste-App

Streamlit UI: 4-screen swipe flow from welcome to dish result.

## Stack

- **Streamlit** — UI framework
- **httpx** — async HTTP client for backend calls
- **pydantic** — response model validation

## Setup

```bash
uv sync
cp .env.example .env   # set BACKEND_URL if not using Docker
uv run streamlit run app.py
```

App runs at http://localhost:8501

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8000` | FastAPI backend URL |

## Screen Flow

```
welcome  →  swiping  →  matching  →  result
```

| Stage | Description |
|---|---|
| `welcome` | Title + pitch + Start button |
| `swiping` | Show food image, ❌ Nah / ❤️ Love it buttons. After 5 swipes → next stage |
| `matching` | Spinner while calling `POST /recommend` |
| `result` | Dish image + name + explanation + vendor + map link + Thai flashcard |

## Session State Keys

| Key | Type | Description |
|---|---|---|
| `app_stage` | str | Current screen: `welcome`, `swiping`, `matching`, `result` |
| `current_swipe_index` | int | Index into global foods list |
| `liked_foods` | list | Food IDs the user liked |
| `result` | dict | Response from `/recommend` |

## Layout

```
frontend/
├── app.py                 # Entrypoint, session state, screen router
├── components/            # Reusable UI blocks (food card, flashcard)
├── utils/
│   └── api_client.py      # httpx wrapper: get_global_foods(), post_recommend()
├── .streamlit/
│   └── config.toml        # Theme config
├── .env.example
└── pyproject.toml
```
