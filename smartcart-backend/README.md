<div align="center">

# ⚙️ SmartCart Backend — Server Architecture & Engineering Guide

**Spring Boot 4.1.1 • Java 21 LTS • Spring Security • JWT • STOMP WebSocket • Razorpay • OpenPDF**

[![Java](https://img.shields.io/badge/Java-21%20LTS-007396?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring%20Security-6.0-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)](https://spring.io/projects/spring-security)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![WebSocket](https://img.shields.io/badge/STOMP-Broker-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://stomp.github.io/)
[![OpenPDF](https://img.shields.io/badge/OpenPDF-2.0.3-ED1C24?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://github.com/LibrePDF/OpenPDF)

---

The SmartCart backend is a robust RESTful service and real-time event streaming server designed for transactional integrity, asynchronous task decoupling, and enterprise-grade security.

</div>

---

## 📑 Table of Contents

- [System Architecture & Layering](#-system-architecture--layering)
- [Post-Payment Asynchronous Pipeline](#-post-payment-asynchronous-pipeline)
- [Security & Authentication Architecture](#-security--authentication-architecture)
- [Real-Time WebSocket & STOMP Broker](#-real-time-websocket--stomp-broker)
- [PDF Generation Engine](#-pdf-generation-engine)
- [Transactional Email Service](#-transactional-email-service)
- [Exhaustive REST API Reference](#-exhaustive-rest-api-reference)
- [Database Schema & JPA Entities](#-database-schema--jpa-entities)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Build, Run & Test Commands](#-build-run--test-commands)

---

## 🏛 System Architecture & Layering

The backend enforces a strict layered architecture to maintain clear boundaries between transport, business logic, data persistence, and background tasks:

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT REQUEST                       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              JwtAuthenticationFilter                   │
│   (Validates Bearer token, populates SecurityContext)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    CONTROLLERS                         │
│  (AuthController, ProductController, OrderController,   │
│   PaymentController, BackgroundJobController)          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                     SERVICES                           │
│  (UserService, JwtService, ProductService,             │
│   OrderService, PaymentService, BackgroundJobService)  │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              │                            │ Asynchronous Trigger
┌─────────────▼─────────────┐ ┌────────────▼─────────────┐
│       REPOSITORIES        │ │     @Async WORKERS       │
│  (Spring Data JPA)        │ │  (Email, Invoice, Notif) │
└─────────────┬─────────────┘ └────────────┬─────────────┘
              │                            │
┌─────────────▼─────────────┐ ┌────────────▼─────────────┐
│    PostgreSQL Database    │ │ STOMP SimpMessagingTemp  │
│                           │ │      (/topic/jobs)       │
└───────────────────────────┘ └──────────────────────────┘
```

---

## ⚡ Post-Payment Asynchronous Pipeline

When Razorpay verifies a payment signature (or delivers a `payment.captured` / `order.paid` webhook), the application must finalize the transaction with zero latency for the customer.

### Implementation Workflow (`BackgroundJobService.java`)

```
1. Payment Verification Succeeds:
   ├── Payment status -> PAID
   └── Order status   -> PAID

2. Idempotent Job Creation:
   ├── Checks if jobs already exist for orderId to prevent duplicate execution
   └── Inserts 3 rows in background_jobs table (Status = PENDING):
       - JobType: EMAIL
       - JobType: INVOICE
       - JobType: NOTIFICATION

3. HTTP 200 OK Returned to Customer Immediately:
   └── Client receives instant confirmation without waiting for downstream I/O.

4. Asynchronous Execution (@Async ThreadPool):
   ├── processEmailJob()
   │     PENDING ──► PROCESSING ──► COMPLETED / FAILED
   │     Broadcasts state change to STOMP destination: /topic/jobs
   │
   ├── processInvoiceJob()
   │     PENDING ──► PROCESSING ──► COMPLETED / FAILED
   │     Generates PDF to disk: invoices/invoice_{orderId}.pdf
   │     Broadcasts state change to STOMP destination: /topic/jobs
   │
   └── processNotificationJob()
         PENDING ──► PROCESSING ──► COMPLETED / FAILED
         Records in-app notification
         Broadcasts state change to STOMP destination: /topic/jobs
```

### Idempotency & Retry Guarantee
- If a webhook event arrives multiple times for the same transaction, existing job queries ensure no duplicate jobs are created.
- Administrators can trigger `POST /api/jobs/{jobId}/retry` for any `FAILED` job to re-execute the worker immediately in a background thread.

---

## 🔒 Security & Authentication Architecture

1. **Password Hashing**:
   - Implemented via `BCryptPasswordEncoder` bean with strength 10.
   - Plaintext passwords never touch logs or persistent storage.
2. **Stateless JWT Tokens**:
   - Signed using HMAC-SHA256 (`io.jsonwebtoken:jjwt-api:0.12.6`).
   - Standard claims include subject (user email), issued-at, and expiration (24 hours).
   - Custom claim `role` embeds the user's authority (`ROLE_USER` or `ROLE_ADMIN`).
3. **Security Filter Chain (`SecurityConfig.java`)**:
   - `CSRF`: Disabled (stateless REST architecture).
   - `Session Management`: `SessionCreationPolicy.STATELESS`.
   - `URL Authorization`:
     - `/api/auth/**` $\to$ `permitAll()`
     - `/api/payment/webhook` $\to$ `permitAll()`
     - `/ws-smartcart/**` $\to$ `permitAll()`
     - `GET /api/products/**` $\to$ `permitAll()`
     - `POST/PUT/DELETE /api/products/**` $\to$ `hasRole('ADMIN')`
     - `/api/jobs/**` $\to$ `hasRole('ADMIN')`
     - All other endpoints $\to$ `authenticated()`

---

## 📡 Real-Time WebSocket & STOMP Broker

Configured in `com.klu.config.WebSocketConfig.java`:

- **Handshake Endpoint**: `/ws-smartcart`
- **Fallback**: SockJS enabled for clients behind restrictive firewalls or proxies.
- **Application Destination Prefix**: `/app`
- **Simple Message Broker Destination**: `/topic`
- **Broadcasting Engine**: `SimpMessagingTemplate` broadcasts JSON-serialized `BackgroundJobResponse` packets directly to `/topic/jobs`:

```java
messagingTemplate.convertAndSend("/topic/jobs", new BackgroundJobResponse(job));
```

---

## 📄 PDF Generation Engine

The invoice worker utilizes LibrePDF/OpenPDF (`com.github.librepdf:openpdf:2.0.3`):

- **Location**: `com.klu.service.InvoiceService.java`
- **Output Path**: `invoices/invoice_{orderId}.pdf`
- **Document Specs**: Standard A4 page layout with margins, professional typography, header metadata (Invoice #, Date, Customer Details), tabular line items (Product, Quantity, Unit Price, Line Total), and summary totals with paid stamps.
- **Thread Safety**: Generates files using atomic stream writes without blocking the servlet container.

---

## ✉️ Transactional Email Service

Implemented in `com.klu.service.EmailService.java`:

- Built on `JavaMailSender` abstraction.
- Formats structured order confirmation messages with order ID, item breakdowns, total price, and shipping details.
- **Graceful Fallback**: If SMTP credentials are not configured or the mail server is unreachable, the exception is caught, logged cleanly to system output, and does not crash the application.

---

## 🔌 Exhaustive REST API Reference

### 1. Authentication Controller (`/api/auth`)

#### `POST /api/auth/signup`
Creates a new user account.
```json
// Request Body
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "role": "USER" // Optional, defaults to USER
}
```
```json
// Response Body (200 OK)
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "type": "Bearer",
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "USER"
}
```

#### `POST /api/auth/signin`
Authenticates credentials and returns a JWT token.
```json
// Request Body
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

---

### 2. Products Controller (`/api/products`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | List all available products |
| `GET` | `/api/products/{id}` | Public | Get single product by ID |
| `POST` | `/api/products` | `ADMIN` | Create product (`name`, `description`, `price`, `stock`, `imageUrl`, `category`) |
| `PUT` | `/api/products/{id}` | `ADMIN` | Update product details |
| `DELETE`| `/api/products/{id}` | `ADMIN` | Delete product listing |

---

### 3. Orders Controller (`/api/orders`)

#### `POST /api/orders`
Creates a new order in `PENDING` status.
```json
// Request Body
{
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 4, "quantity": 1 }
  ],
  "shippingAddress": "123 Main St, Springfield"
}
```

#### `GET /api/orders/my`
Returns order history for the currently authenticated user based on JWT context.

#### `GET /api/orders/{orderId}`
Retrieves detailed breakdown for a specific order.

#### `GET /api/orders`
*(Admin Only)* Lists all orders across all customers.

---

### 4. Payment Controller (`/api/payment`)

#### `POST /api/payment/create-order`
Creates a Razorpay Order and returns transaction identifiers.
```json
// Request Body
{
  "orderId": 105
}
```
```json
// Response Body (200 OK)
{
  "razorpayOrderId": "order_ODKj2893df",
  "amount": 299900,
  "currency": "INR",
  "keyId": "rzp_test_YourKeyId"
}
```

#### `POST /api/payment/verify`
Validates Razorpay signature and initiates post-payment asynchronous jobs.
```json
// Request Body
{
  "orderId": 105,
  "razorpayOrderId": "order_ODKj2893df",
  "razorpayPaymentId": "pay_OIKj489df",
  "razorpaySignature": "48239048aef0934df..."
}
```

#### `POST /api/payment/webhook`
Handles Razorpay webhook payloads (`payment.captured`, `order.paid`) with HMAC signature verification.

---

### 5. Background Jobs Controller (`/api/jobs`) — *(Admin Only)*

#### `GET /api/jobs`
Query background jobs with optional filtering.
- **Parameters**:
  - `status` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)
  - `jobType` (`EMAIL`, `INVOICE`, `NOTIFICATION`)
```json
// Response Body (200 OK)
[
  {
    "jobId": 1,
    "orderId": 105,
    "jobType": "EMAIL",
    "status": "COMPLETED",
    "message": "Order confirmation email successfully sent",
    "createdAt": "2026-10-08T16:45:00",
    "updatedAt": "2026-10-08T16:45:02"
  }
]
```

#### `GET /api/jobs/stats`
Returns aggregate status counts:
```json
{
  "totalJobs": 24,
  "pendingJobs": 0,
  "processingJobs": 1,
  "completedJobs": 22,
  "failedJobs": 1
}
```

#### `POST /api/jobs/{jobId}/retry`
Triggers an immediate asynchronous retry for a failed job.

---

## 🗄 Database Schema & JPA Entities

### Entity Relationship Mapping
- **`User`** (`1:N`) $\to$ **`Order`**
- **`Order`** (`1:N`) $\to$ **`OrderItem`**
- **`Order`** (`1:N`) $\to$ **`BackgroundJob`**
- **`Product`** (`1:N`) $\to$ **`OrderItem`**
- **`Order`** (`1:1`) $\to$ **`Payment`**

---

## ⚙️ Configuration & Environment Variables

Key parameters in `src/main/resources/application.properties`:

| Property | Default Value | Description |
|---|---|---|
| `server.port` | `8080` | Server HTTP port |
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/ecommerce_db` | PostgreSQL JDBC connection URL |
| `spring.datasource.username` | `postgres` | Database username |
| `spring.datasource.password` | `root` | Database password |
| `jwt.secret` | *(Configured)* | HMAC-SHA256 signing secret key |
| `razorpay.key.id` | `rzp_test_...` | Razorpay public key ID |
| `razorpay.key.secret` | *(Configured)* | Razorpay private secret key |
| `razorpay.webhook.secret` | *(Configured)* | Razorpay webhook signature secret |
| `spring.mail.host` | `smtp.gmail.com` | SMTP host for email dispatch |
| `spring.mail.port` | `587` | SMTP port |
| `spring.mail.username` | `noreply@smartcart.com` | Outgoing email address |
| `spring.mail.password` | `""` | Outgoing email app password |

---

## 🛠 Build, Run & Test Commands

```bash
# Compile and verify dependencies
./mvnw clean compile

# Execute JUnit test suite
./mvnw test

# Compile test suite without running
./mvnw test-compile

# Start Spring Boot application locally
./mvnw spring-boot:run

# Package production executable JAR
./mvnw clean package -DskipTests
```
*The packaged JAR will be located at `target/ecommerce-backend-0.0.1-SNAPSHOT.jar`.*
