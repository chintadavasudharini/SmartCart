<div align="center">

# ⚡ SmartCart Frontend — Client Architecture & Engineering Guide

**Modern React 19 • TypeScript • Vite • Zustand • STOMP WebSocket • Real-Time UI**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443e38?style=for-the-badge&logo=react&logoColor=white)](https://github.com/pmndrs/zustand)
[![STOMP](https://img.shields.io/badge/WebSocket-STOMP.js-000000?style=for-the-badge&logo=socketdotio&logoColor=white)](https://stomp-js.github.io/)

---

The SmartCart frontend is a high-performance Single Page Application (SPA) designed with strict modularity, complete type safety, responsive design, and real-time WebSocket state reconciliation.

</div>

---

## 📑 Table of Contents

- [Architectural Principles](#-architectural-principles)
- [Directory Structure](#-directory-structure)
- [Application Routes & Page Matrix](#-application-routes--page-matrix)
- [State Management Architecture](#-state-management-architecture)
- [Real-Time WebSocket & STOMP Integration](#-real-time-websocket--stomp-integration)
- [Form Validation & UX Patterns](#-form-validation--ux-patterns)
- [API Client Layer & Interceptors](#-api-client-layer--interceptors)
- [Design System & Styling](#-design-system--styling)
- [Development & Build Commands](#-development--build-commands)
- [Environment Configuration](#-environment-configuration)

---

## 🏛 Architectural Principles

1. **Separation of Concerns**:
   - **Client State**: Ephemeral UI flags, shopping cart items, and authenticated session credentials reside in reactive Zustand stores with selective `localStorage` persistence.
   - **Server State**: Asynchronous REST resources (orders, background jobs, product catalog) are managed through typed API wrappers and TanStack Query caching.
   - **Live Telemetry State**: WebSocket STOMP packets mutate real-time state trees without requiring destructive full-page re-renders.

2. **Strict Type Safety**:
   - Every domain object (`User`, `Product`, `Order`, `BackgroundJob`, `JobStatus`) is strictly typed in `src/types/`.
   - Compile-time checking prevents invalid props, incorrect API payloads, and unhandled `null` or `undefined` states.

3. **Performance First**:
   - Bundled with Vite using ESBuild for sub-second Hot Module Replacement (HMR).
   - Zero heavyweight CSS framework runtime overhead: styling is powered by optimized CSS custom properties (variables) and lightweight utility classes.

---

## 📂 Directory Structure

```
smartcart-frontend/
├── index.html                     # SPA HTML template
├── package.json                   # Dependencies, build scripts & metadata
├── tsconfig.json                  # TypeScript compiler settings
├── vite.config.ts                 # Vite bundler configuration
│
└── src/
    ├── main.tsx                   # React root mount with BrowserRouter
    ├── App.tsx                    # Route definitions & layout wrappers
    ├── index.css                  # Global design tokens, animations & resets
    ├── App.css                    # Component-specific styles
    │
    ├── api/                       # Typed HTTP service layer
    │   ├── apiClient.ts           # Central Axios instance with Bearer token interceptor
    │   ├── authApi.ts             # Sign in, Sign up calls
    │   ├── productApi.ts          # Catalog retrieval & product mutations
    │   ├── orderApi.ts            # User orders and admin order listings
    │   ├── paymentApi.ts          # Razorpay order generation & signature verification
    │   └── jobApi.ts              # Admin background job queries & retry triggers
    │
    ├── components/                # Modular, reusable UI components
    │   ├── Navbar.tsx             # Responsive navbar with live cart badge & auth menu
    │   ├── Cart.tsx               # Cart drawer/list with increment, decrement, and delete
    │   ├── CheckoutForm.tsx       # Validated shipping form integrated with Razorpay
    │   ├── ProductCard.tsx        # Product card with price, stock status & quick-add
    │   └── ProductList.tsx        # Filterable product grid
    │
    ├── pages/                     # Routed page-level views
    │   ├── HomePage.tsx           # Hero section, category filters & product grid
    │   ├── CartPage.tsx           # Full-page shopping cart summary & subtotal computation
    │   ├── CheckoutPage.tsx       # Order review & payment trigger
    │   ├── OrdersPage.tsx         # Customer order history with items, prices, and status
    │   ├── SigninPage.tsx         # Sign in page with password visibility toggle
    │   ├── SignupPage.tsx         # Sign up page with password visibility toggle
    │   ├── AdminDashboard.tsx     # Admin dashboard with catalog management & job metrics
    │   ├── BackgroundJobMonitor.tsx # Live STOMP WebSocket job monitor with retry controls
    │   └── UserDashboard.tsx      # User account profile summary
    │
    ├── schemas/                   # Zod runtime validation schemas
    │   └── checkoutSchema.ts      # Shipping address & checkout field validations
    │
    ├── services/                  # Real-time network services
    │   └── websocketService.ts    # STOMP client manager with automatic reconnect
    │
    ├── store/                     # Reactive Zustand state stores
    │   ├── authStore.ts           # User identity, JWT token, and session actions
    │   └── cartStore.ts           # Cart items, quantities, and subtotal calculation
    │
    └── types/                     # TypeScript domain models
        ├── auth.ts                # Auth request/response contracts
        ├── cart.ts                # Cart item data structures
        ├── job.ts                 # BackgroundJob, JobStatus, JobStats interfaces
        ├── order.ts               # Order & OrderItem representations
        └── product.ts             # Product schema definitions
```

---

## 🧭 Application Routes & Page Matrix

| Route | View Component | Access Level | Description |
|---|---|---|---|
| `/` | `HomePage` | Public | Explore product catalog, featured items, and category filters |
| `/cart` | `CartPage` | Public | Inspect cart items, modify quantities, and review subtotal |
| `/checkout` | `CheckoutPage` | Authenticated | Enter shipping details and invoke Razorpay payment checkout modal |
| `/orders` | `OrdersPage` | Authenticated | View authenticated user's order history, products, and paid status |
| `/signin` | `SigninPage` | Public | User authentication with interactive SVG password toggle (Eye / EyeOff) |
| `/signup` | `SignupPage` | Public | Account registration with interactive SVG password toggle (Eye / EyeOff) |
| `/admin` | `AdminDashboard` | `ADMIN` Role | Product management dashboard and background jobs summary widget |
| `/admin/jobs` | `BackgroundJobMonitor`| `ADMIN` Role | Real-time STOMP WebSocket job monitor with filter chips and manual retry |
| `/user` | `UserDashboard` | Authenticated | User account profile overview |

---

## 📦 State Management Architecture

### 1. `authStore` (`src/store/authStore.ts`)
Manages authentication credentials and session persistence via `localStorage`:
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}
```
- On login, saves the JWT to `localStorage.getItem("token")` and updates reactive state.
- Automatically clears session on logout and redirects to `/signin`.

### 2. `cartStore` (`src/store/cartStore.ts`)
Controls the shopping cart with persistent client storage:
- Actions: `addItem(product)`, `removeItem(productId)`, `updateQuantity(productId, quantity)`, `clearCart()`.
- Computes `totalCount` and `totalAmount` dynamically for header badges and checkout summaries.

---

## 📡 Real-Time WebSocket & STOMP Integration

The frontend connects directly to the backend Spring Boot STOMP broker via the `websocketService.ts` singleton:

```
[Spring Boot: /ws-smartcart]
          │
          ▼ STOMP over WebSocket
[websocketService.ts] (Singleton Client)
          │
          ├── On Connect: Subscribes to destination: "/topic/jobs"
          ├── On Disconnect: Automatically logs and attempts reconnection
          │
          ▼ Callback Handlers
[BackgroundJobMonitor.tsx]
          │
          ├── If Job exists in table: Update status, message, and timestamp in-place
          └── If Job is new: Prepend to top of job list and update live metric counters
```

### Dynamic State Reconciliation
When a job event arrives over the WebSocket:
```typescript
const handleJobUpdate = (updatedJob: BackgroundJob) => {
    setJobs(prevJobs => {
        const index = prevJobs.findIndex(j => j.jobId === updatedJob.jobId);
        if (index !== -1) {
            const next = [...prevJobs];
            next[index] = updatedJob;
            return next;
        }
        return [updatedJob, ...prevJobs];
    });
    // Invalidate and refresh stats
    fetchStats();
};
```

---

## 📝 Form Validation & UX Patterns

### 1. Interactive SVG Password Visibility Toggle (Eye / EyeOff)
Implemented in `SigninPage.tsx` and `SignupPage.tsx` using a clean, accessible button overlay with crisp SVG icons:
```tsx
<div className="password-input-wrapper">
    <input
        className="form-control"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
    />
    <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShowPassword(!showPassword)}
        title={showPassword ? "Hide password" : "Show password"}
        aria-label={showPassword ? "Hide password" : "Show password"}
    >
        {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
        ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        )}
    </button>
</div>
```

### 2. Schema Validation with Zod
Checkout forms enforce strict validations (Postal code regex, valid email format, minimum length constraints) before allowing Razorpay modal initialization.

---

## 🔌 API Client Layer & Interceptors

All API communication routes through `src/api/apiClient.ts`, an Axios instance configured with an automatic Bearer token interceptor:

```typescript
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

This guarantees all authenticated endpoints (`/api/orders/my`, `/api/jobs/**`, etc.) carry valid authentication credentials without repetitive token passing in component code.

---

## 🎨 Design System & Styling

Global styles in `src/index.css` utilize structured design tokens:
- **Pulsing Live Indicator**: Animates green when the STOMP WebSocket connection is active.
- **Job Status Badges**:
  - `PENDING`: Neutral muted pill.
  - `PROCESSING`: Pulsing amber pill.
  - `COMPLETED`: Vibrant emerald pill.
  - `FAILED`: Crimson alert pill with retry action trigger.
- **Responsive Tables**: Data tables feature horizontal overflow scrolling on mobile viewports with sticky headers.

---

## 🚀 Development & Build Commands

```bash
# Install dependencies
npm install

# Start development server with Hot Module Replacement
npm run dev

# Run TypeScript compile check and build production bundle
npm run build

# Preview production build locally
npm run preview

# Run ESLint validation
npm run lint
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root of `smartcart-frontend/` (optional, defaults point to `http://localhost:8080`):

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=ws://localhost:8080/ws-smartcart
```
