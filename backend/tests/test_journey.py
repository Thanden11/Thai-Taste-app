"""E2E journey tests against the live backend (requires docker compose up)."""

DISH_FIELDS = {
    "dish_id",
    "name",
    "thai_name",
    "english_name",
    "description",
    "image_url",
    "sensory_string",
}
VENDOR_FIELDS = {"vendor_id", "vendor_name", "distance", "google_maps_url", "flashcard_thai", "flashcard_phonetic"}

# ── Journey 1: Health Check ───────────────────────────────────────────────────

def test_health(api):
    r = api.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ── Journey 2: Browse Global Foods ───────────────────────────────────────────

def test_global_foods_returns_list(api):
    r = api.get("/global-foods")
    assert r.status_code == 200
    foods = r.json()
    assert isinstance(foods, list) and len(foods) > 0


def test_global_foods_schema(api):
    foods = api.get("/global-foods").json()
    for food in foods:
        assert {"id", "name", "sensory_string"}.issubset(food.keys())


def test_global_foods_contains_mac_and_cheese(api):
    ids = {f["id"] for f in api.get("/global-foods").json()}
    assert "g_02" in ids, "Mac and Cheese (g_02) must exist for semantic tests"


# ── Journey 3: Recommend — Creamy/Rich Input ─────────────────────────────────

def test_recommend_mac_and_cheese_status(api):
    r = api.post("/recommend", json={"liked_food_ids": ["g_02"]})
    assert r.status_code == 200


def test_recommend_returns_results_list(mac_response):
    assert "results" in mac_response
    assert isinstance(mac_response["results"], list)
    assert len(mac_response["results"]) == 5


def test_recommend_mac_and_cheese_top_level_keys(mac_response):
    top = mac_response["results"][0]
    assert {"dish", "vendor", "explanation"}.issubset(top.keys())


def test_recommend_mac_and_cheese_dish_schema(mac_response):
    assert DISH_FIELDS.issubset(mac_response["results"][0]["dish"].keys())


def test_recommend_mac_and_cheese_vendor_schema(mac_response):
    vendor = mac_response["results"][0]["vendor"]
    assert VENDOR_FIELDS.issubset(vendor.keys())
    assert vendor["vendor_id"].startswith("v_")


def test_recommend_mac_and_cheese_semantic_correctness(mac_response):
    """Creamy/buttery input → top Thai dish should have a creamy/rich sensory profile."""
    sensory = mac_response["results"][0]["dish"]["sensory_string"].lower()
    creamy_signals = ["cream", "coconut", "rich", "butter", "savory", "smooth"]
    assert any(word in sensory for word in creamy_signals), (
        f"Expected a creamy/rich Thai dish for Mac and Cheese input, "
        f"got: {mac_response['results'][0]['dish']['name']!r}\n"
        f"sensory_string: {mac_response['results'][0]['dish']['sensory_string']}"
    )


def test_recommend_mac_and_cheese_explanation_from_ollama(mac_response):
    """Rank-1 explanation should come from Ollama (not just empty)."""
    explanation = mac_response["results"][0]["explanation"]
    assert isinstance(explanation, str) and len(explanation) > 20


def test_recommend_all_results_have_unique_dishes(mac_response):
    """Top-5 results must all be different Thai dishes."""
    ids = [r["dish"]["dish_id"] for r in mac_response["results"]]
    assert len(ids) == len(set(ids)), "Duplicate dishes in top-5 results"


# ── Journey 4: Recommend — Smoky/Savory Input ────────────────────────────────

def test_recommend_bbq_brisket_status(api):
    r = api.post("/recommend", json={"liked_food_ids": ["g_01"]})
    assert r.status_code == 200


def test_recommend_different_input_different_top_dish(mac_response, bbq_response):
    """Different flavour profiles should yield different #1 Thai dish matches."""
    assert mac_response["results"][0]["dish"]["dish_id"] != bbq_response["results"][0]["dish"]["dish_id"], (
        "Mac and Cheese and BBQ Brisket have very different flavour profiles "
        "— the recommender should not return the same top Thai dish for both"
    )


def test_recommend_bbq_explanation_non_empty(bbq_response):
    assert len(bbq_response["results"][0]["explanation"]) > 20


# ── Journey 5: Multi-Food Input ───────────────────────────────────────────────

def test_recommend_multi_food_returns_results(api):
    data = api.post("/recommend", json={"liked_food_ids": ["g_01", "g_02"]}).json()
    assert isinstance(data["results"], list)
    assert len(data["results"]) == 5
    for r in data["results"]:
        assert isinstance(r["dish"], dict)
        assert isinstance(r["vendor"], dict)
        assert isinstance(r["explanation"], str)


# ── Journey 6: MongoDB Cache Consistency ─────────────────────────────────────

def test_recommend_cache_returns_same_top_dish(api, mac_response):
    """Same input always returns the same #1 dish — embedding cache is deterministic."""
    second = api.post("/recommend", json={"liked_food_ids": ["g_02"]}).json()
    assert second["results"][0]["dish"]["dish_id"] == mac_response["results"][0]["dish"]["dish_id"]


# ── Journey 7: Error Cases ────────────────────────────────────────────────────

def test_recommend_empty_list_returns_400(api):
    r = api.post("/recommend", json={"liked_food_ids": []})
    assert r.status_code == 400
    assert "liked_food_ids" in r.json().get("detail", "").lower()


def test_recommend_wrong_field_returns_422(api):
    r = api.post("/recommend", json={"wrong_field": "value"})
    assert r.status_code == 422


def test_recommend_no_body_returns_422(api):
    r = api.post("/recommend")
    assert r.status_code == 422


# ── Journey 8: Adaptive Next Card ────────────────────────────────────────────

def test_next_card_cold_start(api):
    """No likes, no seen → returns first card."""
    r = api.post("/next-card", json={"liked_ids": [], "seen_ids": []})
    assert r.status_code == 200
    card = r.json()
    assert {"id", "name", "sensory_string"}.issubset(card.keys())


def test_next_card_skips_seen(api):
    """Seen cards must not be returned."""
    all_foods = api.get("/global-foods").json()
    all_ids = [f["id"] for f in all_foods]
    # Mark all but last as seen
    seen = all_ids[:-1]
    r = api.post("/next-card", json={"liked_ids": [], "seen_ids": seen})
    assert r.status_code == 200
    assert r.json()["id"] not in seen


def test_next_card_all_seen_returns_404(api):
    all_foods = api.get("/global-foods").json()
    all_ids = [f["id"] for f in all_foods]
    r = api.post("/next-card", json={"liked_ids": [], "seen_ids": all_ids})
    assert r.status_code == 404


def test_next_card_with_likes_returns_different_from_liked(api):
    """After liking a creamy dish, next card should be from a different flavour cluster."""
    r1 = api.post("/next-card", json={"liked_ids": [], "seen_ids": []})
    first_card = r1.json()

    r2 = api.post("/next-card", json={
        "liked_ids": [first_card["id"]],
        "seen_ids": [first_card["id"]],
    })
    assert r2.status_code == 200
    assert r2.json()["id"] != first_card["id"]
