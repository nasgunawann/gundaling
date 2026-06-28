# POS System Roles & Capability Report - Gundaling Farmstead

This report details the current system implementation for each user role (Manager, Server/Waiter, Chef), identifies security and operational gaps compared to POS industry standards, and provides concrete recommendations for improvement.

---

## 1. Actor Capabilities Matrix (Current Implementation)

### Manager
*   **Frontend UI Capabilities:**
    *   Full sidebar navigation access, including **Product Management** and **Kitchen KDS**.
    *   Toggle **Edit Layout** mode in the Floor Plan view.
    *   Create tables (`Add Table` modal) and delete tables.
    *   Drag and position tables on the layout (automatically synced to backend).
    *   Read/write master dishes catalog, categories, and badges.
*   **Backend Guard Security (`@Roles(Role.Manager)`):**
    *   Authorized to execute `POST`, `PUT`, `DELETE` operations on `/products` and `/categories`.
    *   Authorized to execute `POST` and `DELETE` on `/tables`.

### Server / Waiter
*   **Frontend UI Capabilities:**
    *   Sidebar access to **Floor Plan**, **Table Menu** (Ordering), and **Reservations**.
    *   Access restricted from "Product Management" (redirected to "Access Restrained" warning).
    *   Add products to unsent drafts, modify draft quantities, clear drafts, and transmit order drafts to the kitchen.
    *   Perform **Settle Bill** actions to complete payments.
    *   Create, view, and transition reservations (e.g. from "Confirmed" to "Seated" or "Cancelled").
    *   Receive "OrderReady" real-time notifications for pickup.
*   **Backend Guard Security:**
    *   Runs under general `JwtAuthGuard`. Can perform basic read operations (`GET`) and order/reservation creation (`POST`).
    *   Can currently hit KDS/order status update routes since backend lacks strict `@Roles` checks for order state transitions.

### Chef
*   **Frontend UI Capabilities:**
    *   Access to the **Kitchen KDS** view.
    *   Currently, the UI does *not* restrict the Chef from accessing **Floor Plan**, **Table Menu**, or **Reservations** (visible and clickable in sidebar).
    *   Access restricted from "Product Management" (redirected to "Access Restrained" warning).
*   **Backend Guard Security:**
    *   Runs under general `JwtAuthGuard`. Can read active orders and edit order statuses to `preparing` or `ready`.

---

## 2. Gaps & Deficiencies vs. Industry Standards

### Security & Permission Gaps
1.  **Overprivileged Chef Role (Frontend):** 
    Chefs should be locked into the KDS screen. Giving Chefs access to front-of-house views (Floor Plan, Table Menu, Reservations) clutter the UI and presents unnecessary action risks.
2.  **Weak KDS Backend Guarding:**
    Order status updates (`/orders/:id/status`) are guarded only by `JwtAuthGuard`. Theoretically, any Server or Chef can call these endpoints. The backend needs roles validation (e.g., only Chefs/Managers should be allowed to mark orders as `preparing` or `ready`).
3.  **Unprotected High-Risk Actions (Server):**
    Waiters can clear active tables, void items, or settle bills without any supervisor or manager intervention. Typically, clearing a cart containing sent items (voiding) or processing cash settlement should require a manager's supervisor PIN override.
4.  **No User & Staff Management UI:**
    Managers cannot add new staff, modify user details, or reset secure PINs from the application. System administrator intervention is required directly via the database.

### Functional Gaps
1.  **Split Billing / Split Check:**
    No support for splitting checks by item or seat, which is a staple restaurant standard.
2.  **No Table Management Updates:**
    There is no way to edit table names, seat capacities, or shapes once created (only deletion and recreation).
3.  **No Ticket-Timer Alert System (KDS):**
    KDS tickets are displayed without alert styling when cooking time exceeds standard thresholds (e.g., warning color after 15 minutes, danger after 25 minutes).
4.  **No Reporting / End of Day Reconciliation:**
    Managers cannot view sales summary reports, cash drawer totals, or generate End-of-Day/Shift (Z-report) reconciliations.

---

## 3. Concrete Recommendations & Mitigation Steps

### Phase 1: High Priority (Access Control & Core Security)
1.  **Lock Chef Sidebar Navigation:**
    *   Modify `Sidebar.jsx` so that if `user.role === 'Chef'`, only the `Kitchen KDS` item is visible.
    *   Auto-redirect Chefs to `/kitchen-queue` on login and prevent manual routing.
2.  **Secure Backend KDS Routes:**
    *   Implement `@Roles(Role.Chef, Role.Manager)` guards on KDS state endpoints (`/orders/:id/status`).
3.  **Introduce Supervisor PIN Approval for Voids/Settlement:**
    *   Implement a helper modal to prompt for a Manager's PIN whenever a Server tries to settle a bill or clear sent items.

### Phase 2: Medium Priority (Kitchen & FOH Operations)
1.  **KDS Ticket Color Coding:**
    *   Calculate elapsed time from order `createdAt` in `TicketCard.jsx`.
    *   Apply visual indicators: amber border for $>15$ mins, red blinking border/alert for $>25$ mins.
2.  **Table Configuration Panel (Manager):**
    *   Create a `PUT /api/tables/:id` backend route.
    *   Add an "Edit Table Properties" modal to allow managers to change table names and seat capacities.

### Phase 3: Low Priority (Expansion)
1.  **Staff Management Module:**
    *   Add a user management page accessible only to Managers to register staff, assign roles, and set secure PIN hashes.
2.  **Basic Reporting Dashboard:**
    *   Create a simple query on the backend to aggregate today's sales and export them to a PDF/CSV file for Manager auditing.
