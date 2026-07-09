"""ArtisanMarket backend API tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://maker-store-54.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_CUST = {"email": "customer@artisan.market", "password": "Customer123!"}
DEMO_SELL = {"email": "seller@artisan.market", "password": "Seller123!"}
DEMO_ADM = {"email": "admin@artisan.market", "password": "Admin123!"}


# ---------- Session / fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(session, creds):
    r = session.post(f"{API}/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def customer_token(session):
    session.post(f"{API}/seed", timeout=30)  # idempotent seed
    return _login(session, DEMO_CUST)


@pytest.fixture(scope="session")
def seller_token(session):
    return _login(session, DEMO_SELL)


@pytest.fixture(scope="session")
def admin_token(session):
    return _login(session, DEMO_ADM)


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Health & seed ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_seed_idempotent(self, session):
        r1 = session.post(f"{API}/seed", timeout=30)
        r2 = session.post(f"{API}/seed", timeout=30)
        assert r1.status_code == 200 and r2.status_code == 200
        assert r1.json().get("categories") == 6


# ---------- Auth ----------
class TestAuth:
    def test_login_demo_customer(self, session):
        r = session.post(f"{API}/auth/login", json=DEMO_CUST, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and d["user"]["role"] == "customer"

    def test_login_bad(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "customer@artisan.market", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_requires_token(self, session):
        r = session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_me_with_token(self, session, customer_token):
        r = session.get(f"{API}/auth/me", headers=_auth(customer_token), timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_CUST["email"]

    def test_register_new_and_duplicate(self, session):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        payload = {"name": "TEST User", "email": email, "password": "Passw0rd!", "role": "customer"}
        r = session.post(f"{API}/auth/register", json=payload, timeout=15)
        assert r.status_code == 200
        assert "token" in r.json()
        # duplicate
        r2 = session.post(f"{API}/auth/register", json=payload, timeout=15)
        assert r2.status_code == 400


# ---------- Categories & Products ----------
class TestCatalog:
    def test_categories(self, session):
        r = session.get(f"{API}/categories", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 6

    def test_products_only_approved(self, session):
        r = session.get(f"{API}/products", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        assert all(p["status"] == "approved" for p in items)

    def test_products_filters(self, session):
        r = session.get(f"{API}/products", params={"category": "ceramics"}, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert all(p["category"] == "ceramics" for p in items)

        r2 = session.get(f"{API}/products", params={"q": "vase"}, timeout=15)
        assert r2.status_code == 200
        assert len(r2.json()) >= 1

        r3 = session.get(f"{API}/products", params={"sort": "price_asc"}, timeout=15)
        arr = r3.json()
        prices = [p["price"] for p in arr]
        assert prices == sorted(prices)

        r4 = session.get(f"{API}/products", params={"min_price": 100, "max_price": 250}, timeout=15)
        assert all(100 <= p["price"] <= 250 for p in r4.json())

    def test_product_detail_has_seller_name(self, session):
        items = session.get(f"{API}/products", timeout=15).json()
        pid = items[0]["id"]
        r = session.get(f"{API}/products/{pid}", timeout=10)
        assert r.status_code == 200
        assert "seller_name" in r.json()

    def test_product_not_found(self, session):
        r = session.get(f"{API}/products/nonexistent-id", timeout=10)
        assert r.status_code == 404


# ---------- Seller flow + Admin approval ----------
@pytest.fixture(scope="module")
def created_product_id(session, seller_token, admin_token):
    body = {
        "title": f"TEST Handcrafted Item {uuid.uuid4().hex[:6]}",
        "description": "A test product description created by pytest.",
        "price": 42.5,
        "category": "ceramics",
        "stock": 3,
        "images": ["https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=400"],
        "tags": ["test"],
    }
    r = session.post(f"{API}/products", json=body, headers=_auth(seller_token), timeout=15)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    assert r.json()["status"] == "pending"
    yield pid
    # cleanup
    session.delete(f"{API}/products/{pid}", headers=_auth(admin_token), timeout=10)


class TestSellerAdmin:
    def test_new_product_is_pending(self, session, seller_token, created_product_id):
        r = session.get(f"{API}/seller/products", headers=_auth(seller_token), timeout=10)
        assert r.status_code == 200
        mine = [p for p in r.json() if p["id"] == created_product_id]
        assert mine and mine[0]["status"] == "pending"

    def test_pending_visible_to_admin(self, session, admin_token, created_product_id):
        r = session.get(f"{API}/admin/products/pending", headers=_auth(admin_token), timeout=10)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert created_product_id in ids

    def test_approve_flow(self, session, admin_token, created_product_id):
        r = session.post(f"{API}/admin/products/{created_product_id}/approve", headers=_auth(admin_token), timeout=10)
        assert r.status_code == 200
        # verify persistence
        detail = session.get(f"{API}/products/{created_product_id}", timeout=10).json()
        assert detail["status"] == "approved"

    def test_update_resets_to_pending(self, session, seller_token, created_product_id):
        body = {
            "title": f"TEST Updated {uuid.uuid4().hex[:6]}",
            "description": "Updated desc",
            "price": 50.0,
            "category": "ceramics",
            "stock": 2,
            "images": ["https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=400"],
            "tags": ["test"],
        }
        r = session.put(f"{API}/products/{created_product_id}", json=body, headers=_auth(seller_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "pending"

    def test_reject_flow(self, session, admin_token, created_product_id):
        r = session.post(
            f"{API}/admin/products/{created_product_id}/reject",
            json={"reason": "Test reject reason"},
            headers=_auth(admin_token), timeout=10,
        )
        assert r.status_code == 200
        detail = session.get(f"{API}/products/{created_product_id}", timeout=10).json()
        assert detail["status"] == "rejected"
        assert detail["rejection_reason"] == "Test reject reason"

    def test_admin_stats(self, session, admin_token):
        r = session.get(f"{API}/admin/stats", headers=_auth(admin_token), timeout=10)
        assert r.status_code == 200
        d = r.json()
        for k in ("products_total", "products_pending", "products_approved", "products_rejected", "sellers", "customers", "orders"):
            assert k in d


# ---------- Role guards ----------
class TestRoleGuards:
    def test_customer_cannot_approve(self, session, customer_token):
        r = session.post(f"{API}/admin/products/xxx/approve", headers=_auth(customer_token), timeout=10)
        assert r.status_code == 403

    def test_seller_cannot_admin(self, session, seller_token):
        r = session.get(f"{API}/admin/products/pending", headers=_auth(seller_token), timeout=10)
        assert r.status_code == 403

    def test_unauth_cannot_access_cart(self, session):
        r = session.get(f"{API}/cart", timeout=10)
        assert r.status_code == 401


# ---------- Cart, Wishlist, Checkout ----------
class TestCartCheckout:
    def test_cart_flow_and_checkout(self, session, customer_token):
        # pick an approved product
        products = session.get(f"{API}/products", timeout=15).json()
        pid = products[0]["id"]
        # clear cart first
        session.delete(f"{API}/cart/{pid}", headers=_auth(customer_token), timeout=10)
        # add
        r = session.post(f"{API}/cart", json={"product_id": pid, "qty": 2}, headers=_auth(customer_token), timeout=10)
        assert r.status_code == 200
        # add again to test increment
        session.post(f"{API}/cart", json={"product_id": pid, "qty": 1}, headers=_auth(customer_token), timeout=10)
        cart = session.get(f"{API}/cart", headers=_auth(customer_token), timeout=10).json()
        item = next(c for c in cart if c["product_id"] == pid)
        assert item["qty"] == 3
        assert "product" in item and item["product"]["id"] == pid

        # checkout
        checkout_body = {
            "address": {
                "full_name": "TEST Customer",
                "phone": "1234567890",
                "line1": "123 Test St",
                "city": "Testville",
                "state": "TS",
                "zip": "12345",
            },
            "payment_method": "cod",
        }
        r = session.post(f"{API}/orders/checkout", json=checkout_body, headers=_auth(customer_token), timeout=15)
        assert r.status_code == 200
        order = r.json()
        assert order["status"] == "placed"
        assert order["payment_method"] == "cod"
        assert order["total"] > 0
        # cart empty
        cart2 = session.get(f"{API}/cart", headers=_auth(customer_token), timeout=10).json()
        assert cart2 == []

        # orders list
        orders = session.get(f"{API}/orders", headers=_auth(customer_token), timeout=10).json()
        assert any(o["id"] == order["id"] for o in orders)

        # cancel order
        r = session.post(
            f"{API}/orders/{order['id']}/status",
            params={"status": "cancelled"},
            headers=_auth(customer_token), timeout=10,
        )
        assert r.status_code == 200

    def test_checkout_empty_cart(self, session, customer_token):
        # ensure empty
        cart = session.get(f"{API}/cart", headers=_auth(customer_token), timeout=10).json()
        for c in cart:
            session.delete(f"{API}/cart/{c['product_id']}", headers=_auth(customer_token), timeout=10)
        r = session.post(f"{API}/orders/checkout", json={
            "address": {"full_name": "x", "phone": "1", "line1": "1", "city": "c", "state": "s", "zip": "1"},
            "payment_method": "cod",
        }, headers=_auth(customer_token), timeout=10)
        assert r.status_code == 400


class TestWishlist:
    def test_wishlist_flow(self, session, customer_token):
        products = session.get(f"{API}/products", timeout=15).json()
        pid = products[0]["id"]
        r = session.post(f"{API}/wishlist/{pid}", headers=_auth(customer_token), timeout=10)
        assert r.status_code == 200
        wl = session.get(f"{API}/wishlist", headers=_auth(customer_token), timeout=10).json()
        assert any(p["id"] == pid for p in wl)
        # idempotent
        r2 = session.post(f"{API}/wishlist/{pid}", headers=_auth(customer_token), timeout=10)
        assert r2.status_code == 200
        # remove
        session.delete(f"{API}/wishlist/{pid}", headers=_auth(customer_token), timeout=10)
        wl2 = session.get(f"{API}/wishlist", headers=_auth(customer_token), timeout=10).json()
        assert not any(p["id"] == pid for p in wl2)


# ---------- Reviews ----------
class TestReviews:
    def test_review_flow(self, session, customer_token):
        products = session.get(f"{API}/products", timeout=15).json()
        pid = products[0]["id"]
        r = session.post(f"{API}/reviews", json={"product_id": pid, "rating": 5, "comment": "TEST great"}, headers=_auth(customer_token), timeout=10)
        assert r.status_code == 200
        # verify
        detail = session.get(f"{API}/products/{pid}", timeout=10).json()
        assert detail["review_count"] >= 1
        assert detail["rating"] > 0
        reviews = session.get(f"{API}/products/{pid}/reviews", timeout=10).json()
        assert len(reviews) >= 1


# ---------- AI ----------
class TestAI:
    def test_ai_description(self, session, seller_token):
        payload = {"title": "Hand-thrown Ceramic Mug", "keywords": "handmade, cozy", "materials": "stoneware"}
        try:
            r = session.post(f"{API}/ai/generate-description", json=payload, headers=_auth(seller_token), timeout=60)
        except requests.RequestException as e:
            pytest.skip(f"AI unreachable: {e}")
        if r.status_code == 500 and "AI generation failed" in r.text:
            pytest.skip(f"OpenAI unreachable: {r.text}")
        if r.status_code == 501:
            pytest.skip(f"AI description generation not configured in this environment: {r.text}")
        assert r.status_code == 200, r.text
        desc = r.json().get("description", "")
        assert isinstance(desc, str) and len(desc) > 20
