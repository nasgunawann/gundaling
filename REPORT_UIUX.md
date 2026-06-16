# Gundaling Farmstead POS — UI/UX Audit & Action Report

## 1. Rekomendasi Font & Warna
- **Font Utama & Tunggal:** `Plus Jakarta Sans` (400, 500, 600, 700) untuk legibilitas POS instan.
- **Tema Warna (Earthy Organic):**
  - Primary (Forest Green): `#2D5A27`
  - Secondary (Terracotta): `#C87A53`
  - Accent/CTA (Honey Gold): `#B38F2D`
  - Background (Warm Cream): `#FDFBF7`
  - Text (Espresso): `#2C1E17`
  - Muted (Oatmeal): `#F4EFEB`

## 2. Hasil Audit Halaman & Prioritas Perbaikan

### A. Critical (Bug / Fungsionalitas Patah)
1. **[KitchenDisplay.jsx]** Note item template literal bug: merender `"[object Object]"` bukan teks catatan karena salah interpolasi objek.
2. **[TableOrderView.jsx]** `product.desc.toLowerCase()` crash jika `desc` null/undefined pada catalog search.

### B. High Priority (Aksesibilitas & Penggunaan POS)
1. **[FloorPlan.jsx]** Touch & drag layout editor tidak bekerja di tablet/touchscreen karena hanya menggunakan event `onMouseDown`.
2. **[FloorPlan.jsx]** Teks di meja terlalu kecil (`text-[7px]` badge, `text-[9px]` seats) untuk dibaca dari jarak POS normal (>30cm).
3. **[KitchenDisplay.jsx]** Waktu elapsed order ("X min ago") tidak auto-refresh kecuali halaman dimuat ulang secara manual.
4. **[Reservations.jsx]** Tabel daftar booking tidak responsive di mobile dan meluber kesamping (overflow).

### C. Medium Priority (Feedback & Kenyamanan Visual)
1. **[KitchenDisplay.jsx]** Card terlambat (>15m) berkedip `animate-pulse` secara penuh, mengganggu konsentrasi koki. Diganti menjadi border error statis / penanda badge saja.
2. **[TableOrderView.jsx]** Textarea catatan item di cart selalu terbuka lebar menghabiskan space. Harus dibuat collapsible/klik icon catatan.
3. **[TableOrderView.jsx & WaiterLogin.jsx]** Tombol CTA yang memuat proses loading tidak berputar (`animate-spin` absen pada ikon `sync`).
4. **[WaiterLogin.jsx]** Animasi `animate-pulse` di error message mengganggu visual dan tidak representatif untuk error state.
5. **[Reservations.jsx]** Pengisian tanggal booking hardcoded hari ini saja. Harus ditambahkan input tanggal.
6. **[ReceiptModal.jsx]** Angka invoice berubah-ubah setiap kali render (random math dipanggil langsung di render flow).

### D. Low Priority (Optimasi Kode & Clean-Up)
1. **[KitchenDisplay.jsx]** Hapus state mati `activeTab` dan `setActiveTab`.
2. **[FloorPlan.jsx]** Bersihkan hardcoded array `defaultTables` saat data backend dimuat.
3. **[ProductEnrichment.jsx]** Perbaiki rendering markdown literal (`**Add New Dish**`) di panel kosong.
4. Perbaiki class non-standar Tailwind (`h-13`, `scale-102`) ke class bawaan standard.
