"""Streamlit entrypoint: welcome → food selection → result flow."""
import streamlit as st

from components import inject_css, render_welcome, render_select, render_result
from utils.api_client import get_global_foods, get_recommendation

st.set_page_config(
    page_title="Thai Taste",
    page_icon="🍜",
    layout="wide",
    initial_sidebar_state="collapsed",
)

inject_css()


# ── Session state ─────────────────────────────────────────────────────────────

def _init():
    st.session_state.setdefault("page", "welcome")
    st.session_state.setdefault("liked_ids", set())
    st.session_state.setdefault("result", None)
    st.session_state.setdefault("loading", False)
    st.session_state.setdefault("error", None)


_init()


# ── Data ──────────────────────────────────────────────────────────────────────

@st.cache_data(ttl=3600, show_spinner="Loading dishes...")
def _load_foods() -> list[dict]:
    return get_global_foods()


# ── Navigation helpers ────────────────────────────────────────────────────────

def _go_select():
    st.session_state.page = "select"
    st.session_state.liked_ids = set()
    st.session_state.result = None
    st.session_state.error = None
    st.rerun()


def _toggle_like(food_id: str):
    ids: set = st.session_state.liked_ids
    if food_id in ids:
        ids.discard(food_id)
    else:
        ids.add(food_id)
    st.rerun()


def _do_recommend():
    liked = list(st.session_state.liked_ids)
    st.session_state.loading = True
    st.session_state.error = None

    try:
        result = get_recommendation(liked)
        st.session_state.result = result
        st.session_state.page = "result"
    except Exception as exc:
        st.session_state.error = str(exc)
    finally:
        st.session_state.loading = False

    st.rerun()


# ── Page routing ──────────────────────────────────────────────────────────────

page = st.session_state.page

if page == "welcome":
    render_welcome(on_start=_go_select)

elif page == "select":
    if st.session_state.error:
        st.error(f"Something went wrong: {st.session_state.error}")

    try:
        foods = _load_foods()
    except Exception as exc:
        st.error(f"Could not reach the backend: {exc}")
        st.stop()

    render_select(
        foods=foods,
        liked_ids=st.session_state.liked_ids,
        on_toggle=_toggle_like,
        on_recommend=_do_recommend,
        loading=st.session_state.loading,
    )

elif page == "result":
    if st.session_state.result is None:
        _go_select()
    else:
        render_result(result=st.session_state.result, on_retry=_go_select)
