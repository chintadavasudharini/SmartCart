# SmartCart Backend Documentation

Spring Boot REST & STOMP WebSocket API powering authentication, catalog management, orders, Razorpay payments, and asynchronous fulfillment jobs (`EMAIL`, `INVOICE`, `NOTIFICATION`).

---

## 1. Tech Stack

| Category | Dependency / Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Language & Runtime** | Java | `21` | LTS runtime |
| **Framework** | Spring Boot (`spring-boot-starter-parent`) | `4.1.1` | Core WebMVC, JPA, Security, Mail, WebSocket |
| **Database Driver** | PostgreSQL JDBC (`org.postgresql:postgresql`) | Managed by Boot | Connects to PostgreSQL `ecommerce_db` |
| **Authentication** | `jjwt-api` / `jjwt-impl` / `jjwt-jackson` | `0.12.6` | Stateless HMAC-SHA JWT signing & validation |
| **Payments** | `com.razorpay:razorpay-java` + `org.json` | `1.4.8` / `20240303` | Razorpay order creation, signature & webhook verification |
| **PDF Generation** | `com.github.librepdf:openpdf` | `2.0.3` | Commercial PDF invoice creation (`invoices/invoice_<id>.pdf`) |
| **API Docs** | `springdoc-openapi-starter-webmvc-ui` | `3.1.0` | OpenAPI 3 spec & Swagger UI |
| **Async & Messaging** | `@EnableAsync` + Spring WebSocket (`STOMP`) + `JavaMailSender` | Managed by Boot | Non-blocking job execution, live `/topic/jobs` broadcasts & SMTP mail |
| **Monitoring** | `spring-boot-starter-actuator` | Managed by Boot | Health & metrics endpoints |

---

## 2. Package Architecture

Root package: `com.klu` (`smartcart-backend/src/main/java/com/klu/`)

```text
com/klu/
├── EcommerceBackendApplication.java   # Entry point (@SpringBootApplication, @EnableAsync)
├── config/
│   ├── DataInitializer.java           # Seeds/syncs default ADMIN account on startup
│   └── WebSocketConfig.java           # STOMP broker (/topic), app prefix (/app), /ws-smartcart
├── controller/
│   ├── AuthController.java            # /api/auth (signup, signin, me)
│   ├── ProductController.java         # /api/products CRUD
│   ├── OrderController.java           # /api/orders creation & queries
│   ├── PaymentController.java         # /api/payment Razorpay create, verify & webhook
│   └── BackgroundJobController.java   # /api/jobs query, stats & manual retry
├── dto/
│   ├── SignupRequest.java             # { name, email, password, role }
│   ├── SigninRequest.java             # { email, password }
│   ├── AuthResponse.java              # { userId, name, email, role, message, token }
│   ├── OrderRequest.java              # { items: OrderItemRequest[] }
│   ├── OrderItemRequest.java          # { productId, quantity }
│   ├── PaymentVerifyRequest.java      # { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
│   ├── BackgroundJobResponse.java     # Flat DTO mapped from BackgroundJob entity
│   └── JobStatsResponse.java          # { totalJobs, pendingJobs, processingJobs, completedJobs, failedJobs }
├── model/
│   ├── User.java, Role.java           # users table & USER / ADMIN enum
│   ├── Product.java                   # products table
│   ├── Order.java, OrderItem.java     # orders & order_items tables
│   ├── Payment.java                   # payment table (Razorpay metadata)
│   └── BackgroundJob.java, JobType.java, JobStatus.java
├── repository/
│   ├── UserRepository.java            # findByEmail, existsByEmail
│   ├── ProductRepository.java         # JpaRepository<Product, Long>
│   ├── OrderRepository.java           # findByUserUserIdOrderByCreatedAtDesc
│   ├── PaymentRepository.java         # findByOrderOrderId, findByRazorpayOrderId
│   └── BackgroundJobRepository.java   # Filter queries + countByStatus
├── security/
│   ├── SecurityConfig.java            # Stateless filter chain, CORS, route authorization, BCrypt
│   ├── JwtAuthenticationFilter.java   # Extracts Bearer token & sets SecurityContext
│   └── CustomUserDetailsService.java  # Loads UserDetails with ROLE_<Role>
└── service/
    ├── UserService.java               # Registration, authentication & getCurrentUser
    ├── JwtService.java                # Generates & validates HS JWTs (24h expiration)
    ├── ProductService.java            # Product catalog CRUD
    ├── OrderService.java              # Order creation, stock validation & lookups
    ├── PaymentService.java            # Razorpay integration & idempotent payment completion
    ├── BackgroundJobService.java      # @Async EMAIL/INVOICE/NOTIFICATION pipeline + STOMP push
    ├── InvoiceService.java            # OpenPDF A4 tax invoice generator
    └── EmailService.java              # JavaMailSender SMTP client with log fallback
```

---

## 3. Security & Authentication (`com.klu.security`)

- **Stateless JWT**: `SecurityConfig` sets `SessionCreationPolicy.STATELESS`, disables CSRF, uses `BCryptPasswordEncoder`, and installs `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`.
- **Token Claims & Expiry**: `JwtService` signs tokens containing `email` (subject), `role`, and `userId` with a 24-hour expiration (`86400000 ms`).
- **401 Handling**: Unauthenticated access to protected endpoints triggers a JSON `401 Unauthorized` response from the custom `AuthenticationEntryPoint`.
- **CORS**: Allows `http://localhost:5173`, `http://127.0.0.1:5173`, and `*` patterns with `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `PATCH` and credentials enabled.
- **Startup Admin Seed (`DataInitializer`)**: Runs on startup to ensure `admin@smartcart.com` (password: `admin@smartcart`, role: `Role.ADMIN`) exists in `users`.

### Route Authorization Matrix (`SecurityConfig.java`)

| Route Pattern / Method | Required Access |
| :--- | :--- |
| `/api/auth/**`, `/api/payment/webhook` | `permitAll` |
| `GET /api/products/**` | `permitAll` |
| `POST / PUT / DELETE /api/products/**` | `ROLE_ADMIN` |
| `/api/jobs/**` | `ROLE_ADMIN` |
| `/ws-smartcart/**`, `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`, `/actuator/**` | `permitAll` |
| All other endpoints (`/api/orders/**`, `/api/payment/create/**`, `/api/payment/verify`, etc.) | `authenticated()` |

---

## 4. REST API Reference

Base URL: `http://localhost:8080/api`

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | `{ name, email, password, role }` | Plain text confirmation or `400` if email exists |
| `POST` | `/api/auth/signin` | Public | `{ email, password }` | `AuthResponse` (`{ userId, name, email, role, message, token }`) |
| `GET` | `/api/auth/me` | Authenticated | — | `AuthResponse` for current principal |

### Products (`/api/products`)

| Method | Endpoint | Access | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | — | `Product[]` |
| `GET` | `/api/products/{productId}` | Public | Path `productId` | `Product` (`404` if not found) |
| `POST` | `/api/products` | `ADMIN` | `Product` JSON | Created `Product` |
| `PUT` | `/api/products/{productId}` | `ADMIN` | `Product` JSON | Updated `Product` |
| `DELETE` | `/api/products/{productId}` | `ADMIN` | Path `productId` | `"Product deleted successfully"` |

### Orders (`/api/orders`)

| Method | Endpoint | Access | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Authenticated | `{ items: [{ productId, quantity }] }` | Created `Order` (`status: "PENDING"`) |
| `GET` | `/api/orders/my` | Authenticated | — | `Order[]` for authenticated user (newest first) |
| `GET` | `/api/orders/{orderId}` | Authenticated | Path `orderId` | `Order` |
| `GET` | `/api/orders` | Authenticated* | — | All `Order[]` in system (*consumed by Admin portal) |

### Payments (`/api/payment`)

| Method | Endpoint | Access | Request / Headers | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/payment/create/{orderId}` | Authenticated | Path `orderId` | `{ razorpayOrderId, amount, currency: "INR", keyId }` |
| `POST` | `/api/payment/verify` | Authenticated | `PaymentVerifyRequest` | `{ status: "SUCCESS", message, orderId }` |
| `POST` | `/api/payment/webhook` | Public (Signed) | Header `X-Razorpay-Signature`, raw JSON payload | `"Webhook processed successfully"` (verifies HMAC and handles `payment.captured`) |

### Background Jobs (`/api/jobs`)

| Method | Endpoint | Access | Query / Path Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs` | `ADMIN` | Optional `?status=&jobType=` | `BackgroundJobResponse[]` |
| `GET` | `/api/jobs/stats` | `ADMIN` | — | `JobStatsResponse` (`totalJobs`, `pendingJobs`, `processingJobs`, `completedJobs`, `failedJobs`) |
| `POST` | `/api/jobs/{jobId}/retry` | `ADMIN` | Path `jobId` | `"Retry triggered for job <jobId>"` (when job is `FAILED`) |

---

## 5. Payment & Asynchronous Fulfillment Pipeline

### Razorpay Payment Lifecycle (`PaymentService.java`)
1. `createRazorpayOrder(orderId)` converts `order.totalAmount` to **paise** (`totalAmount * 100`), creates a Razorpay Order (`currency: "INR"`, receipt `order_<id>`), and saves/updates the `Payment` row with `status = "CREATED"`.
2. `verifyPayment` checks `Utils.verifyPaymentSignature(...)` with `razorpay.key.secret`.
3. On valid signature (or verified `payment.captured` webhook event), `completeSuccessfulPayment` runs idempotently:
   - Updates `Payment` (`razorpayPaymentId`, `razorpaySignature`, `status = "PAID"`).
   - Updates `Order` (`status = "PAID"`).
   - Calls `backgroundJobService.triggerOrderJobs(order)`.

### `@Async` Background Job Engine (`BackgroundJobService.java`)
For each paid order, 3 jobs are created in `background_jobs` (`PENDING`) and processed asynchronously:
1. **`EMAIL`** → `EmailService.sendOrderConfirmation(order)` sends a formatted receipt via `JavaMailSender` (if SMTP fails or isn't configured, logs the email content cleanly and falls back without crashing fulfillment).
2. **`INVOICE`** → `InvoiceService.generateInvoice(order)` builds an A4 Tax Invoice PDF using OpenPDF and writes it to `invoices/invoice_<orderId>.pdf`.
3. **`NOTIFICATION`** → Dispatches an administrative order notification payload.

Every state transition (`PENDING` → `PROCESSING` → `COMPLETED` / `FAILED`) is saved to PostgreSQL and broadcast immediately over STOMP to **`/topic/jobs`** (`WebSocketConfig` endpoint: `/ws-smartcart`).

---

## 6. Configuration & Running (`application.properties`)

Key properties in `smartcart-backend/src/main/resources/application.properties`:

```properties
server.port=8080
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/ecommerce_db}
spring.datasource.username=postgres
spring.datasource.password=root
spring.jpa.hibernate.ddl-auto=update

jwt.secret=<hex-secret>
razorpay.key.id=<razorpay-key-id>
razorpay.key.secret=<razorpay-key-secret>
razorpay.webhook.secret=<razorpay-webhook-secret>
```

### Run Commands

```bash
cd smartcart-backend

# Run Spring Boot API on port 8080
./mvnw spring-boot:run        # Linux/macOS
mvnw.cmd spring-boot:run      # Windows

# Build JAR
mvnw.cmd clean package
```

Interactive OpenAPI documentation is available while running at:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
