# UangKu - Sistem Manajemen Keuangan Keluarga

**UangKu** adalah platform manajemen keuangan keluarga yang dirancang untuk membantu keluarga melacak pendapatan, pengeluarannya, serta merencanakan masa depan finansial yang lebih baik melalui fitur anggaran (budgeting), target tabungan, dan bantuan AI Coach.

## 📂 Struktur Proyek

Proyek ini terbagi menjadi dua bagian utama: Backend dan Frontend.

### 1. Backend (`/backend`)
Menggunakan bahasa pemograman **Go** dengan framework **Gin** dan **GORM**.
- **`cmd/`**: Berisi entry point aplikasi (server) dan skrip utilitas seperti seeding.
- **`internal/`**: Logika bisnis inti.
  - **`services/`**: Tempat fungsionalitas utama seperti `AuthService`, `FinanceService`, `AiService`, dll.
  - **`models/`**: Definisi skema database dan struct data.
  - **`config/`**: Konfigurasi database, environment, dan inisialisasi sistem.
- **`routes/`**: Definisi endpoint API RESTful.

### 2. Frontend (`/frontend`)
Menggunakan **React** dengan **Vite**, **TypeScript**, dan **Tailwind CSS**.
- **`src/`**: Folder sumber utama.
  - **`views/`**: Halaman-halaman utama aplikasi (Dashboard, Transactions, dll).
  - **`components/`**: Komponen UI yang reusable.
  - **`services/`**: Integrasi dengan API backend.
  - **`store/`**: Manajemen state aplikasi.

---

## 🛠️ Migrasi & Data Seeding

Sistem ini menggunakan **GORM AutoMigrate** untuk manajemen skema database dan skrip khusus untuk pengisian data awal (seeding).

### Migrasi Database
Migrasi berjalan secara otomatis setiap kali server backend dijalankan.
- **Lokasi Logika**: `backend/internal/config/database.go` di dalam fungsi `ConnectDatabase()`.
- **Fungsi**: Skrip ini akan secara otomatis membuat atau memperbarui tabel berdasarkan model yang ada di `backend/internal/models`.

### Data Seeding (Pengisian Data Awal)
Untuk mengisi data awal seperti User Admin, data keluarga contoh, dan kategori anggaran, gunakan perintah berikut di dalam folder `backend`:

1. **Inisialisasi Database** (Membuat database jika belum ada):
   ```bash
   go run cmd/initdb/main.go
   ```

2. **Seeding Data Utama** (Admin, Keluarga, Dompet, Transaksi):
   ```bash
   go run cmd/seed/main.go
   ```

3. **Seeding Anggaran (Budget)**:
   ```bash
   go run cmd/seed_budget/main.go
   ```

---

## ✨ Fitur Utama

- 🏠 **Manajemen Keluarga**: Kelola anggota keluarga dan peran masing-masing.
- 💳 **Multi-Wallet**: Dukungan untuk berbagai jenis dompet (Tabungan, Tunai, Bank).
- 📊 **Pelacakan Keuangan**: Catat pendapatan, pengeluaran, dan transfer antar dompet.
- 🎯 **Target Tabungan & Goals**: Rencanakan masa depan dengan target menabung yang terukur.
- 🤖 **AI Financial Coach**: Konsultasi keuangan berbasis AI (OpenAI terintegrasi).
- 📄 **Smart OCR Scanner**: Pindai struk belanja secara otomatis untuk mencatat transaksi.
- 📅 **Manajemen Hutang**: Lacak hutang dan cicilan dengan pengingat otomatis.

---

## 🚀 Cara Menjalankan

### Backend
1. Pastikan PostgreSQL sudah jalan.
2. Salin `.env.example` menjadi `.env` di folder `backend` dan sesuaikan konfigurasinya.
3. Jalankan: `go run cmd/server/main.go`

### Frontend
1. Masuk ke folder `frontend`.
2. Install dependensi: `npm install`
3. Jalankan development server: `npm run dev`

---

© 2026 UangKu Team
