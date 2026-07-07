"""Regression tests for the multi-image gallery + base64 image picker feature."""
import os
import uuid
import base64
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://maker-store-54.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_SELL = {"email": "seller@artisan.market", "password": "Seller123!"}
DEMO_ADM = {"email": "admin@artisan.market", "password": "Admin123!"}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    s.post(f"{API}/seed", timeout=30)
    return s


def _login(session, creds):
    r = session.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200
    return r.json()["token"]


@pytest.fixture(scope="module")
def seller_token(session):
    return _login(session, DEMO_SELL)


@pytest.fixture(scope="module")
def admin_token(session):
    return _login(session, DEMO_ADM)


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


class TestSeedGallery:
    """Verify seeded terracotta vase has 3 images (gallery demo candidate)."""

    def test_terracotta_vase_has_three_images(self, session):
        items = session.get(f"{API}/products", params={"q": "terracotta"}, timeout=15).json()
        assert len(items) >= 1
        vase = next((p for p in items if "Terracotta Vase" in p["title"]), None)
        assert vase is not None, "Seeded terracotta vase not found"
        assert isinstance(vase["images"], list)
        assert len(vase["images"]) == 3, f"Expected 3 images, got {len(vase['images'])}: {vase['images']}"

    def test_seed_refreshes_images_idempotent(self, session):
        # Call seed twice; images list must stay identical (3 for terracotta)
        session.post(f"{API}/seed", timeout=30)
        session.post(f"{API}/seed", timeout=30)
        items = session.get(f"{API}/products", params={"q": "terracotta"}, timeout=15).json()
        vase = next((p for p in items if "Terracotta Vase" in p["title"]), None)
        assert vase and len(vase["images"]) == 3

    def test_multi_image_products_exist(self, session):
        # Several seeded products should have >=2 images
        items = session.get(f"{API}/products", timeout=15).json()
        multi = [p for p in items if len(p.get("images", [])) >= 2]
        assert len(multi) >= 3, f"Expected multiple multi-image products, got {len(multi)}"


class TestBase64ImageCreate:
    """Verify create/update accepts base64 data URI images (from expo-image-picker)."""

    def _tiny_data_uri(self):
        # 1x1 transparent PNG
        b64 = base64.b64encode(
            bytes.fromhex(
                "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
                "890000000d49444154789c626000000000050001a5f645400000000049454e44ae426082"
            )
        ).decode()
        return f"data:image/png;base64,{b64}"

    def test_create_product_with_data_uri_images(self, session, seller_token, admin_token):
        data_uri = self._tiny_data_uri()
        payload = {
            "title": f"TEST DataURI Product {uuid.uuid4().hex[:6]}",
            "description": "Product with base64 image from picker.",
            "price": 25.5,
            "category": "ceramics",
            "stock": 4,
            "images": [data_uri, data_uri, "https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=400"],
            "tags": ["test", "picker"],
        }
        r = session.post(f"{API}/products", json=payload, headers=_auth(seller_token), timeout=20)
        assert r.status_code == 200, r.text
        pid = r.json()["id"]
        assert len(r.json()["images"]) == 3
        assert r.json()["images"][0].startswith("data:image/png;base64,")

        # GET verifies persistence
        detail = session.get(f"{API}/products/{pid}", timeout=10).json()
        assert len(detail["images"]) == 3
        assert detail["images"][0].startswith("data:image/png;base64,")

        # cleanup
        session.delete(f"{API}/products/{pid}", headers=_auth(admin_token), timeout=10)

    def test_update_product_with_mixed_images(self, session, seller_token, admin_token):
        data_uri = self._tiny_data_uri()
        create = session.post(f"{API}/products", json={
            "title": f"TEST Mix {uuid.uuid4().hex[:6]}",
            "description": "test",
            "price": 10.0,
            "category": "art",
            "stock": 1,
            "images": ["https://example.com/a.jpg"],
            "tags": [],
        }, headers=_auth(seller_token), timeout=15)
        assert create.status_code == 200
        pid = create.json()["id"]

        # Update with 5 mixed images (URL + data URI)
        updated_images = [data_uri] * 3 + ["https://example.com/x.jpg", "https://example.com/y.jpg"]
        r = session.put(f"{API}/products/{pid}", json={
            "title": "TEST Mix updated",
            "description": "updated",
            "price": 12.0,
            "category": "art",
            "stock": 2,
            "images": updated_images,
            "tags": [],
        }, headers=_auth(seller_token), timeout=15)
        assert r.status_code == 200
        assert len(r.json()["images"]) == 5
        assert r.json()["status"] == "pending"  # resubmitted for review

        # cleanup
        session.delete(f"{API}/products/{pid}", headers=_auth(admin_token), timeout=10)
