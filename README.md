<div align="center">

# 🛒 SmartCart — Modern Full-Stack E-Commerce Platform

**High-Performance • Asynchronous • Real-Time • Enterprise-Grade**

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-007396?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot 4.1.1](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![WebSocket](https://img.shields.io/badge/STOMP-WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://stomp.github.io/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-02042B?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

---

SmartCart is an end-to-end full-stack e-commerce solution architected for high transaction throughput, resilient post-payment processing, and real-time observability. Built on **Java 21 / Spring Boot 4** and **React 19 / TypeScript**, the platform features Razorpay payments, non-blocking asynchronous background job execution (Email, PDF Invoicing, Notifications), and live STOMP WebSocket telemetry for administrators.

</div>

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Post-Payment Asynchronous Pipeline](#-post-payment-asynchronous-pipeline)
- [Administrator Suite & Routing Architecture](#-administrator-suite--routing-architecture)
- [Repository Structure](#-repository-structure)
- [Tech Stack Deep-Dive](#-tech-stack-deep-dive)
- [Database Schema & Data Model](#-database-schema--data-model)
- [API Reference Summary](#-api-reference-summary)
- [Security & Authentication](#-security--authentication)
- [Quickstart & Local Setup](#-quickstart--local-setup)
- [Environment Configuration](#-environment-configuration)
- [Verification & Testing](#-verification--testing)
- [License & Authors](#-license--authors)

---

## 🏛 Architectural Overview

SmartCart implements a decoupled client-server architecture with asynchronous background task processing and real-time message brokering:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                            │
│           (React 19 + TypeScript + Vite + Zustand + STOMP)             │
└───────────────┬───────────────────────────────────────▲────────────────┘
                │ HTTP REST (JWT Bearer)                │ STOMP over WS
                │                                       │ (/topic/jobs)
┌───────────────▼───────────────────────────────────────┴────────────────┐
│                       SPRING BOOT CORE BACKEND                         │
│                                                                        │
│  ┌───────────────────────┐          ┌───────────────────────────────┐  │
│  │ Security & JWT Filter │          │ STOMP WebSocket Message Broker│  │
│  └───────────┬───────────┘          └───────────────▲───────────────┘  │
│              │                                      │                  │
│  ┌───────────▼───────────┐          ┌───────────────┴───────────────┐  │
│  │ REST Controllers      │          │ BackgroundJobService (@Async) │  │
│  │ (Auth, Product, Order)│          │ (Email, Invoice, Notification)│  │
│  └───────────┬───────────┘          └───────────────▲───────────────┘  │
│              │                                      │                  │
│  ┌───────────▼───────────┐                          │                  │
│  │ PaymentService        ├──────────────────────────┘                  │
│  │ (Razorpay Verification│                                             │
│  └───────────┬───────────┘                                             │
└──────────────┼─────────────────────────────────────────────────────────┘
               │ JPA / Hibernate
┌──────────────▼─────────────────────────────────────────────────────────┐
│                          POSTGRESQL DATABASE                           │
│     (users, products, orders, order_items, payments, background_jobs)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Post-Payment Asynchronous Pipeline

A key design requirement in high-concurrency e-commerce systems is **never blocking the HTTP checkout or payment verification thread** with heavy I/O operations like PDF rendering or SMTP transmissions.

### Execution Lifecycle

```
[Customer Checkout] 
       │
       ▼
[Razorpay Payment Verification / Webhook]
       │
       ├──► 1. Verify Cryptographic HMAC Signature
       ├──► 2. Update Payment -> PAID
       ├──► 3. Update Order   -> PAID
       ├──► 4. Idempotently generate 3 Background Jobs (PENDING)
       │       ├── EMAIL
       │       ├── INVOICE
       │       └── NOTIFICATION
       │
       └──► 5. Return HTTP 200 OK immediately to Customer
               │
               ▼ (Spring @Async ThreadPool executes in background)
       ┌─────────────────────────────────────────────────────────┐
       │ ✉️ EMAIL WORKER:                                         │
       │    PENDING ──► PROCESSING ──► COMPLETED / FAILED         │
       │    Generates order confirmation and dispatches via SMTP │
       │                                                         │
       │ 🧾 INVOICE WORKER:                                       │
       │    PENDING ──► PROCESSING ──► COMPLETED / FAILED         │
       │    OpenPDF compiles branded A4 PDF to disk storage       │
       │                                                         │
       │ 🔔 NOTIFICATION WORKER:                                  │
       │    PENDING ──► PROCESSING ──► COMPLETED / FAILED         │
       │    Generates and records in-app customer notification    │
       └────────────────────────────┬────────────────────────────┘
                                    │ Broadcasts state transition
                                    ▼
       [STOMP Broker: /topic/jobs] ──► [Admin Live Dashboard]
```

---

## 🛡️ Administrator Suite & Routing Architecture

SmartCart features an isolated, executive-grade administrative control center styled in a dedicated dark **Executive Velvet Obsidian & Crimson Rose** theme (`.admin-theme`) with strict role-based route protection. Storefront views use a matching **Rose & Crimson Velvet** luxury palette.

### 🌐 Admin Application Route Matrix

All administrative operations are strictly consolidated under the `/admin` path:

| URL | View Component | Access Guard | Functional Scope |
|:---|:---|:---|:---|
| **[`/admin`](http://localhost:5173/admin)** | `AdminDashboard` | `role: "ADMIN"` | **Inventory & Catalog Management**: Insert new products with live preview, update inventory levels, delete listings, and view aggregate job telemetry cards. |
| **[`/admin/login`](http://localhost:5173/admin/login)** | `AdminLoginPage` | Public (Admin Only) | **Executive Authentication Portal**: Dedicated security gateway restricting access exclusively to administrator accounts. Rejects customer accounts with explicit access-denied warnings. |
| **[`/admin/orders`](http://localhost:5173/admin/orders)** | `AdminOrdersPage` | `role: "ADMIN"` | **Customer Orders Management**: Review all platform orders, inspect purchased items, track payment confirmation, and monitor financial metrics (Gross Revenue, Paid Order Count, Average Order Value). |
| **[`/admin/jobs`](http://localhost:5173/admin/jobs)** | `BackgroundJobMonitor` | `role: "ADMIN"` | **Real-Time Job Telemetry**: STOMP WebSocket console streaming asynchronous worker executions (Email, Invoice PDF, Notifications) with live status badges and manual retry controls. |

### 🔐 Strict Dual-Portal Authentication

To prevent privilege confusion and maintain airtight security boundaries:

```
                  ┌──────────────────────────────────────────────┐
                  │               AUTH ROUTE GUARD               │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │  /signin (Users Only) │                       │ /admin/login (Admins) │
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
      ┌──────────┴──────────┐                         ┌──────────┴──────────┐
      │                     │                         │                     │
      ▼                     ▼                         ▼                     ▼
[Role: USER]         [Role: ADMIN]              [Role: ADMIN]         [Role: USER]
      │                     │                         │                     │
   Allowed            Access Denied!               Allowed            Access Denied!
Redirect: "/"     "Use /admin/login portal"    Redirect: "/admin"   "Restricted to Admins"
```

1. **User Sign-In (`/signin`)**:
   - Strictly reserved for customer accounts.
   - Any attempt to sign in with an `ADMIN` account is intercepted and rejected with a helpful redirect notice to `/admin/login`.
2. **Admin Portal (`/admin/login`)**:
   - Strictly reserved for `ADMIN` role credentials.
   - Standard users attempting to authenticate are barred with: `⛔ Access Denied: This portal is strictly restricted to SmartCart Administrators`.
3. **Role-Aware Navigation & Interceptors**:
   - **Navbar**: When logged in as an administrator, the navigation bar displays the `🛡️ SmartCart Administrator` badge, dedicated admin routes (`📦 Products`, `📋 Orders`, `⚡ Jobs`), and a standalone **Logout** button that redirects directly back to `/admin/login`.
   - **Axios 401 Interceptor**: If an administrator's session expires while navigating `/admin/*`, the API client automatically routes them to `/admin/login` rather than the public `/signin` page.

---

## 📂 Repository Structure

The project is structured as a clean, production-ready multi-module workspace:

```
SmartCart/
├── README.md                      # Root system documentation (this file)
├── .gitignore                     # Root-level VCS exclusion rules
│
├── smartcart-backend/             # Spring Boot 4 application
│   ├── README.md                  # Comprehensive backend engineering guide
│   ├── pom.xml                    # Maven dependencies & build configuration
│   ├── mvnw / mvnw.cmd            # Maven wrapper binaries
│   └── src/
│       ├── main/
│       │   ├── java/com/klu/
│       │   │   ├── EcommerceBackendApplication.java # @SpringBootApplication & @EnableAsync
│       │   │   ├── config/       # SecurityConfig, WebSocketConfig, PasswordConfig
│       │   │   ├── controller/   # REST Controllers (Auth, Product, Order, Payment, Job)
│       │   │   ├── dto/          # Data Transfer Objects & API schemas
│       │   │   ├── model/        # JPA Entities (User, Product, Order, BackgroundJob, etc.)
│       │   │   ├── repository/   # Spring Data JPA repositories
│       │   │   ├── security/     # JWT filter, token provider, CustomUserDetailsService
│       │   │   └── service/      # Business logic, @Async workers, PDF engine
│       │   └── resources/
│       │       └── application.properties # PostgreSQL, Mail, JWT & Razorpay config
│       └── test/                 # JUnit 5 integration tests
│
└── smartcart-frontend/            # React 19 + TypeScript + Vite SPA
    ├── README.md                  # Comprehensive frontend engineering guide
    ├── package.json               # Frontend dependencies & scripts
    ├── vite.config.ts             # Vite build & bundler configuration
    ├── tsconfig.json              # TypeScript strict configuration
    └── src/
        ├── api/                   # Axios API clients with JWT interceptors
        ├── components/            # Reusable UI components (Navbar, Cart, ProductCard)
        ├── pages/                 # Route views (Home, Checkout, Orders, Signin, Signup, AdminDashboard, AdminLoginPage, AdminOrdersPage, BackgroundJobMonitor)
        ├── schemas/               # Zod validation schemas for forms
        ├── services/              # STOMP WebSocket client singleton
        ├── store/                 # Zustand global state (Auth, Cart)
        ├── types/                 # TypeScript interfaces and domain models
        └── index.css              # Custom design system styles & animations
```

---

## 🛠 Tech Stack Deep-Dive

### Backend Technologies
- **Java 21 (LTS)**: Utilizing modern language features (records, pattern matching, virtual threads compatibility).
- **Spring Boot 4.1.1**: Core framework providing dependency injection, data persistence, and web services.
- **Spring Security 6 & BCrypt**: Password hashing with cost factor 10, stateless JWT authentication filter.
- **JSON Web Tokens (`jjwt-api:0.12.6`)**: Cryptographically signed HMAC-SHA256 tokens for stateless user sessions.
- **Spring WebSocket & STOMP**: Full-duplex messaging with SockJS fallback for reliable cross-browser event streaming.
- **Spring Data JPA & Hibernate**: Entity lifecycle management and automated table generation.
- **OpenPDF (`2.0.3`)**: High-performance, license-friendly Java PDF generation engine for digital invoices.
- **Spring Mail**: JavaMailSender abstraction for transactional email workflows.
- **Razorpay Java SDK (`1.4.3`)**: Official payment SDK for order creation and HMAC-SHA256 signature verification.

### Frontend Technologies
- **React 19**: Declarative component-driven UI with modern lifecycle hooks.
- **TypeScript 5.x**: End-to-end type safety covering API contracts, component props, and global state.
- **Vite 8**: Ultra-fast next-generation frontend bundler with Hot Module Replacement (HMR).
- **Zustand**: Minimalist, fast, and hook-based global state management with localStorage synchronization.
- **TanStack Query (React Query)**: Asynchronous server-state synchronization, caching, and background invalidation.
- **@stomp/stompjs**: Pure TypeScript STOMP client over standard WebSocket with heartbeat monitoring.
- **React Hook Form + Zod**: Schema-driven form validation for shipping and billing addresses.
- **CSS3 / Variables**: Custom responsive design system featuring dark-mode foundations and status indicators.

---

## 🗄 Database Schema & Data Model

SmartCart utilizes PostgreSQL for persistent storage.

```
┌─────────────────────────────────┐
│              USERS              │
├─────────────────────────────────┤
│ id           BIGSERIAL [PK]     │
│ name         VARCHAR(255)       │
│ email        VARCHAR(255) [UQ]  │
│ password     VARCHAR(255)       │
│ role         VARCHAR(50)        │
│ created_at   TIMESTAMP          │
└──────────────┬──────────────────┘
               │ 1
               │
               │ *
┌──────────────▼──────────────────┐       1:N       ┌─────────────────────────────────┐
│             ORDERS              ├────────────────►│          ORDER_ITEMS            │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ order_id     BIGSERIAL [PK]     │                 │ id           BIGSERIAL [PK]     │
│ user_id      BIGINT [FK]        │                 │ order_id     BIGINT [FK]        │
│ total_amount NUMERIC(10,2)      │                 │ product_id   BIGINT [FK]        │
│ status       VARCHAR(50)        │                 │ quantity     INTEGER            │
│ created_at   TIMESTAMP          │                 │ price        NUMERIC(10,2)      │
└──────────────┬──────────────────┘                 └─────────────────────────────────┘
               │ 1
               │
               │ *
┌──────────────▼──────────────────┐                 ┌─────────────────────────────────┐
│        BACKGROUND_JOBS          │                 │            PRODUCTS             │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ job_id       BIGSERIAL [PK]     │                 │ id           BIGSERIAL [PK]     │
│ order_id     BIGINT [FK]        │                 │ name         VARCHAR(255)       │
│ job_type     VARCHAR(32)        │                 │ description  TEXT               │
│ status       VARCHAR(32)        │                 │ price        NUMERIC(10,2)      │
│ message      TEXT               │                 │ stock        INTEGER            │
│ created_at   TIMESTAMP          │                 │ image_url    VARCHAR(500)       │
│ updated_at   TIMESTAMP          │                 │ category     VARCHAR(100)       │
└─────────────────────────────────┘                 └─────────────────────────────────┘
```

---

## 📡 API Reference Summary

All API endpoints are prefixed with `/api`. Protected routes require the `Authorization: Bearer <token>` header.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register user account (`name`, `email`, `password`, `role`) |
| `POST` | `/api/auth/signin` | Public | Authenticate credentials and retrieve JWT token |

### 🛍 Products (`/api/products`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/products` | Public | Retrieve product catalog with inventory |
| `GET` | `/api/products/{id}` | Public | Retrieve product detail by ID |
| `POST` | `/api/products` | `ADMIN` | Create a new product listing |
| `PUT` | `/api/products/{id}` | `ADMIN` | Update an existing product |
| `DELETE` | `/api/products/{id}` | `ADMIN` | Remove product listing |

### 📦 Orders (`/api/orders`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/orders` | `USER`, `ADMIN` | Create order in `PENDING` status with item lines |
| `GET` | `/api/orders/my` | `USER`, `ADMIN` | Fetch authenticated user's order history |
| `GET` | `/api/orders/{id}` | `USER`, `ADMIN` | Fetch specific order details |
| `GET` | `/api/orders` | `ADMIN` | Fetch all orders across the platform |

### 💳 Payments (`/api/payment`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/payment/create-order` | `USER`, `ADMIN` | Generate Razorpay order for checkout |
| `POST` | `/api/payment/verify` | `USER`, `ADMIN` | Verify signature, mark `PAID`, trigger async jobs |
| `POST` | `/api/payment/webhook` | Public (Signed) | Process asynchronous Razorpay webhook events |

### ⚡ Background Jobs (`/api/jobs`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/jobs` | `ADMIN` | Query jobs (Filter by `?status=...&jobType=...`) |
| `GET` | `/api/jobs/stats` | `ADMIN` | Get job metrics (`total`, `pending`, `processing`, etc.) |
| `POST` | `/api/jobs/{id}/retry` | `ADMIN` | Trigger immediate asynchronous retry for failed jobs |

---

## 🔒 Security & Authentication

1. **Password Protection**: BCrypt algorithm with salted rounds ensures irreversible password hashes.
2. **Stateless JWT Authorization**:
   - Cryptographically signed using HMAC-SHA256 (`jwt.secret`).
   - Token claims encode user identity and authorities (`ROLE_USER`, `ROLE_ADMIN`).
3. **Role-Based Access Control (RBAC)**:
   - Product management, job inspection, and retries are restricted strictly to administrators.
4. **Payment Cryptographic Verification**:
   - Prevents client-side tampering by validating Razorpay HMAC signatures on the server before updating order state.
5. **Idempotency**:
   - Background jobs are guarded against duplicate execution through verification queries, ensuring safe handling of redundant webhook deliveries.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Java**: JDK 21+
- **Node.js**: v18.0.0+ (v20+ recommended)
- **PostgreSQL**: v14+
- **Git**: Installed and configured

### 1. Database Provisioning
Log in to PostgreSQL and create the database:
```sql
CREATE DATABASE ecommerce_db;
```

### 2. Backend Setup
```bash
cd smartcart-backend

# Configure database credentials in application.properties or via ENV
# Run database migrations and start server
./mvnw spring-boot:run
```
*Backend server launches on `http://localhost:8080`.*

### 3. Frontend Setup
```bash
cd smartcart-frontend

# Install dependencies
npm install

# Start local development server with Vite HMR
npm run dev
```
*Frontend application launches on `http://localhost:5173`.*

---

## ⚙️ Environment Configuration

### Backend (`smartcart-backend/src/main/resources/application.properties`)
```properties
# Server
server.port=8080

# PostgreSQL
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/ecommerce_db}
spring.datasource.username=${DATABASE_USERNAME:postgres}
spring.datasource.password=${DATABASE_PASSWORD:your_password}
spring.jpa.hibernate.ddl-auto=update

# JWT Secret (Base64 or 256-bit string)
jwt.secret=${JWT_SECRET:dGVzdF9qd3Rfc2VjcmV0X2tleV9mb3Jfc21hcnRjYXJ0X2FwcGxpY2F0aW9uXzIwMjY=}

# Razorpay Keys
razorpay.key.id=${RAZORPAY_KEY_ID:rzp_test_YourKeyId}
razorpay.key.secret=${RAZORPAY_KEY_SECRET:YourKeySecret}
razorpay.webhook.secret=${RAZORPAY_WEBHOOK_SECRET:YourWebhookSecret}

# Mail Configuration (Optional - falls back cleanly to logger if disabled)
spring.mail.host=${MAIL_HOST:smtp.gmail.com}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME:smartcart.store@gmail.com}
spring.mail.password=${MAIL_PASSWORD:your_app_password}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

---

## 🧪 Verification & Testing

### Complete End-to-End Walkthrough
1. **Customer Sign Up & User Login**:
   - Register a customer account at `http://localhost:5173/signup`.
   - Log in at `http://localhost:5173/signin` (dedicated customer portal). Use the SVG password toggle (Eye / EyeOff).
2. **Cart & Payment Checkout**:
   - Browse products and add items to your shopping cart.
   - Proceed to `/checkout`, submit validated shipping credentials, and complete payment via Razorpay test modal.
3. **Customer Orders**:
   - Navigate to `/orders` to verify instant order confirmation and itemized receipts.
4. **Admin Portal Login**:
   - Navigate to `http://localhost:5173/admin/login` (dedicated executive portal).
   - Sign in with administrator credentials:
     - **Email**: `admin@smartcart.com`
     - **Password**: `admin@smartcart`
5. **Admin Operations Suite**:
   - **Catalog & Inventory (`/admin`)**: Add new inventory listings, modify stock, or delete discontinued products.
   - **Orders Directory (`/admin/orders`)**: Review real-time customer purchases, gross revenue, status filters, and line items.
   - **Background Job Telemetry (`/admin/jobs`)**: Observe asynchronous post-payment jobs (`PENDING` $\to$ `PROCESSING` $\to$ `COMPLETED`) over live STOMP WebSocket. Check generated invoice PDFs in `smartcart-backend/invoices/`.
   - **Logout**: Click the standalone navbar **Logout** button to securely clear the admin session and return to `/admin/login`.

---

## 📄 License & Authors

Distributed under the **MIT License**. Created and maintained by [chintadavasudharini](https://github.com/chintadavasudharini).
