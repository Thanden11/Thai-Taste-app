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
# All tests share one session-scoped response (model loads once, not per test)

def test_recommend_mac_and_cheese_status(api):
    r = api.post("/recommend", json={"liked_food_ids": ["g_02"]})
    assert r.status_code == 200


def test_recommend_mac_and_cheese_top_level_keys(mac_response):
    assert {"dish", "vendor", "explanation"}.issubset(mac_response.keys())


def test_recommend_mac_and_cheese_dish_schema(mac_response):
    assert DISH_FIELDS.issubset(mac_response["dish"].keys())


def test_recommend_mac_and_cheese_vendor_schema(mac_response):
    vendor = mac_response["vendor"]
    assert VENDOR_FIELDS.issubset(vendor.keys())
    assert vendor["vendor_id"].startswith("v_")


def test_recommend_mac_and_cheese_semantic_correctness(mac_response):
    """Creamy/buttery input → Thai dish should have a creamy/rich sensory profile."""
    sensory = mac_response["dish"]["sensory_string"].lower()
    creamy_signals = ["cream", "coconut", "rich", "butter", "savory", "smooth"]
    assert any(word in sensory for word in creamy_signals), (
        f"Expected a creamy/rich Thai dish for Mac and Cheese input, "
        f"got: {mac_response['dish']['name']!r}\n"
        f"sensory_string: {mac_response['dish']['sensory_string']}"
    )


def test_recommend_mac_and_cheese_explanation_from_ollama(mac_response):
    """Ollama must return a real explanation (not just empty)."""
    explanation = mac_response["explanation"]
    assert isinstance(explanation, str) and len(explanation) > 20


# ── Journey 4: Recommend — Smoky/Savory Input ────────────────────────────────

def test_recommend_bbq_brisket_status(api):
    r = api.post("/recommend", json={"liked_food_ids": ["g_01"]})
    assert r.status_code == 200


def test_recommend_different_input_different_dish(mac_response, bbq_response):
    """Different flavour profiles should yield different Thai dish matches."""
    assert mac_response["dish"]["dish_id"] != bbq_response["dish"]["dish_id"], (
        "Mac and Cheese and BBQ Brisket have very different flavour profiles "
        "— the recommender should not return the same Thai dish for both"
    )


def test_recommend_bbq_explanation_non_empty(bbq_response):
    assert len(bbq_response["explanation"]) > 20


# ── Journey 5: Multi-Food Input ───────────────────────────────────────────────

def test_recommend_multi_food_returns_single_dish(api):
    data = api.post("/recommend", json={"liked_food_ids": ["g_01", "g_02"]}).json()
    assert isinstance(data["dish"], dict)
    assert isinstance(data["vendor"], dict)
    assert isinstance(data["explanation"], str)


# ── Journey 6: MongoDB Cache Consistency ─────────────────────────────────────

def test_recommend_cache_returns_same_dish(api, mac_response):
    """Same input always returns the same dish — embedding cache is deterministic."""
    second = api.post("/recommend", json={"liked_food_ids": ["g_02"]}).json()
    assert second["dish"]["dish_id"] == mac_response["dish"]["dish_id"]


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
