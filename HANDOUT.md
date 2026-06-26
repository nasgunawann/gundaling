# Gundaling Farmstead POS — Architecture Plan (NestJS + Prisma + React)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Zustand |
| Backend | NestJS 11 |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.io |
| Auth | JWT Authentication |

## Folder Structure

```
C:\laragon\www\gundaling\
├── frontend/              ← React + Vite
│   ├── src/
│   │   ├── components/    ← Common components (Sidebar, CartDrawer, WebsocketStatus, etc.)
│   │   ├── views/         ← WaiterLogin, FloorPlan, TableOrderView, KitchenDisplay, ProductEnrichment, Reservations
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── store.js
│   │   └── main.jsx
│
├── backend/               ← NestJS
│   ├── src/
│   │   ├── auth/          ← JWT login, logout, me (JWT Login uses TypeCast integer matching via class-transformer)
│   │   ├── categories/    ← Categories CRUD
│   │   ├── products/      ← Products CRUD
│   │   ├── tables/        ← Tables CRUD and position updates
│   │   ├── reservations/  ← Reservations CRUD
│   │   ├── orders/        ← Orders creation, transmit, status updates
│   │   ├── users/         ← Users/Staff query endpoint
│   │   ├── prisma/        ← PrismaService
│   │   ├── events/        ← Socket.io POS Gateway
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma  ← Prisma database models
```

## Database Schema (Prisma)

### Users
- `id` (Int, PK, autoincrement)
- `name` (String)
- `email` (String, unique)
- `password` (String)
- `pinHash` (String)
- `role` (Enum: `Server`, `Manager`, `Chef`)
- `createdAt`, `updatedAt`

### Categories
- `id` (Int, PK, autoincrement)
- `name` (String)
- `sortOrder` (Int)
- `products` (Product[])
- `createdAt`, `updatedAt`

### Products
- `id` (Int, PK, autoincrement)
- `name` (String)
- `price` (Decimal)
- `categoryId` (Int, FK → Category.id)
- `image` (String, nullable)
- `desc` (String, nullable)
- `badge` (String, nullable)
- `outOfStock` (Boolean, default false)
- `details` (Json, nullable)
- `standards` (Json, nullable)
- `active` (Boolean, default true)
- `createdAt`, `updatedAt`

### Tables
- `id` (Int, PK, autoincrement)
- `name` (String)
- `seats` (Int)
- `shape` (String) - `circle`, `square`, `rectangle`
- `posX` (Decimal)
- `posY` (Decimal)
- `status` (String) - `Available`, `Occupied`
- `orders` (Order[])
- `reservations` (Reservation[])
- `createdAt`, `updatedAt`

### Orders
- `id` (Int, PK, autoincrement)
- `tableId` (Int, FK → Table.id)
- `userId` (Int, FK → User.id)
- `status` (Enum: `pending`, `preparing`, `ready`, `served`, `paid`)
- `total` (Decimal)
- `items` (OrderItem[])
- `createdAt`, `updatedAt`

### OrderItems
- `id` (Int, PK, autoincrement)
- `orderId` (Int, FK → Order.id)
- `productId` (Int, FK → Product.id)
- `qty` (Int)
- `unitPrice` (Decimal)
- `sent` (Boolean, default false)
- `note` (String, nullable)

### Reservations
- `id` (Int, PK, autoincrement)
- `name` (String)
- `phone` (String)
- `guests` (Int)
- `tableId` (Int, FK → Table.id)
- `time` (DateTime)
- `status` (Enum: `Confirmed`, `Arrived`, `Seated`, `Cancelled`)
- `createdAt`, `updatedAt`

---

## API Endpoints

All REST endpoints are prefixed with `/api`.

### Auth Module
- `POST /api/auth/login` → Login with `{ id, pin }` (validated with `@Type(() => Number)` / `parseInt`) → Returns `{ user, token }`
- `GET /api/auth/me` → Returns current logged-in user

### Users Module
- `GET /api/users` → Returns list of registered employee staff members

### Categories Module
- `GET /api/categories` → List all categories sorted by `sortOrder`
- `POST /api/categories` → Create (Manager)
- `PUT /api/categories/:id` → Update (Manager)
- `DELETE /api/categories/:id` → Delete (Manager)

### Products Module
- `GET /api/products` → List all active products
- `POST /api/products` → Create (Manager)
- `PUT /api/products/:id` → Update (Manager)
- `DELETE /api/products/:id` → Delete (Manager)

### Tables Module
- `GET /api/tables` → List all tables
- `PUT /api/tables/:id` → Update table coordinates or attributes
- `POST /api/tables` → Create (Manager)
- `DELETE /api/tables/:id` → Delete (Manager)

### Reservations Module
- `GET /api/reservations` → List all reservations
- `POST /api/reservations` → Create new reservation
- `PUT /api/reservations/:id` → Update status/details

### Orders Module
- `GET /api/orders` → List active orders (status !== paid)
- `POST /api/orders` → Send new items to kitchen (Split-Ticket: Always creates a new Order ID for transaction tracking)
- `POST /api/orders/:id/transmit` → Transmit unsent items to kitchen (sets status to `pending`, fires socket)
- `PUT /api/orders/:id/status` → Update status (`preparing`, `ready`, `served`, `paid`)

---

## UI/UX & Architectural Redesign Specifications

### 1. Split-Ticket & Unified Billing
- **Chef Clarity**: Sending newly selected items to the kitchen always creates a new, independent Order ID in the backend. Chefs receive a fresh, unmutated cooking ticket instead of appending to in-progress food lists.
- **Waiter Billing Consolidation**: The Table Menu interface aggregates the subtotal and grandTotal calculations across **all** active orders associated with the table. Settling the bill closes all active table tickets simultaneously.

### 2. Standardized Layout Systems & Affordance
- **Collapsible Mini-Drawer Sidebar**: The main navigation menu dynamically collapses down to 80px (icons only) with a high-affordance hover states chevron toggler.
- **Centralized Websocket Tracker**: Real-time Socket connection state (`WebsocketStatus`) is unified at the bottom of the navigation sidebar.
- **Category Filter Wrap-Around**: Horizontal categories list hides its desktop browser scrollbar natively (`[&::-webkit-scrollbar]:hidden`) and holds `shrink-0` layout parameters to prevent padding squash on state change.
- **High-Density Menu Grid**: Products catalog rendered as `grid-cols-2 md:grid-cols-3 xl:grid-cols-4` with unified `aspect-[4/3]` aspect ratio layouts.
- **Waiters FAB Trigger**: Cart trigger refactored into a floating action button on the bottom right corner with a white cart icon, "View Bill" descriptor text, and a glowing count badge indicator.
- **Confirm Settle Dialog**: The bill settlement button is backed by a fully padded `showConfirm` window modal prompt.

### 3. KDS Masonry Grid & Expeditor
- **Scroll-Free Grid**: Replaced the Kanban layout with a responsive Masonry ticket grid for chefs.
- **SLA Warnings**: Ticket headers turn Yellow at 10 minutes and Red at 15 minutes to highlight delay times.
- **Item Plating Strikes**: Line items are checkable and struck out (`line-through`) individually by cooks.
- **Expeditor Screen Mode**: Fullscreen API (`document.documentElement.requestFullscreen()`) integrated on the KDS view to dedicate full screen real-estate to the kitchen.
- **Waiter Ready Pickup**: When orders enter `ready` status, tables on the floor plan flash/pulse Green and display a "Food Ready!" badge directly.

---

## Real-Time Events (Socket.io Gateway)

Connected clients authenticate via passing token in handshake `auth.token`.

| Event Emitted | Payload | When |
|---|---|---|
| `OrderSent` | `Order` (fully populated) | Order transmitted to kitchen |
| `OrderPreparing` | `Order` (fully populated) | KDS updates status to preparing |
| `OrderReady` | `Order` (fully populated) | KDS updates status to ready |
| `OrderServed` | `Order` (fully populated) | KDS/Server updates status to served |
| `OrderPaid` | `Order` (fully populated) | Server/Manager completes payment |
| `table.updated` | `Table` | Table status/position changes |
| `table.created` | `Table` | New table added |
| `table.deleted` | `TableId` | Table removed |
| `product.created` | `Product` | Product added |
| `product.updated` | `Product` | Product updated |
| `product.deleted` | `ProductId` | Product removed |
| `category.created` | `Category` | Category added |
| `category.updated` | `Category` | Category updated |
| `category.deleted` | `CategoryId` | Category removed |
| `reservation.created` | `Reservation` | Reservation added |
| `reservation.updated` | `Reservation` | Reservation updated |
| `reservation.deleted` | `ReservationId` | Reservation removed |
