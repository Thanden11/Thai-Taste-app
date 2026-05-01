"""UI helpers for Thai Taste — CSS injection and HTML fragment builders.

All functions either inject CSS into the page or return raw HTML strings.
Interactive widgets (buttons, columns, tabs) live in app.py.
"""
import streamlit as st

# ── Global CSS ────────────────────────────────────────────────────────────────

GLOBAL_CSS = """
<style>
/* ---- chrome ---- */
#MainMenu, footer, header {visibility: hidden;}
.block-container {padding-top: 1.5rem; padding-bottom: 2rem;}

/* ---- welcome ---- */
.hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    color: #E85D04;
    line-height: 1.1;
    margin-bottom: 0.25rem;
}
.hero-sub {
    font-size: 1.2rem;
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

/* ---- swipe card ---- */
.swipe-card {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 6px 28px rgba(0,0,0,0.13);
    background: #fff;
    margin-bottom: 1rem;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
}
.swipe-card img {
    width: 100%;
    height: 300px;
    object-fit: cover;
    display: block;
}
.swipe-card-footer {
    padding: 14px 18px 16px;
}
.swipe-card-name {
    font-size: 1.35rem;
    font-weight: 700;
    color: #1A1A1A;
    margin: 0;
}

/* ---- progress hint ---- */
.progress-hint {
    text-align: center;
    font-size: 0.85rem;
    color: #999;
    margin-bottom: 0.5rem;
    letter-spacing: 0.02em;
}
.progress-ready {
    text-align: center;
    font-size: 0.9rem;
    color: #2A9D5C;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

/* ---- all-done state ---- */
.done-box {
    text-align: center;
    padding: 2rem;
    background: #FFF0E0;
    border-radius: 16px;
    margin: 1rem 0;
}
.done-emoji {
    font-size: 3rem;
    margin-bottom: 0.5rem;
}
.done-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1A1A1A;
}

/* ---- results ---- */
.section-eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    color: #E85D04;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.15rem;
}
.dish-title {
    font-size: 2rem;
    font-weight: 800;
    color: #E85D04;
    line-height: 1.15;
}
.dish-thai {
    font-size: 1.1rem;
    color: #888;
    margin-bottom: 0.75rem;
}
.explanation-box {
    background: #FFF8F0;
    border-left: 4px solid #E85D04;
    border-radius: 8px;
    padding: 0.9rem 1.1rem;
    font-style: italic;
    color: #333;
    margin: 0.75rem 0 1rem;
    font-size: 0.97rem;
    line-height: 1.6;
}
.rank-badge {
    display: inline-block;
    background: #E85D04;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    border-radius: 999px;
    padding: 3px 12px;
    margin-bottom: 0.5rem;
}
.vendor-card {
    background: #F5F5F5;
    border-radius: 12px;
    padding: 0.9rem 1.1rem;
}
.vendor-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: #222;
}
.vendor-distance {
    color: #666;
    font-size: 0.875rem;
    margin-top: 2px;
}
.flashcard {
    background: linear-gradient(135deg, #E85D04 0%, #F4A261 100%);
    border-radius: 14px;
    padding: 1.25rem 1.5rem;
    color: white;
    text-align: center;
}
.flashcard-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.8;
    margin-bottom: 0.4rem;
}
.flashcard-thai {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}
.flashcard-phonetic {
    font-size: 1rem;
    opacity: 0.9;
    font-style: italic;
}
</style>
"""


def inject_css() -> None:
    st.markdown(GLOBAL_CSS, unsafe_allow_html=True)


# ── HTML fragment builders ────────────────────────────────────────────────────

def swipe_card_html(card: dict) -> str:
    img = card.get("remote_image_url") or card.get("image_url", "")
    name = card["name"]
    return (
        f'<div class="swipe-card">'
        f'<img src="{img}" alt="{name}" />'
        f'<div class="swipe-card-footer">'
        f'<p class="swipe-card-name">{name}</p>'
        f'</div></div>'
    )


def explanation_html(text: str) -> str:
    return f'<div class="explanation-box">"{text}"</div>'


def rank_badge_html(rank: int) -> str:
    label = "Best Match" if rank == 0 else f"Match #{rank + 1}"
    return f'<span class="rank-badge">{label}</span>'


def vendor_html(vendor: dict) -> str:
    return (
        f'<div class="vendor-card">'
        f'<div class="vendor-name">{vendor["vendor_name"]}</div>'
        f'<div class="vendor-distance">{vendor["distance"]} away</div>'
        f'</div>'
    )


def flashcard_html(vendor: dict) -> str:
    return (
        f'<div class="flashcard">'
        f'<div class="flashcard-label">Say it in Thai</div>'
        f'<div class="flashcard-thai">{vendor["flashcard_thai"]}</div>'
        f'<div class="flashcard-phonetic">{vendor["flashcard_phonetic"]}</div>'
        f'</div>'
    )


def done_box_html() -> str:
    return (
        '<div class="done-box">'
        '<div class="done-emoji">🎉</div>'
        '<div class="done-title">You\'ve seen all the dishes!</div>'
        '</div>'
    )
