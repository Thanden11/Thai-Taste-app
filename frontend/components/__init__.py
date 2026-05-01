"""Reusable UI components for Thai Taste."""
import streamlit as st


# ── CSS ───────────────────────────────────────────────────────────────────────

GLOBAL_CSS = """
<style>
/* ---- page chrome ---- */
#MainMenu, footer, header {visibility: hidden;}
.block-container {padding-top: 2rem; padding-bottom: 2rem;}

/* ---- welcome hero ---- */
.hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    color: #E85D04;
    line-height: 1.1;
    margin-bottom: 0.25rem;
}
.hero-sub {
    font-size: 1.25rem;
    color: #555;
    margin-bottom: 2rem;
}
.step-box {
    background: #FFF0E0;
    border-left: 4px solid #E85D04;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
}

/* ---- food card grid ---- */
.card-img {
    border-radius: 10px;
    width: 100%;
    object-fit: cover;
    height: 140px;
}
.card-name {
    font-weight: 600;
    font-size: 0.85rem;
    margin-top: 0.4rem;
    text-align: center;
    color: #222;
}
.card-liked {
    background: #FFF0E0;
    border-radius: 8px;
    border: 2px solid #E85D04;
    padding: 4px;
}
.card-neutral {
    background: #FAFAFA;
    border-radius: 8px;
    border: 2px solid transparent;
    padding: 4px;
}

/* ---- result page ---- */
.dish-title {
    font-size: 2rem;
    font-weight: 800;
    color: #E85D04;
    line-height: 1.2;
}
.dish-thai {
    font-size: 1.3rem;
    color: #888;
    margin-bottom: 1rem;
}
.explanation-box {
    background: #FFF8F0;
    border-left: 4px solid #E85D04;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    font-style: italic;
    color: #333;
    margin: 1rem 0;
    font-size: 1rem;
    line-height: 1.6;
}
.vendor-card {
    background: #F5F5F5;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-top: 1rem;
}
.vendor-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #222;
}
.vendor-distance {
    color: #666;
    font-size: 0.9rem;
}
.flashcard {
    background: linear-gradient(135deg, #E85D04 0%, #F4A261 100%);
    border-radius: 14px;
    padding: 1.5rem 1.75rem;
    color: white;
    text-align: center;
    margin-top: 1rem;
}
.flashcard-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.85;
    margin-bottom: 0.5rem;
}
.flashcard-thai {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
}
.flashcard-phonetic {
    font-size: 1.1rem;
    opacity: 0.9;
    font-style: italic;
}
</style>
"""


def inject_css():
    st.markdown(GLOBAL_CSS, unsafe_allow_html=True)


# ── Welcome page ──────────────────────────────────────────────────────────────

def render_welcome(on_start):
    st.markdown(
        '<div class="hero-title">Thai Taste</div>'
        '<div class="hero-sub">Discover a Thai street food dish perfectly matched to your palate.</div>',
        unsafe_allow_html=True,
    )

    col_steps, col_img = st.columns([1, 1], gap="large")
    with col_steps:
        st.markdown(
            '<div class="step-box">1. Pick global dishes you already love</div>'
            '<div class="step-box">2. Our AI finds your flavour fingerprint</div>'
            '<div class="step-box">3. Get your perfect Thai match + where to eat it</div>',
            unsafe_allow_html=True,
        )
        st.write("")
        if st.button("Start Exploring", type="primary"):
            on_start()

    with col_img:
        st.image(
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836"
            "?auto=format&fit=crop&w=800&q=80",
            caption="Street food awaits",
            use_container_width=True,
        )


# ── Select page ───────────────────────────────────────────────────────────────

_COLS = 4


def render_select(foods: list[dict], liked_ids: set, on_toggle, on_recommend, loading: bool):
    st.subheader("Pick the dishes you love")
    st.caption("Select at least one — the more you pick, the better the match.")

    n = len(liked_ids)
    if n:
        st.info(f"{n} dish{'es' if n > 1 else ''} selected")

    st.write("")

    for row_start in range(0, len(foods), _COLS):
        cols = st.columns(_COLS, gap="small")
        for i, col in enumerate(cols):
            idx = row_start + i
            if idx >= len(foods):
                break
            food = foods[idx]
            fid = food["id"]
            is_liked = fid in liked_ids

            with col:
                wrapper_class = "card-liked" if is_liked else "card-neutral"
                img_url = food.get("remote_image_url") or food.get("image_url", "")
                st.markdown(
                    f'<div class="{wrapper_class}">'
                    f'<img class="card-img" src="{img_url}" />'
                    f'<div class="card-name">{food["name"]}</div>'
                    "</div>",
                    unsafe_allow_html=True,
                )
                label = "Liked" if is_liked else "Like"
                btn_type = "primary" if is_liked else "secondary"
                if st.button(
                    label,
                    key=f"like_{fid}",
                    type=btn_type,
                    use_container_width=True,
                ):
                    on_toggle(fid)

    st.write("")
    st.divider()

    btn_col, _ = st.columns([1, 3])
    with btn_col:
        if loading:
            st.button("Finding match...", disabled=True, use_container_width=True)
        else:
            if st.button(
                "Find My Thai Match",
                type="primary",
                disabled=(n == 0),
                use_container_width=True,
            ):
                on_recommend()


# ── Result page ───────────────────────────────────────────────────────────────

def render_result(result: dict, on_retry):
    dish = result["dish"]
    vendor = result["vendor"]
    explanation = result["explanation"]

    st.markdown(
        '<p style="color:#E85D04;font-weight:700;font-size:0.9rem;'
        'text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">'
        "Your Thai Match</p>",
        unsafe_allow_html=True,
    )

    img_col, info_col = st.columns([1, 1], gap="large")

    with img_col:
        dish_img = dish.get("image_url", "")
        if dish_img:
            from utils.api_client import dish_image_url
            st.image(dish_image_url(dish_img), use_container_width=True)

    with info_col:
        st.markdown(
            f'<div class="dish-title">{dish["english_name"]}</div>'
            f'<div class="dish-thai">{dish["thai_name"]} &middot; {dish["name"]}</div>',
            unsafe_allow_html=True,
        )
        st.write(dish["description"])
        st.markdown(
            f'<div class="explanation-box">"{explanation}"</div>',
            unsafe_allow_html=True,
        )

    st.write("")
    v_col, f_col = st.columns([1, 1], gap="large")

    with v_col:
        st.markdown(
            f'<div class="vendor-card">'
            f'<div class="vendor-name">{vendor["vendor_name"]}</div>'
            f'<div class="vendor-distance">{vendor["distance"]} away</div>'
            f"</div>",
            unsafe_allow_html=True,
        )
        st.write("")
        st.link_button("Open in Google Maps", vendor["google_maps_url"])

    with f_col:
        st.markdown(
            f'<div class="flashcard">'
            f'<div class="flashcard-label">Say it in Thai</div>'
            f'<div class="flashcard-thai">{vendor["flashcard_thai"]}</div>'
            f'<div class="flashcard-phonetic">{vendor["flashcard_phonetic"]}</div>'
            f"</div>",
            unsafe_allow_html=True,
        )

    st.write("")
    if st.button("Try Again"):
        on_retry()
