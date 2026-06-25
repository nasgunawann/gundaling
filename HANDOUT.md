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
│   │   ├── components/
│   │   ├── views/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── store.js
│   │   └── main.jsx
│
├── backend/               ← NestJS
│   ├── src/
│   │   ├── auth/          ← JWT login, logout, me
│   │   ├── categories/    ← Categories CRUD
│   │   ├── products/      ← Products CRUD
│   │   ├── tables/        ← Tables CRUD and update position
│   │   ├── reservations/  ← Reservations CRUD
│   │   ├── orders/        ← Orders creation, transmit, status updates
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
- `POST /api/auth/login` → Login with `{ id, pin }` → Returns `{ user, token }`
- `GET /api/auth/me` → Returns current logged-in user

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
- `POST /api/orders` → Create or update current active table order
- `POST /api/orders/:id/transmit` → Transmit unsent items to kitchen (sets status to `pending`, fires socket)
- `PUT /api/orders/:id/status` → Update status (`preparing`, `ready`, `served`, `paid`)

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
