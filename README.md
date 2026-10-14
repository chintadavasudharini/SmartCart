# SmartCart - Full-Stack E-Commerce Platform

SmartCart is an enterprise-grade full-stack e-commerce system built with **Spring Boot 4 / Java 21**, **PostgreSQL**, **React 18 + TypeScript + Vite**, and **Razorpay** payment gateway integration. It includes an asynchronous post-payment background job pipeline (Email, PDF Invoice, Notification) and a live WebSocket/STOMP job monitor for administrators.

---

## 🏗 Architecture & Payment Flow

```
                      CUSTOMER CHECKOUT
                             │
                             ▼
                    Create Order (PENDING)
                             │
                             ▼
                    Razorpay Order Created
                             │
                             ▼
                    Customer Completes Payment
                             │
                             ▼
             Payment Verification / Webhook (`/api/payment/**`)
                             │
                  ┌──────────┴──────────┐
                  ▼                     ▼
            Payment = PAID        Order = PAID
                  └──────────┬──────────┘
                             │
                             ▼
                  Create Background Jobs (Idempotent)
                  ├── EMAIL        (PENDING)
                  ├── INVOICE      (PENDING)
                  └── NOTIFICATION (PENDING)
                             │
               ┌─────────────┴─────────────┐
               ▼ (Instant HTTP Response 200 OK)
         Payment Verified (No blocking)
               │
               ▼ (Asynchronous Workers @Async)
       Process Background Jobs Independently
               │
               ├── 1. EMAIL JOB
               │      PENDING -> PROCESSING -> COMPLETED / FAILED
               │      (Order confirmation sent to customer email)
               │
               ├── 2. INVOICE JOB
               │      PENDING -> PROCESSING -> COMPLETED / FAILED
               │      (OpenPDF generates branded PDF invoice in invoices/ directory)
               │
               ├── 3. NOTIFICATION JOB
               │      PENDING -> PROCESSING -> COMPLETED / FAILED
               │      (User notification dispatched)
               │
               └── Real-time WebSocket (STOMP `/topic/jobs`)
                      │
                      ▼
               Admin Job Monitor (`/admin/jobs`)
               (Live metrics, status pills, error details, instant retry)
```

---

## 🛠 Tech Stack

- **Backend**: Java 21, Spring Boot 4.1.1, Spring Data JPA, Spring Security, Spring Mail, Spring WebSocket / STOMP
- **PDF Generation**: LibrePDF / OpenPDF (`2.0.3`)
- **Database**: PostgreSQL
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS / Vanilla CSS, Lucide icons, `@stomp/stompjs`, Zustand, TanStack Query
- **Payment Gateway**: Razorpay Payments & Webhooks

---

## 📦 Database Entities & Schema

### 1. `BackgroundJob` (`background_jobs`)
| Field | Type | Description |
|---|---|---|
| `job_id` | BIGSERIAL PRIMARY KEY | Unique ID of the job |
| `order_id` | BIGINT NOT NULL (FK -> `orders`) | Order reference |
| `job_type` | VARCHAR (EMAIL, INVOICE, NOTIFICATION) | Type of background task |
| `status` | VARCHAR (PENDING, PROCESSING, COMPLETED, FAILED) | Current lifecycle status |
| `message` | TEXT | Execution log / error description |
| `created_at` | TIMESTAMP NOT NULL | Job creation timestamp |
| `updated_at` | TIMESTAMP NOT NULL | Last status update timestamp |

### 2. `Order` (`orders`)
| Field | Type | Description |
|---|---|---|
| `order_id` | BIGSERIAL PRIMARY KEY | Unique order ID |
| `user_id` | BIGINT NOT NULL (FK -> `users`) | Purchasing user |
| `total_amount` | NUMERIC(10,2) NOT NULL | Total amount in INR |
| `status` | VARCHAR (PENDING, PAID, CANCELLED) | Current order status |
| `created_at` | TIMESTAMP NOT NULL | Creation timestamp |

---

## 🔌 API Endpoints

### Background Job Management (Admin Only - `ROLE_ADMIN`)
- `GET /api/jobs` — Retrieve background jobs with optional query filters:
  - `?status=PENDING|PROCESSING|COMPLETED|FAILED`
  - `?jobType=EMAIL|INVOICE|NOTIFICATION`
- `GET /api/jobs/stats` — Real-time job counter statistics (`totalJobs`, `pendingJobs`, `processingJobs`, `completedJobs`, `failedJobs`).
- `POST /api/jobs/{jobId}/retry` — Retries a `FAILED` background job immediately via `@Async` worker.

### Order Management
- `GET /api/orders/my` — Fetch order history for the authenticated user (requires Bearer token).
- `GET /api/orders/{orderId}` — Fetch details for a specific order.
- `GET /api/orders` — (Admin only) List all orders in the system.

### Payment Processing
- `POST /api/payment/create-order` — Create Razorpay order for cart checkout.
- `POST /api/payment/verify` — Verify signature and transition `Payment = PAID`, `Order = PAID`, triggering asynchronous background jobs idempotently.
- `POST /api/payment/webhook` — Razorpay webhook endpoint (`payment.captured`, `order.paid`) with signature verification and background job creation.

---

## 🌐 WebSocket / STOMP Real-Time Pipeline

- **WebSocket Connection Endpoint**: `ws://localhost:8080/ws-smartcart` (with SockJS fallback fallback enabled).
- **Topic Subscription**: `/topic/jobs`
- **Payload Format**:
  ```json
  {
    "jobId": 12,
    "orderId": 45,
    "jobType": "EMAIL",
    "status": "COMPLETED",
    "message": "Order confirmation email successfully sent to john@example.com",
    "createdAt": "2026-10-08T16:45:00",
    "updatedAt": "2026-10-08T16:45:02"
  }
  ```
- **Live Admin UI**: Available at `/admin/jobs` in the frontend. Includes:
  - Real-time connection badge (🟢 WebSocket Live / 🔴 Disconnected).
  - Summary metrics counter pills (Total, Pending, Processing, Completed, Failed).
  - Filter by Job Status & Job Type.
  - Manual retry action button for failed jobs.
  - Auto-updates existing rows or appends new rows in real-time as WebSocket events arrive.

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration (`ecommerce-backend/src/main/resources/application.properties`)
```properties
# Server
server.port=8080

# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/ecommerce_db
spring.datasource.username=postgres
spring.datasource.password=your_db_password
spring.jpa.hibernate.ddl-auto=update

# JWT Secret
jwt.secret=your_strong_jwt_secret_key_at_least_256_bits_length

# Razorpay Credentials
razorpay.key.id=your_razorpay_key_id
razorpay.key.secret=your_razorpay_key_secret
razorpay.webhook.secret=your_razorpay_webhook_secret

# Mail Configuration (Optional - Falls back gracefully to system console logs if not configured)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:smartcart.store@gmail.com}
spring.mail.password=${MAIL_PASSWORD:your_app_password}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

---

## 🚀 Running the Project

### 1. Start Backend
```bash
cd ecommerce-backend
.\mvnw.cmd spring-boot:run
```
The backend starts on `http://localhost:8080`.

### 2. Start Frontend
```bash
cd ecommerce
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

---

## 🧪 Testing the Complete Pipeline

1. **Sign In / Sign Up**:
   - Register a normal user or admin user (`admin@smartcart.com` / password).
2. **Shop & Checkout**:
   - Add products to cart, proceed to `/checkout`.
   - Complete Razorpay payment (or test payment).
3. **Verify Payment & Background Processing**:
   - Razorpay verification responds immediately with 200 OK (`Order = PAID`, `Payment = PAID`).
   - 3 background jobs (`EMAIL`, `INVOICE`, `NOTIFICATION`) are created in `PENDING` state.
   - Spring Boot `@Async` worker pool picks up each job:
     - `EMAIL`: Logs or sends email confirmation -> `COMPLETED`.
     - `INVOICE`: Creates `invoices/invoice_{orderId}.pdf` -> `COMPLETED`.
     - `NOTIFICATION`: Records payment notification -> `COMPLETED`.
4. **Inspect Admin Job Monitor**:
   - Navigate to `http://localhost:5173/admin/jobs`.
   - Observe real-time job transitions from `PENDING` to `PROCESSING` to `COMPLETED` pushed over WebSocket `/topic/jobs`.
5. **Inspect Customer Order History**:
   - Navigate to `http://localhost:5173/orders`.
   - View recent completed orders with paid status, items, and totals.
