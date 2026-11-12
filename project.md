# SmartCart — Project Documentation

**SmartCart** is an end-to-end full-stack e-commerce platform built with **React 19 + TypeScript + Vite**, **Java 21 + Spring Boot 4.1.1**, and **PostgreSQL 18 (`ecommerce_db`)**. It separates storefront shopping from an isolated Admin Operations Console and processes post-payment fulfillment (`EMAIL`, `INVOICE`, `NOTIFICATION`) asynchronously with live STOMP WebSocket updates.

> **Module Deep-Dives:** [frontend.md](./frontend.md) • [backend.md](./backend.md) • [database.md](./database.md) • [README.md](./README.md)

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          SMARTCART FRONTEND                             │
│          React 19 + TypeScript + Vite (http://localhost:5173)           │
│                                                                         │
│  Storefront (/) / (/explore)          Admin Console (/admin/*)          │
│  Rose & Crimson Velvet Theme          Medium Dark Charcoal Slate Theme  │
│  Zustand (Auth + In-Memory Cart)      Product CRUD, Orders, Job Monitor │
└──────────────────┬──────────────────────────────────▲───────────────────┘
                   │ HTTP REST (Bearer JWT)           │ STOMP WebSocket
                   │ VITE_API_URL (/api)              │ /ws-smartcart -> /topic/jobs
┌──────────────────▼──────────────────────────────────┴───────────────────┐
│                          SMARTCART BACKEND                              │
│          Spring Boot 4.1.1 + Java 21 (http://localhost:8080)            │
│                                                                         │
│  • SecurityConfig & JwtAuthenticationFilter (Stateless HS JWT, BCrypt)  │
│  • Controllers: Auth, Product, Order, Payment, BackgroundJob            │
│  • PaymentService: Razorpay Orders, HMAC Verification & Webhook         │
│  • BackgroundJobService (@Async): EmailService + OpenPDF InvoiceService │
└──────────────────┬──────────────────────────────────────────────────────┘
                   │ Spring Data JPA / Hibernate (ddl-auto=update)
┌──────────────────▼──────────────────────────────────────────────────────┐
│                        POSTGRESQL 18 DATABASE                           │
│           ecommerce_db (jdbc:postgresql://localhost:5432/ecommerce_db)  │
│                                                                         │
│   users • products • orders • order_items • payment • background_jobs   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules

| Module | Directory | Responsibility | Detailed Docs |
| :--- | :--- | :--- | :--- |
| **Frontend SPA** | `smartcart-frontend/` | Storefront showcase (`/`), catalog (`/explore`), cart (`/cart`), Razorpay checkout (`/checkout`), order history (`/orders`), and Admin Console (`/admin/*`) | [frontend.md](./frontend.md) |
| **Backend API** | `smartcart-backend/` | REST endpoints (`/api/*`), JWT authentication, RBAC (`USER` / `ADMIN`), Razorpay payment gateway, `@Async` worker orchestration, OpenPDF invoices, SMTP mail, STOMP broker | [backend.md](./backend.md) |
| **PostgreSQL Database** | `ecommerce_db` | Persistent storage for 6 relational tables managed by Hibernate JPA (`ddl-auto=update`) | [database.md](./database.md) |

---

## 3. End-to-End Workflows

### 3.1 Storefront Browsing & Cart Flow
1. **`/` (`HomePage`)**: Official minimalist landing page introducing SmartCart with navigation to the product catalog (`/explore`) — intentionally kept clean without trending grids or extra hero cart buttons.
2. **`/explore` (`ExplorePage`)**: Renders `ProductList` + `ProductCard` with search, category filters, and add-to-cart controls fetched from `GET /api/products`.
3. **`/cart` (`CartPage`)**: Manages items stored in Zustand's in-memory `useCartStore` (`addToCart`, `increaseQuantity`, `decreaseQuantity`, `removeFromCart`, `getTotal`).

### 3.2 Dual-Portal Authentication
- **Customer Portal (`/signin`, `/signup`)**: Standard `USER` registration (`POST /api/auth/signup`) and login (`POST /api/auth/signin`). `AuthResponse` (`userId`, `name`, `email`, `role`, `message`, `token`) is persisted by `useAuthStore` into `localStorage` (`"user"` and `"token"`).
- **Admin Portal (`/admin/login`)**: Dedicated admin sign-in view styling `.admin-theme` with `<Footer />` hidden across `/admin/*`. Backend `DataInitializer` seeds/ensures `admin@smartcart.com` (`ADMIN`) on startup.
- **Session Recovery**: Axios (`apiClient.ts`) attaches `Authorization: Bearer <token>` on every request. On HTTP `401`, it clears `"token"` and `"user"` from `localStorage` and redirects `/admin/*` traffic to `/admin/login` or storefront traffic to `/signin`.

### 3.3 Order Creation & Razorpay Payment Flow
1. From `/checkout` (`CheckoutForm`), customer shipping inputs (name, email, phone, address, city, postal code) are collected for Razorpay `prefill` & `notes`.
2. Frontend calls `POST /api/orders` with `{ items: [{ productId, quantity }] }`. Backend validates stock, snapshots prices, and stores the `Order` (`status = "PENDING"`) and `OrderItem` rows.
3. Frontend calls `POST /api/payment/create/{orderId}`. Backend creates a Razorpay Order in paise (`amount * 100`) and saves a `Payment` record (`status = "CREATED"`).
4. Razorpay modal opens (`checkout.razorpay.com/v1/checkout.js`).
5. On completion, frontend sends `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` to `POST /api/payment/verify`.
6. Unpaid (`PENDING`) orders visible in `/orders` (`OrdersPage`) can also be completed later via the inline **Pay Now** button.

### 3.4 Post-Payment Async Fulfillment & Live Telemetry
When `PaymentService` verifies either `/api/payment/verify` or an incoming Razorpay webhook (`POST /api/payment/webhook` with `X-Razorpay-Signature`):
1. `Payment` and `Order` are idempotently marked `PAID`.
2. `BackgroundJobService.triggerOrderJobs(order)` creates 3 jobs in `background_jobs` (`PENDING`):
   - `EMAIL` — dispatches order confirmation via `JavaMailSender` (or logs cleanly as fallback if SMTP is not configured).
   - `INVOICE` — generates `smartcart-backend/invoices/invoice_<orderId>.pdf` using OpenPDF.
   - `NOTIFICATION` — records customer/admin order notification.
3. Each worker updates status (`PENDING` → `PROCESSING` → `COMPLETED` / `FAILED`) asynchronously (`@EnableAsync`) and pushes the `BackgroundJobResponse` over STOMP to **`/topic/jobs`**.
4. `/admin/jobs` (`BackgroundJobMonitor`) receives live job updates over `/ws-smartcart`, displays job stats (`GET /api/jobs/stats`), supports filtering (`?status=&jobType=`), and allows admins to retry failed jobs (`POST /api/jobs/{jobId}/retry`).

---

## 4. Visual Themes & UX Boundaries

| Area | Theme Palette | Surface & Accent Tokens | Footer |
| :--- | :--- | :--- | :--- |
| **Storefront (`/`, `/explore`, `/cart`, `/checkout`, `/orders`, `/user`)** | **Rose & Crimson Velvet** (Light Luxury) | `#fffafb` canvas, `#e11d48` crimson velvet | Shown |
| **Admin Console (`/admin`, `/admin/login`, `/admin/orders`, `/admin/jobs`)** | **Medium Dark Rose-tinted Charcoal Slate** (`.admin-theme`) | `#1f1b24` surface, `#2a2431` cards, `#f43f5e` rose highlight | Hidden |

---

## 5. Technology Matrix

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React `^19.2.8`, TypeScript `~6.0.2`, Vite `^8.2.2`, React Router `^7.18.3`, Zustand `^5.0.15`, TanStack React Query `^5.104.1`, Axios `^1.20.0`, `@stomp/stompjs` `^7.3.0`, React Hook Form `^7.88.0`, Zod `^4.6.4` |
| **Backend** | Java `21`, Spring Boot `4.1.1`, Spring Security (Stateless JWT via `jjwt 0.12.6`, BCrypt), Spring Data JPA, Spring WebSocket (STOMP), Spring Mail, OpenPDF `2.0.3`, Razorpay Java SDK `1.4.8`, Springdoc OpenAPI `3.1.0` |
| **Database** | PostgreSQL `18` (`postgresql-x64-18`), database `ecommerce_db` (`users`, `products`, `orders`, `order_items`, `payment`, `background_jobs`) |

---

## 6. Quick Local Startup

```bash
# 1. Provision database in PostgreSQL 18 (port 5432)
CREATE DATABASE ecommerce_db;

# 2. Start Backend (http://localhost:8080)
cd smartcart-backend
./mvnw spring-boot:run   # or mvnw.cmd spring-boot:run on Windows

# 3. Start Frontend (http://localhost:5173)
cd ../smartcart-frontend
npm install
npm run dev
```

- **Storefront UI:** `http://localhost:5173/`
- **Admin Login:** `http://localhost:5173/admin/login` (`admin@smartcart.com` / `admin@smartcart`)
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
