import httpx
import pytest

BASE_URL = "http://localhost:8000"
# 4B model cold-load on CPU can take 5-10 minutes
TIMEOUT = 600.0


@pytest.fixture(scope="session")
def api():
    """httpx client pointing at the live Docker backend."""
    with httpx.Client(base_url=BASE_URL, timeout=TIMEOUT) as client:
        try:
            client.get("/health").raise_for_status()
        except Exception:
            pytest.skip("Backend not reachable at localhost:8000 — run: docker compose up")
        yield client


@pytest.fixture(scope="session")
def mac_response(api):
    """Single warm /recommend call for Mac and Cheese — shared across all tests that need it."""
    return api.post("/recommend", json={"liked_food_ids": ["g_02"]}).json()


@pytest.fixture(scope="session")
def bbq_response(api):
    """Single warm /recommend call for BBQ Brisket — shared across all tests that need it."""
    return api.post("/recommend", json={"liked_food_ids": ["g_01"]}).json()


@pytest.fixture(scope="session")
def mac_top(mac_response):
    """Shortcut to the rank-1 result from the Mac and Cheese recommendation."""
    return mac_response["results"][0]
