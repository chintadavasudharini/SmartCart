<div align="center">

# 🛒 SmartCart — Full-Stack E-Commerce Platform

**React 19 + TypeScript • Spring Boot 4.1.1 + Java 21 • PostgreSQL 18 • Razorpay • STOMP WebSockets**

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-007396?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot 4.1.1](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL 18](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

</div>

SmartCart is a full-stack e-commerce platform combining a clean luxury storefront (**Rose & Crimson Velvet**), an isolated Admin Operations Console (**Medium Dark Charcoal Slate**), Razorpay payment checkout & webhook verification, non-blocking `@Async` fulfillment (`EMAIL`, OpenPDF `INVOICE`, `NOTIFICATION`), and live STOMP WebSocket job telemetry.

---

## 📚 Documentation

| Document | Scope |
| :--- | :--- |
| **[project.md](./project.md)** | End-to-end architecture, workflows, themes, and system overview |
| **[frontend.md](./frontend.md)** | React 19 SPA structure, routes, Zustand stores, Axios interceptors, STOMP client & styling |
| **[backend.md](./backend.md)** | Spring Boot 4.1.1 APIs, JWT security, Razorpay integration, `@Async` jobs & OpenPDF invoices |
| **[database.md](./database.md)** | PostgreSQL 18 `ecommerce_db` schema, ER diagram, columns, enums & `psql` commands |

---

## 🏛 Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                             │
│         React 19 + TypeScript + Vite + Zustand + @stomp/stompjs         │
└──────────────────┬──────────────────────────────────▲───────────────────┘
                   │ HTTP REST (Authorization: Bearer)│ STOMP (/ws-smartcart)
                   │                                  │ Subscribes: /topic/jobs
┌──────────────────▼──────────────────────────────────┴───────────────────┐
│                       SPRING BOOT 4.1.1 BACKEND                         │
│                                                                         │
│  SecurityConfig + JwtAuthenticationFilter (Stateless HS JWT + BCrypt)   │
│  REST Controllers: Auth, Product, Order, Payment, BackgroundJob         │
│  PaymentService (Razorpay Orders + HMAC Verify + Webhook)               │
│  BackgroundJobService (@Async) ──► EmailService + OpenPDF InvoiceService│
└──────────────────┬──────────────────────────────────────────────────────┘
                   │ Spring Data JPA / Hibernate (ddl-auto=update)
┌──────────────────▼──────────────────────────────────────────────────────┐
│                   POSTGRESQL 18 DATABASE (ecommerce_db)                 │
│     users • products • orders • order_items • payment • background_jobs │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```text
SmartCart/
├── README.md                  # Root overview & quickstart
├── project.md                 # End-to-end system specification
├── frontend.md                # Frontend documentation
├── backend.md                 # Backend & REST API documentation
├── database.md                # PostgreSQL ecommerce_db schema documentation
│
├── smartcart-backend/         # Spring Boot 4.1.1 + Java 21 API
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/main/
│       ├── java/com/klu/      # config, controller, dto, model, repository, security, service
│       └── resources/application.properties
│
└── smartcart-frontend/        # React 19 + TypeScript + Vite 8 SPA
    ├── package.json
    ├── vite.config.ts
    ├── index.html             # Loads Razorpay checkout.js
    └── src/
        ├── api/               # apiClient, authApi, productApi, orderApi, paymentApi, jobApi
        ├── components/        # Navbar, Footer, ProductList, ProductCard, CheckoutForm
        ├── pages/             # Home, Explore, Cart, Orders, UserDashboard, Signin/up, Admin pages
        ├── services/          # websocketService (STOMP over WS)
        ├── store/             # useAuthStore (localStorage), useCartStore (in-memory)
        ├── types/             # TypeScript API & domain interfaces
        └── index.css          # Rose & Crimson storefront + .admin-theme styles
```

---

## 🧭 Key Routes & API Highlights

### Frontend Routes (`http://localhost:5173`)
- **Storefront**: `/` (`HomePage` official landing showcase), `/explore` (`ProductList`), `/cart`, `/checkout` (`CheckoutForm` + Razorpay modal), `/orders` (order history + `Pay Now` retry), `/user`, `/signin`, `/signup`
- **Admin Suite** (`.admin-theme`, footer hidden): `/admin/login`, `/admin` (Product CRUD), `/admin/orders` (All orders), `/admin/jobs` (`BackgroundJobMonitor` live STOMP stream + manual retry)

### Backend REST & WebSocket Endpoints (`http://localhost:8080`)
- **Auth (`/api/auth`)**: `POST /signup`, `POST /signin`, `GET /me`
- **Products (`/api/products`)**: `GET`, `GET /{productId}`, and `ADMIN`-only `POST`, `PUT /{productId}`, `DELETE /{productId}`
- **Orders (`/api/orders`)**: `POST`, `GET /my`, `GET /{orderId}`, `GET`
- **Payments (`/api/payment`)**: `POST /create/{orderId}`, `POST /verify`, `POST /webhook` (`X-Razorpay-Signature`)
- **Jobs (`/api/jobs`, `ADMIN`)**: `GET` (`?status=&jobType=`), `GET /stats`, `POST /{jobId}/retry`
- **WebSocket / OpenAPI**: STOMP endpoint `/ws-smartcart` (`/topic/jobs`), Swagger UI at `/swagger-ui.html`

> See [backend.md](./backend.md) for complete endpoint details and [database.md](./database.md) for all 6 PostgreSQL table definitions (`users`, `products`, `orders`, `order_items`, `payment`, `background_jobs`).

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Java**: JDK `21`
- **Node.js**: `v18+` (`v20+` recommended)
- **PostgreSQL**: `18` (`postgresql-x64-18` running on port `5432`)

### 1. Create Database
```sql
CREATE DATABASE ecommerce_db;
```
*(Hibernate `ddl-auto=update` creates the schema automatically on startup, and `DataInitializer` seeds `admin@smartcart.com` / `admin@smartcart`.)*

### 2. Start Backend (`http://localhost:8080`)
```bash
cd smartcart-backend

# Windows
mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

### 3. Start Frontend (`http://localhost:5173`)
```bash
cd smartcart-frontend
npm install
npm run dev
```

---

## ⚙️ Configuration

### Backend (`smartcart-backend/src/main/resources/application.properties`)
- `server.port=8080`
- `spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/ecommerce_db}`
- `spring.datasource.username=postgres`, `spring.datasource.password=root`
- `jwt.secret`, `razorpay.key.id`, `razorpay.key.secret`, `razorpay.webhook.secret`, and `spring.mail.*` (SMTP falls back gracefully to console logging when unconfigured).

### Frontend (optional `smartcart-frontend/.env`)
- `VITE_API_URL=http://localhost:8080`
- `VITE_WS_URL=ws://localhost:8080/ws-smartcart` *(optional; derived from `VITE_API_URL` if omitted)*

---

## 📄 License & Authors

Distributed under the **MIT License**. Created and maintained by [chintadavasudharini](https://github.com/chintadavasudharini).
