"""Streamlit entrypoint: welcome → swipe (adaptive) → results (top-5)."""
import streamlit as st

from components import (
    inject_css,
    swipe_card_html,
    explanation_html,
    rank_badge_html,
    vendor_html,
    flashcard_html,
    done_box_html,
)
from utils.api_client import (
    fetch_next_card,
    get_recommendation,
    dish_image_url,
)

st.set_page_config(
    page_title="Thai Taste",
    page_icon="🍜",
    layout="wide",
    initial_sidebar_state="collapsed",
)

inject_css()

MIN_LIKES = 3
TOTAL_FOODS = 20


# ── Session state ─────────────────────────────────────────────────────────────

def _init() -> None:
    st.session_state.setdefault("page", "welcome")
    st.session_state.setdefault("liked_ids", [])
    st.session_state.setdefault("seen_ids", [])
    st.session_state.setdefault("current_card", None)
    st.session_state.setdefault("swipe_done", False)
    st.session_state.setdefault("results", [])
    st.session_state.setdefault("error", None)


_init()


# ── Navigation helpers ────────────────────────────────────────────────────────

def _reset_and_go(page: str) -> None:
    st.session_state.page = page
    st.session_state.liked_ids = []
    st.session_state.seen_ids = []
    st.session_state.current_card = None
    st.session_state.swipe_done = False
    st.session_state.results = []
    st.session_state.error = None
    st.rerun()


# ── Pages ─────────────────────────────────────────────────────────────────────

def render_welcome() -> None:
    st.markdown(
        '<div class="hero-title">Thai Taste</div>'
        '<div class="hero-sub">Discover a Thai street food dish perfectly matched to your palate.</div>',
        unsafe_allow_html=True,
    )

    steps_col, img_col = st.columns([1, 1], gap="large")

    with steps_col:
        st.markdown(
            '<div class="step-box">🍔 &nbsp; Swipe right on global dishes you love</div>'
            '<div class="step-box">🤖 &nbsp; AI finds your flavour fingerprint</div>'
            '<div class="step-box">🍜 &nbsp; Get your top Thai matches + directions</div>',
            unsafe_allow_html=True,
        )
        st.write("")
        if st.button("Start Exploring", type="primary"):
            _reset_and_go("swipe")

    with img_col:
        st.image(
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836"
            "?auto=format&fit=crop&w=800&q=80",
            caption="Thai street food awaits",
            width="stretch",
        )


# ── Swipe ─────────────────────────────────────────────────────────────────────

def _load_next_card() -> None:
    """Fetch next adaptive card and store in session state."""
    card = fetch_next_card(
        st.session_state.liked_ids,
        st.session_state.seen_ids,
    )
    if card is None:
        st.session_state.swipe_done = True
        st.session_state.current_card = None
    else:
        st.session_state.current_card = card


def _do_recommend() -> None:
    with st.spinner("Finding your Thai matches…"):
        try:
            results = get_recommendation(st.session_state.liked_ids)
            st.session_state.results = results
            st.session_state.page = "results"
        except Exception as exc:
            st.session_state.error = str(exc)
    st.rerun()


def render_swipe() -> None:
    liked_count = len(st.session_state.liked_ids)
    seen_count = len(st.session_state.seen_ids)

    # ── Header row ──────────────────────────────────────────────────────────
    left, mid, right = st.columns([1, 4, 1])
    with left:
        if st.button("← Back", key="swipe_back"):
            _reset_and_go("welcome")
    with mid:
        st.markdown(
            "<h3 style='text-align:center;margin:0;color:#1A1A1A'>Pick your favourites</h3>",
            unsafe_allow_html=True,
        )
    with right:
        if liked_count > 0:
            st.markdown(
                f"<div style='text-align:right;color:#E85D04;font-weight:700;font-size:1.1rem'>"
                f"♥ {liked_count}</div>",
                unsafe_allow_html=True,
            )

    # ── Progress bar ────────────────────────────────────────────────────────
    st.progress(min(seen_count / TOTAL_FOODS, 1.0))

    # ── Status hint ─────────────────────────────────────────────────────────
    if liked_count < MIN_LIKES:
        remaining = MIN_LIKES - liked_count
        st.markdown(
            f'<p class="progress-hint">← Pass &nbsp;·&nbsp; Like → &nbsp;&nbsp;|&nbsp;&nbsp;'
            f'Like {remaining} more to unlock matches</p>',
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            '<p class="progress-ready">✓ Matches ready — keep swiping or see results below</p>',
            unsafe_allow_html=True,
        )

    st.write("")

    # ── Fetch card if needed ─────────────────────────────────────────────────
    if not st.session_state.swipe_done and st.session_state.current_card is None:
        with st.spinner("Loading next dish…"):
            try:
                _load_next_card()
            except Exception as exc:
                st.error(f"Could not reach the backend: {exc}")
                st.stop()

    # ── All-done state ───────────────────────────────────────────────────────
    if st.session_state.swipe_done:
        _, center, _ = st.columns([1, 2, 1])
        with center:
            st.markdown(done_box_html(), unsafe_allow_html=True)
            st.write("")
            if liked_count > 0:
                if st.button(
                    "See My Thai Matches  →",
                    type="primary",
                    use_container_width=True,
                    key="done_see_matches",
                ):
                    _do_recommend()
            else:
                st.caption("You need to like at least one dish.")
                if st.button("Start Over", use_container_width=True, key="done_restart"):
                    _reset_and_go("welcome")
        return

    # ── Card display ─────────────────────────────────────────────────────────
    card = st.session_state.current_card
    if card is None:
        return

    _, card_col, _ = st.columns([1, 2, 1])
    with card_col:
        st.markdown(swipe_card_html(card), unsafe_allow_html=True)

        pass_col, like_col = st.columns(2, gap="medium")
        with pass_col:
            if st.button("✕  Pass", use_container_width=True, key="btn_pass"):
                st.session_state.seen_ids.append(card["id"])
                st.session_state.current_card = None
                st.rerun()
        with like_col:
            if st.button("♥  Like", type="primary", use_container_width=True, key="btn_like"):
                st.session_state.liked_ids.append(card["id"])
                st.session_state.seen_ids.append(card["id"])
                st.session_state.current_card = None
                st.rerun()

        # "See Matches" CTA floats in after MIN_LIKES
        if liked_count >= MIN_LIKES:
            st.write("")
            if st.button(
                "See My Thai Matches  →",
                type="primary",
                use_container_width=True,
                key="btn_see_matches",
            ):
                _do_recommend()


# ── Results ───────────────────────────────────────────────────────────────────

def render_results() -> None:
    results: list[dict] = st.session_state.results
    if not results:
        _reset_and_go("swipe")
        return

    st.markdown('<p class="section-eyebrow">Your Thai Matches</p>', unsafe_allow_html=True)
    st.caption(f"Top {len(results)} dishes matched to your taste — swipe through the tabs")
    st.write("")

    tab_labels = ["★ Best Match"] + [f"Match #{i + 1}" for i in range(1, len(results))]
    tabs = st.tabs(tab_labels)

    for rank, (tab, result) in enumerate(zip(tabs, results)):
        dish = result["dish"]
        vendor = result["vendor"]
        explanation = result["explanation"]

        with tab:
            img_col, info_col = st.columns([1, 1], gap="large")

            with img_col:
                st.image(dish_image_url(dish["image_url"]), width="stretch")

            with info_col:
                st.markdown(rank_badge_html(rank), unsafe_allow_html=True)
                st.markdown(
                    f'<div class="dish-title">{dish["english_name"]}</div>'
                    f'<div class="dish-thai">{dish["thai_name"]} &middot; {dish["name"]}</div>',
                    unsafe_allow_html=True,
                )
                st.write(dish["description"])
                st.markdown(explanation_html(explanation), unsafe_allow_html=True)

            st.write("")
            vendor_col, flash_col = st.columns([1, 1], gap="large")

            with vendor_col:
                st.markdown(vendor_html(vendor), unsafe_allow_html=True)
                st.write("")
                st.link_button("Navigate  →", vendor["google_maps_url"])

            with flash_col:
                st.markdown(flashcard_html(vendor), unsafe_allow_html=True)

    st.write("")
    st.divider()
    _, btn_col, _ = st.columns([1, 1, 1])
    with btn_col:
        if st.button("↩  Try Again", use_container_width=True, key="try_again"):
            _reset_and_go("welcome")


# ── Router ────────────────────────────────────────────────────────────────────

if st.session_state.error:
    st.error(f"Something went wrong: {st.session_state.error}")
    if st.button("Retry"):
        st.session_state.error = None
        st.rerun()

page = st.session_state.page

if page == "welcome":
    render_welcome()
elif page == "swipe":
    render_swipe()
elif page == "results":
    render_results()
else:
    _reset_and_go("welcome")
