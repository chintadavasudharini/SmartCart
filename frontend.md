# SmartCart Frontend Documentation

A modern, single-page React + TypeScript storefront and Admin Operations Console built with Vite, Zustand, Axios, and STOMP WebSockets.

---

## 1. Tech Stack

| Category | Library / Tool | Version (`package.json`) | Purpose |
| :--- | :--- | :--- | :--- |
| **UI Framework** | React & React DOM | `^19.2.8` | Component rendering & SPA UI |
| **Language** | TypeScript | `~6.0.2` | Strict static typing |
| **Build Tool** | Vite (`@vitejs/plugin-react`) | `^8.2.2` | Fast HMR dev server & production bundler |
| **Routing** | React Router DOM | `^7.18.3` | Storefront & `/admin/*` routing |
| **Client State** | Zustand | `^5.0.15` | Auth session store & in-memory shopping cart |
| **Server State** | TanStack React Query | `^5.104.1` | Async server data utilities |
| **HTTP Client** | Axios | `^1.20.0` | REST API requests with JWT & 401 interceptors |
| **Realtime** | `@stomp/stompjs` | `^7.3.0` | Live WebSocket stream for background job updates |
| **Forms & Validation** | React Hook Form + Zod + `@hookform/resolvers` | `^7.88.0` / `^4.6.4` / `^5.9.1` | Form management & schema validation |
| **Payments** | Razorpay Checkout JS | External CDN (`index.html`) | Payment modal (`https://checkout.razorpay.com/v1/checkout.js`) |
| **Linting** | ESLint | `^10.9.0` | Code quality & TypeScript linting |

---

## 2. Project Structure

```text
smartcart-frontend/
├── index.html                  # Root HTML shell + Razorpay checkout.js script
├── package.json                # Dependencies & npm scripts
├── vite.config.ts              # Vite + React plugin configuration
└── src/
    ├── main.tsx                # React root mount & global stylesheet import
    ├── App.tsx                 # Route definitions & conditional Footer visibility
    ├── index.css               # Global theme tokens (Rose & Crimson + .admin-theme)
    ├── api/
    │   ├── apiClient.ts        # Axios instance, Bearer JWT & 401 redirect logic
    │   ├── authApi.ts          # /auth/signup, /auth/signin, /auth/me
    │   ├── productApi.ts       # /products CRUD endpoints
    │   ├── orderApi.ts         # /orders create, my-orders, single & all-orders
    │   ├── paymentApi.ts       # /payment/create/{orderId} & /payment/verify
    │   └── jobApi.ts           # /jobs list, stats & retry endpoints
    ├── components/
    │   ├── Navbar.tsx          # Storefront navigation bar, cart badge & auth links
    │   ├── Footer.tsx          # Storefront footer (hidden on /admin/* routes)
    │   ├── ProductList.tsx     # Catalog search, category tabs & product grid
    │   ├── ProductCard.tsx     # Individual product card & Add-to-Cart action
    │   └── CheckoutForm.tsx    # Shipping fields, order placement & Razorpay flow
    ├── pages/
    │   ├── HomePage.tsx        # Clean official landing showcase (/)
    │   ├── ExplorePage.tsx     # Product catalog page (/explore)
    │   ├── CartPage.tsx        # Shopping cart summary & quantity adjustments (/cart)
    │   ├── OrdersPage.tsx      # Customer order history + "Pay Now" flow (/orders)
    │   ├── UserDashboard.tsx   # Customer profile & dashboard (/user)
    │   ├── SigninPage.tsx      # Customer sign-in page (/signin)
    │   ├── SignupPage.tsx      # Customer registration page (/signup)
    │   ├── AdminLoginPage.tsx  # Dedicated Admin portal sign-in (/admin/login)
    │   ├── AdminDashboard.tsx  # Admin product CRUD console (/admin)
    │   ├── AdminOrdersPage.tsx # Admin order management view (/admin/orders)
    │   └── BackgroundJobMonitor.tsx # Live STOMP job tracker & retry UI (/admin/jobs)
    ├── services/
    │   └── websocketService.ts # STOMP client connecting to /ws-smartcart
    ├── store/
    │   ├── authStore.ts        # Zustand auth state synced with localStorage
    │   └── cartStore.ts        # Zustand in-memory shopping cart state
    └── types/
        ├── auth.ts             # SignupRequest, SigninRequest, AuthResponse
        ├── product.ts          # Product interface
        ├── order.ts            # Order & OrderItem interfaces
        └── job.ts              # BackgroundJob, JobStats, JobType, JobStatus
```

---

## 3. Environment Configuration

Create a `.env` file in `smartcart-frontend/` when pointing to a non-default backend host:

| Variable | Default Value | Used In | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8080` | `apiClient.ts`, `websocketService.ts` | Base origin for REST calls (`${VITE_API_URL}/api`) |
| `VITE_WS_URL` | Derived from `VITE_API_URL` (`ws://localhost:8080/ws-smartcart`) | `websocketService.ts` | Explicit STOMP WebSocket endpoint URL |

---

## 4. Routing & Dual-Portal Layout

Routes are defined in `src/App.tsx`. The storefront renders `<Navbar />` and `<Footer />`, while routes starting with `/admin` automatically hide `<Footer />` and apply the dark Admin theme.

### Storefront Routes (`USER` / Public)

| Path | Component | Purpose |
| :--- | :--- | :--- |
| `/` | `HomePage` | Clean official brand showcase & entry point (links to `/explore`; no embedded product list or cart hero button) |
| `/explore` | `ExplorePage` | Interactive product discovery rendered via `<ProductList />` |
| `/cart` | `CartPage` | Review cart items, update quantities, and proceed to checkout |
| `/checkout` | `CheckoutForm` | Customer shipping inputs, order creation, and Razorpay checkout |
| `/orders` | `OrdersPage` | Authenticated customer's order history with inline `Pay Now` retry for unpaid orders |
| `/user` | `UserDashboard` | Customer profile & account summary |
| `/signin` | `SigninPage` | Customer login |
| `/signup` | `SignupPage` | Customer registration |

### Admin Operations Routes (`ADMIN`)

| Path | Component | Purpose |
| :--- | :--- | :--- |
| `/admin/login` | `AdminLoginPage` | Admin-only sign-in entry point |
| `/admin` | `AdminDashboard` | Product inventory CRUD dashboard (create, update, delete products) |
| `/admin/orders` | `AdminOrdersPage` | View and manage all customer orders |
| `/admin/jobs` | `BackgroundJobMonitor` | Real-time monitor for `EMAIL`, `INVOICE`, and `NOTIFICATION` jobs with filter & manual retry |

---

## 5. State Management (Zustand)

### `useAuthStore` (`src/store/authStore.ts`)
- Hydrates initial `user` (JSON) and `token` (string) from `localStorage`.
- `login(user: AuthResponse)`: writes `localStorage.setItem("user", JSON.stringify(user))` and `localStorage.setItem("token", user.token)`, then updates store state.
- `logout()`: clears `"user"` and `"token"` from `localStorage` and resets state to `null`.

### `useCartStore` (`src/store/cartStore.ts`)
- Holds `cartItems` **in memory** inside Zustand (not persisted to `localStorage`).
- Exposed actions & selectors:
  - `addToCart(product)` — increments quantity if already present or adds with `quantity: 1`
  - `increaseQuantity(productId)`
  - `decreaseQuantity(productId)` — decrements quantity or removes item when hitting 0
  - `removeFromCart(productId)`
  - `clearCart()`
  - `getTotal()` — returns total INR price across all items

---

## 6. Networking, Checkout & Real-Time Updates

### Axios Client (`src/api/apiClient.ts`)
- Base URL: `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api`.
- **Request Interceptor**: attaches `Authorization: Bearer <token>` when `localStorage.getItem("token")` exists.
- **Response Interceptor**: on HTTP `401` (excluding `/auth/signin` and `/auth/signup`), clears `"token"` & `"user"` from `localStorage` and redirects to `/admin/login` if inside `/admin/*`, or `/signin` on storefront routes.

### Order & Razorpay Checkout Flow (`CheckoutForm.tsx` & `OrdersPage.tsx`)
1. Customer fills shipping details (name, email, phone, address, city, postal code) in `CheckoutForm`.
2. Frontend calls `POST /api/orders` with `{ items: [{ productId, quantity }] }` (shipping inputs are passed directly to Razorpay `prefill` and `notes`).
3. Frontend calls `POST /api/payment/create/{orderId}` to receive `{ razorpayOrderId, amount, currency, keyId }`.
4. `window.Razorpay` opens the payment modal.
5. Upon completion, frontend sends `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` to `POST /api/payment/verify`, clears the cart, and navigates to `/orders`.
6. Unpaid orders in `OrdersPage` display a `Pay Now` button that resumes steps 3–5 for that `orderId`.

### STOMP WebSocket Service (`src/services/websocketService.ts`)
- Uses `@stomp/stompjs` `Client` with `reconnectDelay: 5000`.
- Connects to `VITE_WS_URL` or derives `ws://localhost:8080/ws-smartcart` from `VITE_API_URL`.
- Subscribes to `/topic/jobs` and parses `BackgroundJob` JSON payloads to update `BackgroundJobMonitor` in real time.

---

## 7. Visual Design & Themes (`src/index.css`)

- **Storefront — Rose & Crimson Velvet**: Light luxury aesthetic with a soft rose-white canvas (`#fffafb`) and crimson velvet primary accents (`#e11d48`).
- **Admin Console (`.admin-theme`) — Medium Dark Rose-tinted Charcoal Slate**: Dark high-contrast operational theme featuring deep charcoal-slate backgrounds (`#1f1b24`), elevated card surfaces (`#2a2431`), and luminous rose highlights (`#f43f5e`).

---

## 8. Running & Building

```bash
cd smartcart-frontend

# Install dependencies
npm install

# Start Vite development server (http://localhost:5173)
npm run dev

# Production type-check & bundle (outputs to dist/)
npm run build

# Run ESLint checks
npm run lint

# Preview production build locally
npm run preview
```
