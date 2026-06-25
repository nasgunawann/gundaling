# UI/UX & Responsive Design Audit — Gundaling POS

> Tanggal: 2026-06-26
> Standar: Vercel Web Interface Guidelines + UI/UX Pro Max
> Status: READ-ONLY (belum diperbaiki)

---

## 🔴 HIGH SEVERITY (Kritis)

### TableOrderView.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 198-206 | `<select>` tidak punya `<label>` (htmlFor/id) atau `aria-label` |
| 2 | 216-221 | `<input type="text">` (search) tidak punya `<label>` atau `aria-label` |
| 3 | 250-256 | Kartu produk pakai `<div onClick>` — perlu `role="button"`, `tabIndex`, `onKeyDown` |
| 4 | 361-371 | `<textarea>` tidak punya `<label>` terasosiasi — placeholder bukan label |

### KitchenDisplay.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 175, 198, 221 | List order tidak divirtualisasi — DOM bengkak saat orderan tinggi |
| 2 | 118, 127, 136 | Tombol aksi tidak punya disabled loading state — rawan double-submit |
| 3 | 29 | `new AudioContext()` di setiap order baru — memory leak, browser limit |

### FloorPlan.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 270-282 | Drag container pakai `<div>` — tidak ada keyboard akses (role, tabIndex, onKeyDown) |
| 2 | 354-360 | Tombol delete meja tidak punya `aria-label` |
| 3 | 370-429 | Modal tidak ada `role="dialog"`, `aria-modal`, focus trap |
| 4 | 103/270-282 | `touchmove` listener pasif false tapi tidak ada `touch-action: none` |
| 5 | 237-250 | `overscroll-behavior` tidak diset — rubber-band scroll di iOS |

### ReceiptModal.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 20 | Modal pakai `<div>` — perlu `role="dialog"` + `aria-modal="true"` |
| 2 | 63 | Layout cetak `bg-white` tapi teks pakai `text-on-surface` — tidak terbaca di dark mode |

### ProductEnrichment.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 284-395 | Semua form field (nama, price, category, dll) tidak ada `htmlFor`/`id` pada `<label>` |

### Reservations.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 269-335 | Semua `<label>` dalam form tidak punya `htmlFor` — input tidak punya `id` |
| 2 | 156-157 | Format waktu hardcoded `id-ID` — tidak fleksibel untuk i18n |

### Sidebar.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 63 | Tombol logout cuma pakai `title` — tidak ada `aria-label` |

---

## 🟡 MEDIUM SEVERITY (Penting)

### TableOrderView.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 207-208 | `focus:ring-2 focus:ring-primary` — kontras mungkin kurang dengan `primary/10` |
| 2 | 252-255 | Produk `outOfStock` hanya pakai `opacity-50` — fokus masih bisa, kontras rendah |
| 3 | 446-477 | Tombol Print Bill, Send to Kitchen, Settle Bill — disabled cuma `opacity-50` |

### KitchenDisplay.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 104, 107 | Nama produk/note tidak di-truncate — layout rusak jika panjang |
| 2 | 176, 199, 222 | Loading state tidak ada — langsung show "Queue Cleared" padahal data belum loaded |
| 3 | 80, 120, 129, 138 | `transition-all` — seharusnya properti spesifik (hindari layout thrashing) |
| 4 | 120, 129, 138 | Tombol tidak punya `focus-visible:ring-2` — navigasi keyboard tidak terlihat |
| 5 | 78, 98, 163, 186, 209 | Over- reliance pada `<div>` — perlu semantic `<section>`, `<article>`, `<ul>/<li>` |

### FloorPlan.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 218-233 | Status legend cuma pakai warna — tidak accessible untuk buta warna |
| 2 | 164-169 | `getBadgeStyle` cek status `'Occupied'`/`'Pending Kitchen'` — tidak match dengan data aktual (`'Dining'`, `'Billed'`) |
| 3 | 385-418 | `<label>` tidak punya `htmlFor` — input tidak punya `id` |
| 4 | 375-380 | Tombol close modal tidak punya `aria-label` |
| 5 | 284-351 | Tombol table `disabled` saat edit — tapi parent div masih terima drag event |
| 6 | 214 | `select-none` diterapkan terus — bukan hanya saat edit mode |

### ProductEnrichment.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 219-223, 277-279 | `<img>` tidak punya `width`/`height` eksplisit — menyebabkan CLS |
| 2 | 78-127, 168-174 | Tidak ada `aria-live="polite"` untuk form status / search feedback |

### Reservations.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 344 | Tombol submit tidak punya loading/disabled state |
| 2 | 209, 215 | Quick action buttons tidak punya loading state selama API call |
| 3 | 240-247 | Empty state "No matching bookings" tidak punya guidance / CTA |

### Sidebar.jsx + ReceiptModal.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | Sidebar:29-35, 63-67 | Nav items dan logout button tidak punya `focus-visible:ring-2` |
| 2 | ReceiptModal:54-58, 115-119 | Close button dan Print button tidak punya `focus-visible:ring-2` |

---

## 🔵 LOW SEVERITY (Saran)

### TableOrderView.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 289-290, 386-389, 393-396, 401-407 | Touch target hampir 44x44px — perlu diperbesar untuk layar sentuh |
| 2 | 323-329 | Clear Cart button pakai `title` — perlu `aria-label` |
| 3 | 372-378 | Add Note button `text-[10px]` — terlalu kecil untuk tap mobile |
| 4 | 258-268 | Out of stock badge `text-[8px]` — terlalu kecil, minimum 12px |

### KitchenDisplay.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 163, 186, 209 | `max-h-[calc(100vh-200px)]` — rentan overflow di mobile dengan browser chrome; prefer `dvh` |
| 2 | 118, 127, 136 | Tombol aksi tidak punya `aria-label` (contoh: "Start cooking order #123") |

### FloorPlan.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 224, 228, 232 | Warna status mungkin gagal WCAG AA 4.5:1 — perlu dicek contrast ratio |
| 2 | 253-255 | Spinner loading tidak punya `role="status"` |
| 3 | 292, 312, 333 | `<h3>` tanpa `<h1>` di halaman — heading outline rusak |
| 4 | 65-66 | `getBoundingClientRect()` hanya dipanggil sekali — bisa stale saat resize/scroll |
| 5 | 176 | `<header>` di dalam `<div>` — landmark jadi tidak berguna |

### ProductEnrichment.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 168-174, 286-292 | Input search dan form tidak punya `autocomplete` attribute |
| 2 | 18-32 | 13x `useState` untuk form — rekomendasi `react-hook-form` |

### Reservations.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | 112 | Search input tidak punya `id` |
| 2 | 141-142 | Tabel forced horizontal scroll dengan `min-w-[700px]` — perlu mobile card layout |
| 3 | 99-105 | "New Reservation" button tidak punya `aria-label` (tapi teks cukup deskriptif) |

### Sidebar.jsx + ReceiptModal.jsx + WebsocketStatus.jsx

| # | Baris | Masalah |
|---|-------|---------|
| 1 | Sidebar:32, 66; ReceiptModal:56, 118 | Tombol tidak punya `touch-action: manipulation` |
| 2 | WebsocketStatus:35, 39 | Shadow color hardcoded `rgba()` — mungkin tidak cocok di dark mode |

---

## Rekomendasi Prioritas Perbaikan

```
Iterasi 1 (High):
├── Label + id pada semua form input
├── Keyboard accessibility (role, tabIndex, onKeyDown)
├── List virtualization di KDS
├── Focus trap + dialog role pada modal
└── Fix AudioContext leak di KDS

Iterasi 2 (Medium):
├── Disabled/loading state pada tombol async
├── Animasi: transition-all → properti spesifik
├── Warna bukan satu-satunya indikator (tambah icon)
├── Aria-live untuk notifikasi
├── Dimensi gambar eksplisit (CLS fix)
└── Truncate pada teks panjang

Iterasi 3 (Low):
├── Touch target ≥ 44x44px
├── Heading hierarchy fix
├── Intl.DateTimeFormat ganti hardcoded locale
├── select-none scoped conditional
└── react-hook-form refactor
```
