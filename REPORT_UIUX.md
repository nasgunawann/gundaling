# Gundaling Farmstead POS — UI/UX Audit & Action Report

## 1. Rekomendasi Font & Warna
- **Font Utama & Tunggal:** `Plus Jakarta Sans` (400, 500, 600, 700) untuk legibilitas POS instan.
- **Tema Warna (Earthy Organic) & Semantic Status:**
  - Primary (Forest Green): `#2D5A27`
  - Secondary (Terracotta): `#C87A53`
  - Accent/CTA (Honey Gold): `#B38F2D`
  - Background (Warm Cream): `#FDFBF7`
  - Text (Espresso): `#2C1E17`
  - Muted (Oatmeal): `#F4EFEB`
  - **Semantic Status (Baru):**
    - status-available: `#5C8A3C` (Hijau Terang)
    - status-pending: `#B38F2D` (Honey Gold)
    - status-occupied: `#C87A53` (Terracotta)
    - status-reserved: `#6B7A8D` (Slate Blue)
    - status-success: `#2D6A4F` (Deep Green)
    - status-warning: `#B38F2D` (Amber)
    - status-danger: `#ba1a1a` (Red)

## 2. Hasil Audit Halaman & Prioritas Perbaikan

### A. Critical (Bug / Fungsionalitas Patah)
1. **[KitchenDisplay.jsx]** Note item template literal bug: merender `"[object Object]"` bukan teks catatan karena salah interpolasi objek. (Fixed)
2. **[TableOrderView.jsx]** `product.desc.toLowerCase()` crash jika `desc` null/undefined pada catalog search. (Fixed)

### B. High Priority (Aksesibilitas & Penggunaan POS)
1. **[FloorPlan.jsx]** Touch & drag layout editor tidak bekerja di tablet/touchscreen karena hanya menggunakan event `onMouseDown`. (Fixed)
2. **[FloorPlan.jsx]** Teks di meja terlalu kecil (`text-[7px]` badge, `text-[9px]` seats) untuk dibaca dari jarak POS normal (>30cm). (Fixed & Rencana Refactor Layout)
3. **[KitchenDisplay.jsx]** Waktu elapsed order ("X min ago") tidak auto-refresh kecuali halaman dimuat ulang secara manual. (Fixed)
4. **[Reservations.jsx]** Tabel daftar booking tidak responsive di mobile dan meluber kesamping (overflow). (Fixed)
5. **[WaiterLogin.jsx]** Viewport overflow di mobile (halaman login bisa di-scroll sedikit secara vertikal). (Pending)
6. **[FloorPlan.jsx]** Layout teks di meja lingkaran sering meluber/terpotong ( awkward layout ). (Pending)
7. **[Reservations.jsx]** Tanggal reservasi tidak muncul di kolom tabel. (Pending)

### C. Medium Priority (Feedback & Kenyamanan Visual)
1. **[KitchenDisplay.jsx]** Card terlambat (>15m) berkedip `animate-pulse` secara penuh, mengganggu konsentrasi koki. Diganti menjadi border error statis / penanda badge saja. (Fixed)
2. **[TableOrderView.jsx]** Textarea catatan item di cart selalu terbuka lebar menghabiskan space. Harus dibuat collapsible/klik icon catatan. (Fixed)
3. **[TableOrderView.jsx & WaiterLogin.jsx]** Tombol CTA yang memuat proses loading tidak berputar (`animate-spin` absen pada ikon `sync`). (Fixed)
4. **[WaiterLogin.jsx]** Animasi `animate-pulse` di error message mengganggu visual dan tidak representatif untuk error state. (Fixed)
5. **[Reservations.jsx]** Pengisian tanggal booking hardcoded hari ini saja. Harus ditambahkan input tanggal. (Fixed)
6. **[ReceiptModal.jsx]** Angka invoice berubah-ubah setiap kali render (random math dipanggil langsung di render flow). (Fixed)
7. **[App.jsx]** Hapus `animate-pulse` dari ikon akses ditolak yang statis. (Pending)
8. **[WaiterLogin.jsx]** Hilangkan dependency URL Google image eksternal untuk background, ganti dengan CSS gradient. (Pending)
9. **[KitchenDisplay.jsx]** Kanban columns tidak dapat di-scroll secara independen. (Pending)

### D. Low Priority (Optimasi Kode & Clean-Up)
1. **[KitchenDisplay.jsx]** Hapus state mati `activeTab` dan `setActiveTab`. (Fixed)
2. **[FloorPlan.jsx]** Bersihkan hardcoded array `defaultTables` saat data backend dimuat. (Fixed)
3. **[ProductEnrichment.jsx]** Perbaiki rendering markdown literal (`**Add New Dish**`) di panel kosong. (Fixed)
4. Perbaiki class non-standar Tailwind (`h-13`, `scale-102`) ke class bawaan standard. (Fixed)
5. **[index.css]** Hapus import `Inter` font dari Google Fonts karena tidak terpakai. (Pending)
