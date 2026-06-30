# Audit Log System Specification & Findings - Gundaling Farmstead

This document details the system review findings regarding user actions across all modules (Auth, Orders, Tables, Products, Users, Reservations) and outlines the formal design specification for implementing a comprehensive, industry-standard Audit Logging system in Gundaling POS.

---

## 1. Executive Summary & Core Findings

An audit of the NestJS backend controllers, services, and the Prisma schema reveals that the system currently **lacks any historical logging or audit trail mechanism**. 

### Critical Vulnerabilities & Gaps:
1. **Financial Actions Untracked:** Bill settlements (`PUT /orders/:id/status` to `paid`) do not log which server collected the payment, at what time, or which terminal processed it.
2. **Supervisor Overrides Unrecorded:** High-privilege actions like table deletion or draft resets do not log the manager PIN verification events.
3. **No Session History:** User logins and logouts are not tracked. In the event of a discrepancies in the cash drawer or inventory, it is impossible to identify which staff members were active on the POS.
4. **Catalog Integrity:** Creation, modification, or deletion of products and prices go completely unlogged.

---

## 2. Identified Auditable System Actions

The subagent scan identified the following active API endpoints and user actions that must be monitored:

### Auth & Security
*   **User Authentication (`POST /auth/login`):** Captures authentication attempts, enabling detection of brute-force PIN entries or unauthorized access.
*   **Supervisor PIN Verification (`POST /auth/verify-manager-pin`):** Captures high-risk overrides (e.g. deleting tables).

### Tables & Layout (FOH)
*   **Create Table (`POST /tables`):** Track when new tables are registered.
*   **Update Table Properties & Coordinates (`PUT /tables/:id`):** Tracks layout changes (X/Y drag-and-drop actions) and property updates (seats, shape, status).
*   **Delete Table (`DELETE /tables/:id`):** Tracks table removals (high risk as active unpaid tickets on deleted tables could be lost).

### Orders & Kitchen (FOH / BOH)
*   **Create Order (`POST /orders`):** Logs when a waiter opens a table and drafts a ticket.
*   **Transmit Order (`POST /orders/:id/transmit`):** Logs when draft items are officially sent to the kitchen KDS.
*   **Update Order Status (`PUT /orders/:id/status`):** Logs critical state transitions:
    *   `preparing` -> Food preparation started (Chef/Manager).
    *   `ready` -> Food plating finished and ready for pickup (Chef/Manager).
    *   `served` -> Food served to customer (Chef/Manager/Server).
    *   `paid` -> Bill settled (Server/Manager).

### Product Catalog Management (Admin)
*   **Create Product (`POST /products`):** Tracks recipe registration.
*   **Update Product / Stock Availability (`PUT /products/:id`):** Tracks changes in master price, name, or quick `outOfStock` status toggles.
*   **Delete Product (`DELETE /products/:id`):** Tracks menu item deletions.

### Staff & Users (Admin)
*   **Create User (`POST /users`):** Tracks registration of new staff.
*   **Update User (`PUT /users/:id`):** Tracks role or employee ID shifts.
*   **Reset Security PIN (`PUT /users/:id/reset-pin`):** Tracks security credential adjustments.
*   **Delete User (`DELETE /users/:id`):** Tracks user deletions.

---

## 3. Recommended Audit Database Schema

To support comprehensive auditing, the following `AuditLog` model is recommended for addition to `backend/prisma/schema.prisma`:

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  userId      String   @map("user_id") // The employee performing the action
  action      String   // E.g., "ORDER_SETTLED", "PIN_OVERRIDE", "TABLE_DELETED"
  targetId    String?  @map("target_id") // Optional ID of the affected resource (Order, Table, Product)
  details     Json     // JSON snapshot of the action payload (e.g., {"tableName": "Table 12", "amount": 250000})
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("audit_logs")
}
```

---

## 4. Audit Log Action Matrix

Below is the structured specification for each logged action:

| Action Name | Category | Roles Allowed | Target ID | Details JSON Structure | Trigger Point |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `LOGIN_SUCCESS` | Authentication | Public | User ID | `{"ip": String, "role": String}` | `POST /auth/login` (Success) |
| `LOGIN_FAILED` | Authentication | Public | None | `{"employeeId": String, "reason": String}` | `POST /auth/login` (Failure) |
| `SUPERVISOR_OVERRIDE` | Security | Server | Manager ID | `{"action": String, "reason": String}` | `POST /auth/verify-manager-pin` |
| `ORDER_CREATED` | Transaction | Server, Manager | Order ID | `{"tableId": String, "tableName": String}` | `POST /orders` |
| `ORDER_TRANSMITTED` | Transaction | Server, Manager | Order ID | `{"itemsCount": Number, "tableName": String}` | `POST /orders/:id/transmit` |
| `ORDER_STATUS_CHANGED`| Transaction | Chef, Manager, Server | Order ID | `{"oldStatus": String, "newStatus": String, "tableName": String}` | `PUT /orders/:id/status` |
| `ORDER_SETTLED` | Financial | Server, Manager | Order ID | `{"totalPaid": Number, "tableName": String}` | `PUT /orders/:id/status` (Paid) |
| `TABLE_CREATED` | Management | Manager | Table ID | `{"name": String, "seats": Number, "shape": String}` | `POST /tables` |
| `TABLE_UPDATED` | Management | Manager, Server | Table ID | `{"changes": Object}` | `PUT /tables/:id` |
| `TABLE_DELETED` | Management | Manager | Table ID | `{"name": String, "seats": Number}` | `DELETE /tables/:id` |
| `PRODUCT_CREATED` | Catalog | Manager | Product ID | `{"name": String, "price": Number}` | `POST /products` |
| `PRODUCT_UPDATED` | Catalog | Manager | Product ID | `{"changes": Object}` | `PUT /products/:id` |
| `PRODUCT_DELETED` | Catalog | Manager | Product ID | `{"name": String}` | `DELETE /products/:id` |
| `USER_CREATED` | Administration | Manager | Staf User ID | `{"name": String, "role": String, "employeeId": String}` | `POST /users` |
| `USER_UPDATED` | Administration | Manager | Staf User ID | `{"changes": Object}` | `PUT /users/:id` |
| `USER_PIN_RESET` | Security | Manager | Staf User ID | `{"targetEmployeeId": String, "targetName": String}` | `PUT /users/:id/reset-pin` |
| `USER_DELETED` | Administration | Manager | Staf User ID | `{"name": String, "employeeId": String}` | `DELETE /users/:id` |

---

## 5. Security & Operational Recommendations

1. **Read-Only Audit Logs:** The audit logs must be write-only for the application. There should be no `PUT` or `DELETE` endpoints for `/audit-logs` to prevent staff or malicious actors from altering security records.
2. **Real-time Alerting:** High-risk logs (such as `USER_PIN_RESET` or `TABLE_DELETED`) should trigger real-time notifications to active manager terminals.
3. **Log Retention Policy:** Implement an end-of-day archiving job to compress and store older audit logs externally, keeping the main database fast and responsive.
