# Gundaling Farmstead POS — Architecture Plan

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Laravel 11 |
| Database | PostgreSQL |
| Real-time | Laravel Reverb + pusher-js |
| Auth | Laravel Sanctum (SPA tokens) |

## Folder Structure

```
C:\laragon\www\gundaling\
├── frontend/              ← React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ReceiptModal.jsx
│   │   │   └── NotificationProvider.jsx
│   │   ├── views/
│   │   │   ├── WaiterLogin.jsx
│   │   │   ├── FloorPlan.jsx
│   │   │   ├── TableOrderView.jsx
│   │   │   ├── ProductEnrichment.jsx
│   │   │   ├── Reservations.jsx
│   │   │   └── KitchenDisplay.jsx    (NEW — KDS)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
├── backend/               ← Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── ProductController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── TableController.php
│   │   │   ├── OrderController.php
│   │   │   └── ReservationController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Product.php
│   │   │   ├── Category.php
│   │   │   ├── Table.php
│   │   │   ├── Order.php
│   │   │   ├── OrderItem.php
│   │   │   └── Reservation.php
│   │   └── Events/
│   │       ├── OrderSent.php
│   │       ├── OrderAccepted.php
│   │       ├── OrderPreparing.php
│   │       ├── OrderReady.php
│   │       ├── OrderServed.php
│   │       └── OrderPaid.php
│   ├── database/migrations/
│   └── routes/api.php
│
└── HANDOUT.md             (this file)
```

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | auto-increment |
| name | varchar | Staff display name |
| role | enum | `Server`, `Manager`, `Chef` |
| pin_hash | varchar | bcrypt of 4-digit PIN |
| created_at | timestamp | |

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | auto-increment |
| name | varchar | e.g. "Meals", "Coffee", "Desserts" |
| sort_order | int | Display ordering |
| created_at | timestamp | |
| updated_at | timestamp | |

### products
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | auto-increment |
| name | varchar | |
| price | decimal(12,2) | in IDR |
| category_id | bigint FK → categories.id | |
| image | varchar | Image path/URL |
| desc | text | Description |
| badge | varchar | "Best Seller", "Signature", "Vegan", etc. |
| out_of_stock | boolean | If true → greyed out in menu |
| details | jsonb | `{temp, time, calories}` |
| standards | jsonb | `{organicCert, tempControlled, allergenWarning, garnishAdded}` |
| active | boolean | Soft visibility toggle |
| created_at | timestamp | |
| updated_at | timestamp | |

### tables
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | auto-increment |
| name | varchar | "Table 01", "Table 12" |
| seats | int | Capacity |
| shape | enum | `circle`, `square`, `rectangle` |
| pos_x | decimal(5,2) | X coordinate % (0–100) |
| pos_y | decimal(5,2) | Y coordinate % (0–100) |
| created_at | timestamp | |
| updated_at | timestamp | |

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | auto-increment |
| table_id | bigint FK → tables.id | |
| user_id | bigint FK → users.id | Server who created |
| status | enum | `pending` → `accepted` → `preparing` → `ready` → `served` → `paid` |
| total | decimal(12,2) | Grand total (incl. service charge) |
| created_at | timestamp | |
| updated_at | timestamp | |

### order_items
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | auto-increment |
| order_id | bigint FK → orders.id | |
| product_id | bigint FK → products.id | |
| qty | int | |
| unit_price | decimal(12,2) | Snapshot at time of order |
| sent | boolean | Whether kitchen has received this item |
| created_at | timestamp | |

### reservations
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | auto-increment |
| name | varchar | Guest name |
| phone | varchar | |
| guests | int | |
| table_id | bigint FK → tables.id | |
| time | timestamp | Reservation time |
| status | enum | `Confirmed`, `Arrived`, `Seated`, `Cancelled` |
| created_at | timestamp | |
| updated_at | timestamp | |

## Auth (Laravel Sanctum — Token-based SPA mode)

### Endpoints
```
POST /api/login    → { name, pin } → { user, token }
POST /api/logout   → revoke token
GET  /api/me       → current user
```

### Middleware Chain
- `auth:sanctum` — protect all write endpoints
- Custom middleware checks `user.role` for Manager-only routes (`products`, `categories`, `tables` CRUD)

### Flow
1. Waiter selects name, enters 4-digit PIN
2. Frontend posts to `/api/login`
3. Backend validates PIN via `Hash::check($pin, $user->pin_hash)`
4. Returns Sanctum token + user data
5. Frontend stores token in memory/state (not localStorage)
6. All subsequent requests include `Authorization: Bearer {token}`

## API Endpoints

### Public (no auth required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/login` | Login with name + PIN |

### Authenticated (all roles)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/logout` | Logout |
| GET | `/api/me` | Current user |
| GET | `/api/products` | All active products |
| GET | `/api/categories` | All categories |
| GET | `/api/tables` | All tables with positions |
| GET | `/api/reservations` | All reservations |
| POST | `/api/reservations` | Create reservation |
| PUT | `/api/reservations/{id}` | Update reservation |
| GET | `/api/orders` | Orders (filterable by table, status) |
| POST | `/api/orders` | Send order to kitchen |
| PUT | `/api/orders/{id}/status` | Update order status |
| GET | `/api/orders/kitchen` | KDS queue |

### Manager-only
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/products` | Create product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |
| POST | `/api/tables` | Create table |
| PUT | `/api/tables/{id}` | Update table (incl. pos_x, pos_y) |
| DELETE | `/api/tables/{id}` | Delete table |

## Order Lifecycle

```
 pending        Waiter sends items to kitchen
    │
    ▼
 accepted      Chef acknowledges the order (KDS)
    │
    ▼
 preparing     Chef starts cooking
    │
    ▼
 ready         Chef marks done
    │
    ▼
 served        Waiter serves food to table
    │
    ▼
 paid          Bill settled
```

## Real-time Events (Laravel Reverb)

| Event | Broadcast Channel | Payload | When |
|-------|-------------------|---------|------|
| `OrderSent` | `kitchen-orders` | `{order_id, table_name, items, created_at}` | Waiter clicks "Send to Kitchen" |
| `OrderAccepted` | `waiter-floor` | `{order_id, table_name}` | Chef accepts |
| `OrderPreparing` | `waiter-floor` | `{order_id, table_name}` | Chef starts cooking |
| `OrderReady` | `waiter-floor` | `{order_id, table_name}` | Chef marks done |
| `OrderServed` | `kitchen-orders` | `{order_id, table_name}` | Waiter serves |
| `OrderPaid` | `waiter-floor` | `{order_id, table_name, total}` | Bill settled |

### Channel Rules
- `kitchen-orders` — private channel, only Chef can subscribe
- `waiter-floor` — private channel, only Server/Manager can subscribe

## KDS (Kitchen Display System)

New view: `src/views/KitchenDisplay.jsx`

### Layout: Three-column kanban queue
| Pending | Preparing | Ready |
|---------|-----------|-------|
| New orders from waiters | Chef is cooking | Done, awaiting server pickup |
| Accept button | Start Cooking button | Mark Ready button (auto) |
| Timer: time since received | Timer: cooking duration | Timer: time since done |

### Features
- Audio ping on new incoming order
- Card shows: table name, items with qty, note, elapsed time
- Status change triggers Reverb event

## Floor Plan Drag-Drop

Tables are positioned using `pos_x` and `pos_y` (percentage, 0–100).

- When Manager clicks "Edit Layout", tables become draggable
- On drag end, `PUT /api/tables/{id}` sends new `pos_x, pos_y`
- All connected waiters see updated positions in real-time via `waiter-floor` channel

## Frontend State Management

Replace hardcoded `useState` in `App.jsx` with:

- **Zustand store** (or React Context) for:
  - `user` — authenticated user + token
  - `products` — fetched from API
  - `tables` — fetched from API + websocket updates
  - `orders` — fetched from API + websocket updates
  - `reservations` — fetched from API
- **Axios** with interceptor to attach Bearer token
- **pusher-js** to subscribe to real-time channels

## Vite Dev Proxy

```js
// vite.config.js
server: {
  proxy: {
    '/api': 'http://localhost:8000',
    '/broadcasting/auth': 'http://localhost:8000',
  }
}
```

## Implementation Order (Easiest → Hardest)

### Phase 1: Foundation (Very Easy)
| Step | Task | Depends On |
|------|------|-----------|
| 1 | `laravel new backend` with PostgreSQL config | — |
| 2 | Restructure folders: create `frontend/` + move React files | — |
| 3 | Create migrations: users, categories, products, tables, orders, order_items, reservations | Step 1 |
| 4 | Seed users + demo data | Step 3 |

### Phase 2: Backend CRUD APIs (Medium)
| Step | Task | Depends On |
|------|------|-----------|
| 5 | Build ProductController + CategoryController | Step 4 |
| 6 | Build TableController (with pos_x/pos_y support) | Step 4 |
| 7 | Build ReservationController | Step 4 |
| 8 | Build AuthController + Sanctum setup | Step 4 |

### Phase 3: Order System + Real-time Infrastructure (Hard)
| Step | Task | Depends On |
|------|------|-----------|
| 9 | Build OrderController + Order status machine | Step 8 |
| 10 | Set up Reverb + Events | Step 9 |

### Phase 4: Frontend Integration (Hard)
| Step | Task | Depends On |
|------|------|-----------|
| 11 | Refactor WaiterLogin to use API | Step 8 |
| 12 | Refactor App.jsx to fetch from API + Zustand | Step 5–7 |
| 13 | Integrate pusher-js for real-time updates | Step 10 |

### Phase 5: New Feature UIs (Hardest)
| Step | Task | Depends On |
|------|------|-----------|
| 14 | Build KDS view (KitchenDisplay.jsx) | Step 11–13 |
| 15 | Build floor plan drag-drop UI | Step 6 |

### Phase 6: Verification (Medium)
| Step | Task | Depends On |
|------|------|-----------|
| 16 | Test end-to-end flow | All |
