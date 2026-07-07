# ArtisanMarket — Handmade Marketplace (MVP)

Mobile-first Expo app for a handmade marketplace with three roles: customer, seller (artisan), and admin. Admin reviews and approves/rejects each seller listing before it goes live.

## Roles & Flows

### Customer
- Register / login (JWT, email + password)
- Browse home feed (hero + category chips + product grid)
- Search products (text query)
- View product detail with story, specs, reviews
- Add to wishlist & cart
- Checkout with delivery address + Cash-on-Delivery (mocked)
- View order history, cancel orders while `placed`
- Leave reviews (API present, UI TBD in v2)

### Seller (Artisan)
- Register as seller, dashboard with counts (approved/pending/rejected)
- Create/edit/delete product listings
- Fields: title, description, price, category, stock, materials, dimensions, shipping days, image URL, tags
- **AI description generator** (Emergent LLM key → gpt-4o-mini via `emergentintegrations`)
- New/updated listings enter `pending` status; rejection feedback shown on the card
- View incoming orders and advance status (placed → shipped → delivered)

### Admin
- Pending-approval queue with product card (image, artisan, description, price)
- One-tap Approve
- Reject via bottom sheet with quick-reason chips + custom feedback
- Overview dashboard: totals (products, pending, approved, rejected, sellers, customers, orders)

## Tech
- **Backend:** FastAPI + Motor (MongoDB), JWT auth, bcrypt password hashing
- **Frontend:** Expo Router (file-based), React Native, TypeScript
- **AI:** `emergentintegrations` LlmChat streaming (openai/gpt-4o-mini) for product descriptions
- **Storage:** AsyncStorage for JWT token
- **Design:** Editorial LIGHT — Playfair Display + DM Sans, terracotta brand `#B56A56` on off-white `#FAF9F6`
- **Payments:** Cash on Delivery only (MOCKED — no real gateway)

## API Surface (all `/api`)
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /categories`
- `GET /products` (public, filters: `category`, `q`, `min_price`, `max_price`, `sort`)
- `GET /products/{id}`, `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}`
- `GET /seller/products`
- `GET /admin/products/pending`, `POST /admin/products/{id}/approve`, `POST /admin/products/{id}/reject`, `GET /admin/stats`
- `GET/POST /cart`, `DELETE /cart/{product_id}`
- `GET /wishlist`, `POST/DELETE /wishlist/{product_id}`
- `POST /orders/checkout`, `GET /orders`, `POST /orders/{id}/status`
- `GET /products/{id}/reviews`, `POST /reviews`
- `POST /ai/generate-description`
- `POST /seed` (idempotent demo seed)

## Seed Data
6 categories + 6 approved products + 1 pending product for admin queue.

## Deferred (future iterations)
- Real payment gateway (Stripe/UPI)
- OAuth (Google) sign-in
- Push notifications
- Coupons/discounts
- Refunds & returns
- Seller payout ledger
- Multi-image gallery (currently single image URL)
- Image upload from device (currently URL input)
- CMS static pages
